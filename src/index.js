/* eslint-disable require-atomic-updates */
import fs_ from 'fs';
const fs = fs_.promises;
import path from 'path';
import JSZip from 'jszip';
import xml from '@borgar/simple-xml';
import convertStyles from './utils/convertStyles.js';

import handlerRels from './rels.js';
import handlerWorkbook from './workbook.js';
import handlerStrings from './sharedstrings.js';
import handlerPersons from './persons.js';
import handlerTheme from './theme.js';
import handlerStyles from './styles.js';
import handlerRDStuct from './rdstuct.js';
import handlerRDValue from './rdvalue.js';
import handlerMetadata from './metadata.js';
import handlerComments from './comments.js';
import handlerSheet from './worksheet.js';

const DEFAULT_OPTIONS = {
  // skip cells that are a part of merges
  skip_merged: true,
  // styles are attached to cells rather than being included separately
  cell_styles: false,
  // number format is set as z on cells (in addition to existing as 'number-format' in styles)
  // [always true when cell_styles=true]
  cell_z: false
};

export default async function convert (fn, options = DEFAULT_OPTIONS) {
  const zip = new JSZip();
  const raw = fn instanceof Buffer ? fn : await fs.readFile(fn);
  const fdesc = await zip.loadAsync(raw);

  const getFile = async f => {
    const fd = fdesc.file(f);
    if (fd) {
      return xml.parse(await fd.async('string'));
    }
    return null;
  };

  const getRels = async (f = '') => {
    const fDir = path.dirname(f);
    const fBfn = path.basename(f);
    const relsPath = path.join(fDir, '_rels', `${fBfn}.rels`);
    return handlerRels(await getFile(relsPath), f);
  };

  const maybeRead = async (wb, type, handler, fallback = null, rels = null) => {
    const rel = (rels || wb.rels).find(d => d.type === type);
    if (rel) {
      return handler(await getFile(rel.target), wb);
    }
    return fallback;
  };

  // manifest
  const baseRels = await getRels();
  const wbRel = baseRels.find(d => d.type === 'officeDocument');

  // workbook
  const wb = handlerWorkbook(await getFile(wbRel.target));
  wb.filename = path.basename(fn);
  wb.rels = await getRels(wbRel.target);
  wb.options = Object.assign({}, DEFAULT_OPTIONS, options);

  // strings
  wb.sst = await maybeRead(wb, 'sharedStrings', handlerStrings, []);

  // persons
  wb.persons = await maybeRead(wb, 'person', handlerPersons);

  // theme / styles
  wb.theme = await maybeRead(wb, 'theme', handlerTheme);
  wb.styleDefs = await maybeRead(wb, 'styles', handlerStyles);
  wb.styles = convertStyles(wb.styleDefs);

  // richData (needed for Excel 2020 compatibility)
  wb.richStuct = await maybeRead(wb, 'rdRichValueStructure', handlerRDStuct);
  wb.richValues = await maybeRead(wb, 'rdRichValue', handlerRDValue);

  // metadata
  wb.metadata = await maybeRead(wb, 'sheetMetadata', handlerMetadata);

  // worksheets
  await Promise.all(wb.sheets.map(async (sheet, sheetIndex) => {
    const sheetRel = wb.rels.find(d => d.id === sheet.$rId);
    if (sheetRel) {
      const sheetRels = await getRels(sheetRel.target);

      // Note: This supports only threaded comments, not old-style comments
      wb.comments = await maybeRead(
        wb, 'threadedComment', handlerComments, null, sheetRels
      );

      const sh = handlerSheet(await getFile(sheetRel.target), wb);
      sh.name = sheet.name || `Sheet${sheetIndex + 1}`;
      wb.sheets[sheetIndex] = sh;

      delete wb.comments;
    }
    else {
      throw new Error('No rel found for sheet ' + sheet.$rId);
    }
  }));

  if (options.cell_styles) {
    wb.styles = [];
  }

  return wb;
}
