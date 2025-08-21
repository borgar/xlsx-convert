/* eslint-disable require-atomic-updates, no-await-in-loop */
import * as fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';
import { parseXML } from '@borgar/simple-xml';

import { convertStyles } from './utils/convertStyles.js';
import { ConversionContext } from './ConversionContext.js';

import { handlerRels } from './handler/rels.js';
import { handlerWorkbook } from './handler/workbook.js';
import { handlerSharedStrings } from './handler/sharedstrings.js';
import { handlerPersons } from './handler/persons.js';
import { handlerTheme } from './handler/theme.js';
import { handlerStyles } from './handler/styles.js';
import { handlerRDStruct } from './handler/rdstuct.js';
import { handlerRDValue } from './handler/rdvalue.js';
import { handlerMetaData } from './handler/metadata.js';
import { handlerComments } from './handler/comments.js';
import { handlerWorksheet } from './handler/worksheet.js';
import { handlerExternal } from './handler/external.js';
import { handlerTable } from './handler/table.js';

/**
 * Convertion pptions
 *
 * @typedef ConversionOptions
 * @prop {boolean} [skip_merged]
 * @prop {boolean} [cell_styles]
 * @prop {boolean} [cell_z]
 */

/** @type {ConversionOptions} */
const DEFAULT_OPTIONS = {
  // skip cells that are a part of merges
  skip_merged: true,
  // styles are attached to cells rather than being included separately
  cell_styles: false,
  // number format is set as z on cells (in addition to existing as
  // 'number-format' in styles) [always true when cell_styles=true]
  cell_z: false
};

/**
 * Convert an XLSX file into a JSON format.
 *
 * @param {string} filename Target file to convert
 * @param {ConversionOptions} [options] Convertion options
 * @return {Promise<import('./jsf-types.js').JSFWorkbook>} A JSON spreadsheet formatted object.
 */
export default async function convert (filename, options = DEFAULT_OPTIONS) {
  return convertBinary(await fs.readFile(filename), filename, options);
}

/**
 * Convert an XLSX file into a JSON format.
 *
 * @param {Buffer | ArrayBuffer} buffer Buffer containing the file to convert
 * @param {string} filename Name of the file being converted
 * @param {ConversionOptions} [options] Convertion options
 * @return {Promise<import('./jsf-types.js').JSFWorkbook>} A JSON spreadsheet formatted object.
 */
export async function convertBinary (buffer, filename, options = DEFAULT_OPTIONS) {
  if (!(buffer instanceof ArrayBuffer || buffer instanceof Buffer)) {
    throw new Error('Input is not a valid binary');
  }
  const zip = new JSZip();
  const fdesc = await zip.loadAsync(buffer);

  /** @param {string} f */
  const getFile = async f => {
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

  /**
   * @param {ConversionContext} context
   * @param {string} type
   * @param {Function} handler
   * @param {any} [fallback=null]
   * @param {import('./handler/rels.js').Rel[] | null} [rels=null]
   */
  const maybeRead = async (context, type, handler, fallback = null, rels = null) => {
    const rel = (rels || context.rels)
      .find(d => d.type === type);
    if (rel) {
      return handler(await getFile(rel.target), context);
    }
    return fallback;
  };

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
        context, 'threadedComment', handlerComments, {}, sheetRels
      );

      // tables are accessed when external refs are normalized, so they have
      // to be read them before that happens
      const tableRels = sheetRels.filter(rel => rel.type === 'table');
      for (const tableRel of tableRels) {
        // eslint-disable-next-line no-await-in-loop
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

  if (options.cell_styles) {
    wb.styles = [];
  }

  return wb;
}
