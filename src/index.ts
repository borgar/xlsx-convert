import * as fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';
import { Document, parseXML } from '@borgar/simple-xml';

import { convertStyles } from './utils/convertStyles.ts';
import { ConversionContext } from './ConversionContext.ts';

import { handlerRels, type Rel } from './handler/rels.ts';
import { handlerWorkbook } from './handler/workbook.ts';
import { handlerSharedStrings } from './handler/sharedstrings.ts';
import { handlerPersons } from './handler/persons.ts';
import { handlerTheme } from './handler/theme.ts';
import { handlerStyles } from './handler/styles.ts';
import { handlerRDStruct } from './handler/rdstuct.ts';
import { handlerRDValue } from './handler/rdvalue.ts';
import { handlerMetaData } from './handler/metadata.ts';
import { handlerComments } from './handler/comments.ts';
import { handlerWorksheet } from './handler/worksheet.ts';
import { handlerExternal } from './handler/external.ts';
import { handlerTable } from './handler/table.ts';
import type { JSFWorkbook } from './jsf-types.ts';

export type * from './jsf-types.ts';

/** Convertion options */
export type ConversionOptions = {
  /**
   * Skip cells that are a part of merges.
   * @defaultValue true
   */
  skipMerged?: boolean;
  /**
   * Formulas are attached to cells rather than being included as a separate list.
   * @defaultValue false
   */
  cellFormulas?: boolean;
};

/**
 * Default conversion options
 */
const DEFAULT_OPTIONS: ConversionOptions = {
  skipMerged: true,
  cellFormulas: false,
};

/**
 * Load and convert an XLSX file into a JSON format.
 *
 * The returned JSF structure contains most of the data from the original file, although some details
 * may be lost in the conversion process.
 *
 * @param filename Target filename to convert
 * @param options Conversion options
 * @param [options.skipMerged] Skip any cells that are a part of merges.
 * @param [options.cellFormulas] Formulas are attached to cells rather than being included separately.
 * @return A JSON spreadsheet object.
 */
export async function convert (
  filename: string,
  options: ConversionOptions,
): Promise<JSFWorkbook> {
  return convertBinary(await fs.readFile(filename), filename, options);
}

export default convert;

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
  options: ConversionOptions,
): Promise<JSFWorkbook> {
  if (!(buffer instanceof ArrayBuffer || buffer instanceof Buffer)) {
    throw new Error('Input is not a valid binary');
  }
  options = Object.assign({}, DEFAULT_OPTIONS, options);
  const zip = new JSZip();
  const fdesc = await zip.loadAsync(buffer);

  const getFile = async (f: string) => {
    const fd = fdesc.file(f);
    return fd
      ? parseXML(await fd.async('string'))
      : null;
  };

  const getRels = async (f = '') => {
    const fDir = path.dirname(f);
    const fBfn = path.basename(f);
    const relsPath = path.join(fDir, '_rels', `${fBfn}.rels`);
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
      return handler(await getFile(rel.target), context);
    }
    return fallback;
  }

  // manifest
  const baseRels = await getRels();
  const wbRel = baseRels.find(d => d.type === 'officeDocument');

  const context = new ConversionContext();
  context.rels = await getRels(wbRel.target);
  context.options = Object.assign({}, DEFAULT_OPTIONS, options);
  context.filename = path.basename(filename);

  // external links
  for (const rel of context.rels) {
    if (rel.type === 'externalLink') {
      const extRels = await getRels(rel.target);
      const fileName = extRels.find(d => d.id === 'rId1').target;
      const exlink = handlerExternal(await getFile(rel.target), fileName);
      context.externalLinks.push(exlink);
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
  context.theme = await maybeRead(context, 'theme', handlerTheme);
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
      const sh = handlerWorksheet(await getFile(sheetRel.target), context, sheetRels);
      sh.name = sheetName;
      wb.sheets[index] = sh;
    }
    else {
      throw new Error('No rel found for sheet ' + sheetLink.rId);
    }
  }));

  if (!options.cellFormulas) {
    wb.formulas = context._formulasR1C1;
  }

  return wb;
}
