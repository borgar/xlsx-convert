import { convertBinary, convertCSV } from '../src/index.ts';
import { readFile, writeFile } from 'fs/promises';
import { deepStrictEqual } from 'assert';

const UPDATE = !!process.env.UPDATE_TESTS;

const tests = [
  // Excel conversion
  'tests/excel/a-single-lambda.xlsx',
  'tests/excel/ascii.xlsx',
  'tests/excel/background-color.xlsx',
  'tests/excel/borders.xlsx',
  'tests/excel/cse.xlsx',
  'tests/excel/charts-and-images.xlsx',
  'tests/excel/date-time.xlsx',
  'tests/excel/emojii.xlsx',
  'tests/excel/external-refs.xlsx',
  'tests/excel/fonts.xlsx',
  'tests/excel/hyperlinks.xlsx',
  'tests/excel/iterative-calculations.xlsx',
  'tests/excel/literals.xlsx',
  'tests/excel/merged-cells.xlsx',
  'tests/excel/multiple-sheets.xlsx',
  'tests/excel/names.xlsx',
  'tests/excel/numbers.xlsx',
  'tests/excel/row-col-widths.xlsx',
  'tests/excel/simple-formulas.xlsx',
  'tests/excel/spilling.xlsx',
  'tests/excel/strings.xlsx',
  'tests/excel/table.xlsx',
  'tests/excel/text-alignment.xlsx',
  'tests/excel/text-color.xlsx',
  'tests/excel/text-rotation.xlsx',
  'tests/excel/epoch1900.xlsx',
  'tests/excel/epoch1900-strict.xlsx',
  'tests/excel/epoch1904.xlsx',
  'tests/excel/epoch1904-strict.xlsx',
  'tests/excel/table-styles.xlsx',
  // CSV conversion
  'tests/csv/boolean-variations.csv',
  'tests/csv/complex-mixed-types.csv',
  'tests/csv/date-format-variations.csv',
  'tests/csv/duplicate-header-names.csv',
  'tests/csv/value-edge-cases.csv',
  'tests/csv/whitespace-nightmare.csv',
  'tests/csv/semicolon-delimiter.csv',
  'tests/csv/special-null-values.csv',
  'tests/csv/tab-delimiter.tsv',
  'tests/csv/numeric-stress-test.csv',
  'tests/csv/mixed-quoting-styles.csv',
  'tests/csv/minimal-single-column.csv',
  'tests/csv/line-ending-variations.csv',
  'tests/csv/inconsistent-row-lengths.csv',
  'tests/csv/hard-to-detect-headers.csv',
  'tests/csv/problematic-headers.csv',
  'tests/csv/no-header-ambiguous.csv',
  'tests/csv/header-type-mismatch.csv',
  'tests/csv/header-only.csv',
  'tests/csv/headers-with-special-chars.csv',

];

function makeNiceJson (ent) {
  let keyIdx = 1;
  const _tempStore = new Map();
  function formatJSON (obj) {
    const keys = Object.keys(obj);
    const pairs = keys.map(key => JSON.stringify(key) + ': ' + JSON.stringify(obj[key]));
    return `{ ${pairs.join(', ')} }`;
  }
  function replacer (key, value) {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'object') {
      const values = Object.values(value);
      const hasNesting = values.some(d => typeof d === 'object');
      if (values.length && !hasNesting) {
        const str = formatJSON(value);
        if (str.length < 50) {
          const key = '~~xlsx-convert~~' + (keyIdx++);
          _tempStore.set(key, str);
          return key;
        }
      }
    }
    return value;
  }
  return JSON
    .stringify(ent, replacer, 2)
    .replace(/"(~~xlsx-convert~~\d+)"/g, (_, key) => _tempStore.get(key));
}

async function testFile (xlsxFilename: string, testFilename: string): Promise<string> {
  let wb;
  if (xlsxFilename.endsWith('.xlsx')) {
    const src = await readFile(xlsxFilename);
    wb = await convertBinary(src, xlsxFilename);
  }
  else if (/\.[ct]sv/.test(xlsxFilename)) {
    const src = await readFile(xlsxFilename, 'utf8');
    wb = convertCSV(src, xlsxFilename, { table: true });
  }

  const resultJson = JSON.parse(JSON.stringify(wb));
  let expectJson = {};
  try {
    expectJson = JSON.parse(await readFile(testFilename, 'utf8'));
  }
  catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  let diff = '';
  try {
    deepStrictEqual(resultJson, expectJson);
  }
  catch (err) {
    // re-indent
    diff = String(err.message)
      .replace(/\.\.\./g, '…') // "..." has significance in TAP
      .split('\n')
      .map(d => '  ' + d)
      .join('\n');
  }

  if (diff && UPDATE) {
    // save a new version of the converted file
    await writeFile(
      testFilename.replace(/(\.json)?$/, '.json'),
      makeNiceJson(resultJson),
      'utf8',
    );
    return '';
  }
  return diff;
}

function log (message = '') {
  // eslint-disable-next-line
  console.log(message);
}

async function runTests (filterText: string = '') {
  const results = [];

  const testsToRun = tests.filter(fn => {
    return fn.toLowerCase().includes(filterText.toLowerCase());
  });

  await Promise.all(testsToRun.map(async (testFilename, index) => {
    let diff = '';
    let error = null;
    try {
      diff = await testFile(
        testFilename,
        testFilename + '.json',
      );
    }
    catch (err) {
      error = err;
    }
    results.push({
      ok: !diff && !error,
      error: error,
      diff: diff,
      test: testFilename,
      index: index + 1,
    });
  }));

  log('TAP version 13');
  log(`1..${testsToRun.length}`);
  let fails = 0;
  let passes = 0;
  results.sort((a, b) => a.index - b.index);
  results.forEach(d => {
    if (d.ok) {
      passes++;
      log(`ok ${d.index} - ${d.test}`);
    }
    else {
      fails++;
      log(`not ok ${d.index} - ${d.test}`);
      if (d.error) {
        log(d.error);
        process.exit(1);
      }
      if (d.diff) {
        log('  ---');
        log(d.diff);
        log('  ...');
      }
    }
  });

  log();
  log(`# tests ${results.length}`);
  if (passes) {
    log(`# pass ${passes}`);
  }
  if (fails) {
    log(`# fail ${fails}`);
  }

  log();
  if (fails) {
    process.exit(1);
  }
  else {
    log('# ok');
    log();
  }
}

await runTests(process.argv[2] || '');
