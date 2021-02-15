/* eslint-disable require-atomic-updates */
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const promisify = require('util').promisify;
const readFile = promisify(fs.readFile);
const xml = require('@borgar/simple-xml');

const handlerRels = require('./rels');
const handlerWorkbook = require('./workbook');
const handlerStrings = require('./sharedstrings');
const handlerPersons = require('./persons');
const handlerTheme = require('./theme');
const handlerStyles = require('./styles');
const handlerRDStuct = require('./rdstuct');
const handlerRDValue = require('./rdvalue');
const handlerMetadata = require('./metadata');
const handlerComments = require('./comments');
const handlerSheet = require('./worksheet');

const DEFAULT_OPTIONS = { styles: true };

exports.load = async function load (fn, options = DEFAULT_OPTIONS) {
  const zip = new JSZip();
  const fdesc = await zip.loadAsync(await readFile(fn));

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
  wb.styles = await maybeRead(wb, 'styles', handlerStyles);

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
    }
    else {
      throw new Error('No rel found for sheet ' + sheet.$rId);
    }
  }));

  return wb;
};

