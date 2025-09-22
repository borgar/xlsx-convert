import fs from 'fs';
import convert from '../src/index.ts';
import { deepStrictEqual } from 'assert';

const UPDATE = !!process.env.UPDATE_TESTS;

const tests = [
  'tests/files/a-single-lambda.xlsx',
  'tests/files/ascii.xlsx',
  'tests/files/background-color.xlsx',
  'tests/files/borders.xlsx',
  'tests/files/cse.xlsx',
  'tests/files/charts-and-images.xlsx',
  'tests/files/date-time.xlsx',
  'tests/files/emojii.xlsx',
  'tests/files/external-refs.xlsx',
  'tests/files/fonts.xlsx',
  'tests/files/hyperlinks.xlsx',
  'tests/files/iterative-calculations.xlsx',
  'tests/files/literals.xlsx',
  'tests/files/merged-cells.xlsx',
  'tests/files/multiple-sheets.xlsx',
  'tests/files/names.xlsx',
  'tests/files/numbers.xlsx',
  'tests/files/row-col-widths.xlsx',
  'tests/files/simple-formulas.xlsx',
  'tests/files/spilling.xlsx',
  'tests/files/strings.xlsx',
  'tests/files/table.xlsx',
  'tests/files/text-alignment.xlsx',
  'tests/files/text-color.xlsx',
  'tests/files/text-rotation.xlsx',
  'tests/files/epoch1900.xlsx',
  'tests/files/epoch1900-strict.xlsx',
  'tests/files/epoch1904.xlsx',
  'tests/files/epoch1904-strict.xlsx',
  'tests/files/table-styles.xlsx',
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
  const wb = await convert(xlsxFilename);

  const resultJson = JSON.parse(JSON.stringify(wb));
  let expectJson = {};
  try {
    expectJson = JSON.parse(fs.readFileSync(testFilename, 'utf8'));
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
    diff = String(err.message).split('\n').map(d => '  ' + d).join('\n');
  }

  if (diff && UPDATE) {
    // save a new version of the converted file
    fs.writeFileSync(
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

async function runTests () {
  const results = [];

  await Promise.all(tests.map(async (testFilename, index) => {
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
  log(`1..${tests.length}`);
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

await runTests();
