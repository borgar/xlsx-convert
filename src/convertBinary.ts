import { Document, parseXML } from '@borgar/simple-xml';
import { attr } from './utils/attr.ts';
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
import { handlerNotes } from './handler/notes.ts';
import { handlerWorksheet } from './handler/worksheet.ts';
import { handlerExternal } from './handler/external.ts';
import { handlerTable } from './handler/table.ts';
import { handlerPivotCacheDefinition } from './handler/pivotCacheDefinition.ts';
import { handlerPivotCacheRecords } from './handler/pivotCacheRecords.ts';
import { handlerPivotTable } from './handler/pivotTable.ts';
import type { Workbook, PivotTable, PivotCache } from '@jsfkit/types';
import type { ConversionOptions } from './index.ts';
import { EncryptionError, InvalidFileError, MissingSheetError } from './errors.ts';
import { handlerDrawing } from './handler/drawing.ts';
import { arrayBufferToDataUri } from './utils/arrayBufferToDataUri.ts';
import { getMimeType } from './utils/getMimeType.ts';
import { isLikelyGSExport } from './utils/isLikelyGSExport.ts';

function toArrayBuffer (buffer: Buffer): ArrayBuffer {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  new Uint8Array(arrayBuffer).set(buffer);
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
): Promise<Workbook> {
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

  const getBinaryFile = async (f: string) => {
    try {
      let fd = await zip.readFile(f, 'binary');
      if (!fd && f.startsWith('xl/xl/')) {
        fd = await zip.readFile(f.slice(3), 'binary');
      }
      return fd ?? null;
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
    const rel = (rels || context.rels).find(d => d.type === type);
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
  context.isLikelyGSExport = isLikelyGSExport(zip);

  // workbook - read DOM first to get externalReferences order
  const wbDom = await getFile(wbRel.target);

  // external links - use order from <externalReferences> in workbook.xml,
  // not the document order in workbook.xml.rels (which can differ)
  const extRefRIds = wbDom.getElementsByTagName('externalReference')
    .map(d => attr(d, 'r:id'));
  for (const rId of extRefRIds) {
    const rel = context.rels.find(d => d.id === rId);
    if (rel) {
      const extRels = await getRels(rel.target);
      const targetRel = extRels.find(d => d.id === 'rId1');
      const target = targetRel?.target;
      if (target) {
        const exlink = handlerExternal(await getFile(rel.target), target);
        context.externalLinks.push(exlink);
        if (targetRel.type.endsWith('xlPathMissing')) {
          exlink.pathMissing = true;
        }
      }
      else {
        // TODO: Throw in strict mode?
      }
    }
  }

  // workbook
  const wb = handlerWorkbook(wbDom, context);
  context.workbook = wb;
  // copy external links in
  if (context.externalLinks.length) {
    wb.externals = context.externalLinks;
  }

  // strings
  context.sst = await maybeRead(context, 'sharedStrings', handlerSharedStrings, []);

  // persons
  const people = await maybeRead(context, 'person', handlerPersons, []);

  // richData
  context.richStruct = await maybeRead(context, 'rdRichValueStructure', handlerRDStruct);
  context.richValues = await maybeRead(context, 'rdRichValue', handlerRDValue);

  // metadata
  context.metadata = await maybeRead(context, 'sheetMetadata', handlerMetaData);

  // pivot caches (workbook-level) — prefer order from <pivotCaches> in workbook.xml
  // over the document order in workbook.xml.rels (which can differ)
  const pivotCacheRIds = wbDom.querySelectorAll('pivotCaches > pivotCache')
    .map(d => attr(d, 'r:id'));
  const pivotCacheRels = pivotCacheRIds.length > 0
    ? pivotCacheRIds.map(rId => context.rels.find(d => d.id === rId)).filter((d): d is Rel => d != null)
    : context.rels.filter(d => d.type === 'pivotCacheDefinition');

  const cacheResults = await Promise.all(pivotCacheRels.map(async cacheRel => {
    const [ cacheDom, cacheDefRels ] = await Promise.all([
      getFile(cacheRel.target),
      getRels(cacheRel.target),
    ]);
    if (!cacheDom) { return null; }
    const cache = handlerPivotCacheDefinition(cacheDom);
    if (!cache) { return null; }
    // read the cache records via the cache definition's rels
    const recordsRel = cacheDefRels.find(d => d.type === 'pivotCacheRecords');
    if (recordsRel) {
      const recordsDom = await getFile(recordsRel.target);
      if (recordsDom) {
        const records = handlerPivotCacheRecords(recordsDom);
        if (records.length > 0) {
          cache.records = records;
        }
      }
    }
    return { cache, target: cacheRel.target };
  }));
  const cachePathToCache = new Map<string, PivotCache>();
  for (const result of cacheResults) {
    if (result) {
      cachePathToCache.set(result.target, result.cache);
    }
  }

  // theme
  const themeRel = context.rels.find(d => d.type === 'theme');
  const themeRels = themeRel ? await getRels(themeRel.target) : [];
  context.theme = await maybeRead(context, 'theme', handlerTheme, null, themeRels) ?? getBlankTheme();

  // styles
  const styleDefs = await maybeRead(context, 'styles', handlerStyles);
  wb.styles = convertStyles(styleDefs);

  wb.pivotTables = [];

  // worksheets — processed sequentially to avoid shared-state races
  for (const [ index, sheetLink ] of context.sheetLinks.entries()) {
    const sheetRel = context.rels.find(d => d.id === sheetLink.rId);
    if (sheetRel) {
      const sheetName = sheetLink.name || `Sheet${sheetLink.index}`;
      const sheetRels = await getRels(sheetRel.target);

      // tables are accessed when external refs are normalized, so they have
      // to be read before that happens
      const tableRels = sheetRels.filter(rel => rel.type === 'table');
      for (const tableRel of tableRels) {
        const tableDom = await getFile(tableRel.target);
        const table = handlerTable(tableDom, context);
        if (table) {
          table.sheet = sheetName;
          wb.tables.push(table);
        }
      }

      const pivotTableRels = sheetRels.filter(rel => rel.type === 'pivotTable');
      for (const ptRel of pivotTableRels) {
        const ptDom = await getFile(ptRel.target);
        if (ptDom) {
          const pt = handlerPivotTable(ptDom);
          if (pt) {
            pt.sheet = sheetName;
            // resolve cache from pivot table's rels -> pivotCacheDefinition
            const ptRels = await getRels(ptRel.target);
            const ptCacheRel = ptRels.find(d => d.type === 'pivotCacheDefinition');
            let cacheResolved = false;
            if (ptCacheRel) {
              const cache = cachePathToCache.get(ptCacheRel.target);
              if (cache) {
                pt.cache = cache;
                cacheResolved = true;
              }
            }
            // Only include pivot tables whose cache was successfully parsed
            if (cacheResolved) {
              wb.pivotTables.push(pt as PivotTable);
            }
            else {
              // TODO: use a structured warning callback (e.g. options.onWarning) instead of
              // console.warn, so consumers can intercept or suppress diagnostics.
              console.warn(`Pivot table "${pt.name}" on sheet "${sheetName}" dropped: cache definition not found (rel target: ${ptCacheRel?.target ?? 'none'})`);
            }
          }
        }
      }

      // convert the sheet
      const sheetFile = await getFile(sheetRel.target);
      if (!sheetFile) {
        throw new MissingSheetError('Missing sheet file: ' + sheetRel.target);
      }

      context.images = [];
      const sh = handlerWorksheet(sheetFile, context, sheetRels, sheetName);

      // Notes (old school, 90s, sticky notes).
      const notes = await maybeRead(context, 'comments', handlerNotes, [], sheetRels);
      if (notes.length > 0) {
        sh.notes = notes;
      }

      // Threaded comments (since Excel 2019).
      const comments = await maybeRead(context, 'threadedComment', handlerComments, [], sheetRels);
      if (comments.length > 0) {
        sh.comments = comments;
      }

      wb.sheets[index] = sh;

      // process images
      if (context.images.length) {
        let imageCount = 0;
        const images = {};
        for (const img of context.images) {
          if (img.type === 'picture') {
            // sheet.background = ...

            // only do this once per image file
            if (!images[img.rel.target]) {
              // img.rel.type should be "image"
              const fileData = await getBinaryFile(img.rel.target);
              if (fileData) {
                const mime = getMimeType(img.rel.target);
                let imageValue: string | null = null;
                if (options.imageCallback) {
                  const ret = await options.imageCallback(fileData, img.rel.target);
                  if (typeof ret === 'string') { imageValue = ret; }
                }
                if (typeof imageValue !== 'string') {
                  imageValue = await arrayBufferToDataUri(fileData, mime);
                }
                images[img.rel.target] = imageValue;
                imageCount++;
              }
            }
          }
          if (img.type === 'drawing' && img.rel.type === 'drawing') {
            const drawingDom = await getFile(img.rel.target);
            context.drawingRels = await getRels(img.rel.target);
            sh.drawing = handlerDrawing(drawingDom, context);
          }
        }
        if (imageCount) {
          wb.images ??= {};
          Object.assign(wb.images, images);
        }
      }
    }
    else {
      // TODO: add strict mode that: throw new Error('No rel found for sheet ' + sheetLink.rId);
    }
  }

  // Sort pivot tables by sheet position, then by name within each sheet.
  // Sheet order is already guaranteed by sequential processing, but rels
  // order within a sheet is not deterministic by name.
  if (wb.pivotTables.length > 1) {
    const sheetOrder = new Map(context.sheetLinks.map((sl, i) => [ sl.name || `Sheet${sl.index}`, i ]));
    wb.pivotTables.sort((a, b) => {
      const si = (sheetOrder.get(a.sheet) ?? Infinity) - (sheetOrder.get(b.sheet) ?? Infinity);
      return si !== 0 ? si : a.name.localeCompare(b.name);
    });
  }

  if (wb.pivotTables.length === 0) {
    delete wb.pivotTables;
  }

  // Store people from the workbook.
  if (people.length > 0) {
    wb.people = people;
  }

  if (!options.cellFormulas) {
    wb.formulas = [ ...context._formulasR1C1.list() ];
  }

  return wb;
}
