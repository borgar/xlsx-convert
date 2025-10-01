import { Document, parseXML } from '@borgar/simple-xml';
import { pathBasename, pathDirname, pathJoin } from './utils/path.ts';
import { convertStyles } from './utils/convertStyles.ts';
import { loadZip, type FileContainer } from './utils/zip.ts';
import { CFBF, getBinaryFileType, ZIP } from './utils/getBinaryFileType.ts';
import { ConversionContext } from './ConversionContext.ts';
import { handlerRels, type Rel } from './handler/rels.ts';
import { handlerWorkbook } from './handler/workbook.ts';
import { handlerSharedStrings } from './handler/sharedstrings.ts';
import { handlerPersons } from './handler/persons.ts';
import { getBlankTheme, handlerTheme } from './handler/theme.ts';
import { handlerStyles } from './handler/styles.ts';
import { handlerRDStruct } from './handler/rdstuct.ts';
import { handlerRDValue } from './handler/rdvalue.ts';
import { handlerMetaData } from './handler/metadata.ts';
import { handlerComments } from './handler/comments.ts';
import { handlerWorksheet } from './handler/worksheet.ts';
import { handlerExternal } from './handler/external.ts';
import { handlerTable } from './handler/table.ts';
import type { JSFWorkbook } from './jsf-types.ts';
import type { ConversionOptions } from './index.ts';
import { EncryptionError, InvalidFileError, MissingSheetError } from './errors.ts';

function toArrayBuffer (buffer: Buffer): ArrayBuffer {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i];
  }
  return arrayBuffer;
}

/**
 * Default conversion options
 */
const DEFAULT_OPTIONS: ConversionOptions = {
  skipMerged: true,
  cellFormulas: false,
};

/**
 * Convert an XLSX binary into a JSON format.
 *
 * The returned JSF structure contains most of the data from the original file, although some details
 * may be lost in the conversion process.
 *
 * @param buffer Buffer containing the file to convert
 * @param filename Name of the file being converted
 * @param [options] Conversion options
 * @return A JSON spreadsheet formatted object.
 */
export async function convertBinary (
  buffer: Buffer | ArrayBuffer,
  filename: string,
  options?: ConversionOptions,
): Promise<JSFWorkbook> {
  if (typeof Buffer !== 'undefined' && buffer instanceof Buffer) {
    buffer = toArrayBuffer(buffer);
  }
  if (!(buffer instanceof ArrayBuffer)) {
    throw new InvalidFileError('Input is not a valid binary');
  }
  options = Object.assign({}, DEFAULT_OPTIONS, options);

  const fileType = getBinaryFileType(buffer);
  if (fileType === CFBF) {
    throw new EncryptionError('Input file is encrypted');
  }
  else if (fileType !== ZIP) {
    throw new InvalidFileError('Input file type is unsupported');
  }

  let zip: FileContainer;
  try {
    zip = loadZip(buffer);
  }
  catch (err) {
    throw new InvalidFileError('Input file type is corrupted or unsupported');
  }

  const getFile = async (f: string) => {
    try {
      let fd = await zip.readFile(f, 'utf8');
      if (!fd && f.startsWith('xl/xl/')) {
        fd = await zip.readFile(f.slice(3), 'utf8');
      }
      return fd ? parseXML(fd) : null;
    }
    catch (err) {
      throw new InvalidFileError('Input file type is corrupted');
    }
  };

  const getRels = async (f = '') => {
    const fDir = pathDirname(f);
    const fBfn = pathBasename(f);
    const relsPath = pathJoin(fDir, '_rels', `${fBfn}.rels`);
    return handlerRels(await getFile(relsPath), f);
  };

  async function maybeRead<T extends (dom: Document, context: ConversionContext) => any> (
    context: ConversionContext,
    type: string,
    handler: T,
    fallback: any = null,
    rels: Rel[] | null = null,
  ): Promise<ReturnType<T>> {
    const rel = (rels || context.rels)
      .find(d => d.type === type);
    if (rel) {
      const dom = await getFile(rel.target);
      if (dom) {
        return handler(dom, context);
      }
      else {
        throw new ReferenceError('Invalid file reference: ' + rel.target);
      }
    }
    return fallback;
  }

  // manifest
  const baseRels = await getRels();
  const wbRel = baseRels.find(d => d.type === 'officeDocument');

  const context = new ConversionContext();
  context.rels = await getRels(wbRel.target);
  context.options = options;
  context.filename = pathBasename(filename);

  // external links
  for (const rel of context.rels) {
    if (rel.type === 'externalLink') {
      const extRels = await getRels(rel.target);
      const fileName = extRels.find(d => d.id === 'rId1')?.target;
      if (fileName) {
        const exlink = handlerExternal(await getFile(rel.target), fileName);
        context.externalLinks.push(exlink);
      }
      else {
        // TODO: Throw in strict mode?
      }
    }
  }

  // workbook
  const wb = handlerWorkbook(await getFile(wbRel.target), context);
  context.workbook = wb;
  // copy external links in
  if (context.externalLinks.length) {
    wb.externals = context.externalLinks;
  }

  // strings
  context.sst = await maybeRead(context, 'sharedStrings', handlerSharedStrings, []);

  // persons
  context.persons = await maybeRead(context, 'person', handlerPersons);

  // richData
  context.richStruct = await maybeRead(context, 'rdRichValueStructure', handlerRDStruct);
  context.richValues = await maybeRead(context, 'rdRichValue', handlerRDValue);
  // metadata
  context.metadata = await maybeRead(context, 'sheetMetadata', handlerMetaData);

  // theme / styles
  context.theme = await maybeRead(context, 'theme', handlerTheme) ?? getBlankTheme();
  const styleDefs = await maybeRead(context, 'styles', handlerStyles);
  wb.styles = convertStyles(styleDefs);

  // worksheets
  await Promise.all(context.sheetLinks.map(async (sheetLink, index) => {
    const sheetRel = context.rels.find(d => d.id === sheetLink.rId);
    if (sheetRel) {
      const sheetName = sheetLink.name || `Sheet${sheetLink.index}`;
      const sheetRels = await getRels(sheetRel.target);

      // Note: This supports only threaded comments, not old-style comments
      context.comments = await maybeRead(
        context, 'threadedComment', handlerComments, {}, sheetRels,
      );

      // tables are accessed when external refs are normalized, so they have
      // to be read them before that happens
      const tableRels = sheetRels.filter(rel => rel.type === 'table');
      for (const tableRel of tableRels) {
        const tableDom = await getFile(tableRel.target);
        const table = handlerTable(tableDom, context);
        if (table) {
          table.sheet = sheetName;
          wb.tables.push(table);
        }
      }

      // convert the sheet
      const sheetFile = await getFile(sheetRel.target);
      if (!sheetFile) {
        throw new MissingSheetError('Missing sheet file: ' + sheetRel.target);
      }
      const sh = handlerWorksheet(sheetFile, context, sheetRels);
      sh.name = sheetName;
      wb.sheets[index] = sh;
    }
    else {
      // TODO: add strict mode that: throw new Error('No rel found for sheet ' + sheetLink.rId);
    }
  }));

  if (!options.cellFormulas) {
    wb.formulas = context._formulasR1C1;
  }

  return wb;
}
