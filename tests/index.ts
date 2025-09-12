import fs from 'fs';
import convert from '../src/index.ts';

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
];

function getType (a) {
  if (a === null) { return 'null'; }

  if (a === undefined) { return 'undefined'; }
  if (typeof a === 'number') { return 'number'; }
  if (typeof a === 'string') { return 'string'; }
  if (typeof a === 'boolean') { return 'boolean'; }
  if (Array.isArray(a)) { return 'array'; }
  // eslint-disable-next-line
  if (a !== null && typeof a === 'object' && Object.getPrototypeOf(a).isPrototypeOf(Object)) { return 'object'; }
  return null;
}

type Path = (string | number)[];

function compare (x, y, _path: Path = []) {
  const typeX = getType(x);
  const typeY = getType(y);
  if (!typeX || !typeY) {
    throw new Error(`Invalid type at ${_path.join('.')}`);
  }
  else if (typeX !== typeY) {
    return {
      error: 'type mismatch',
      path: _path,
      mine: x,
      other: y,
    };
  }
  else if (typeX === 'array') {
    const len = Math.max(typeX.length, typeY.length);
    for (let i = 0; i < len; i++) {
      const err = compare(x[i], y[i], [ ..._path, i ]);
      if (err) {
        return err;
      }
    }
  }
  else if (typeX === 'object') {
    const keys = Array.from(new Set([ ...Object.keys(x), ...Object.keys(y) ]));
    for (const key of keys) {
      const err = compare(x[key], y[key], [ ..._path, key ]);
      if (err) {
        return err;
      }
    }
  }
  else {
    const sameNaN = isNaN(x) && isNaN(y) && typeX === 'number' && typeY === 'number';
    // same or two nans
    if (x !== y && !sameNaN) {
      return {
        error: 'value mismatch',
        path: _path,
        mine: x,
        other: y,
      };
    }
  }
  return null;
}

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

async function testFile (xlsxFilename: string, testFilename: string) {
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

  const diff = compare(resultJson, expectJson);
  if (diff && UPDATE) {
    // save a new version of the converted file
    fs.writeFileSync(
      testFilename.replace(/(\.json)?$/, '.json'),
      makeNiceJson(resultJson),
      'utf8',
    );
    return false;
  }
  return diff;
}

function log (message = '') {
  // eslint-disable-next-line
  console.log(message);
}

function renderPath (path: Path) {
  return path.reduce((a, c) => {
    if (!a) { return c; }
    if (typeof c === 'number' || /\W/.test(c)) {
      return a + '[' + JSON.stringify(c) + ']';
    }
    return a + '.' + c;
  }, '');
}

async function runTests () {
  const results = [];

  await Promise.all(tests.map(async (testFilename, index) => {
    let diff = false;
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
        const { path, mine, other } = d.diff;
        log('  ---');
        log('    operator: equal');
        log('    expected: ' + renderPath(path) + ' = ' + JSON.stringify(other));
        log('    actual: ' + renderPath(path) + ' = ' + JSON.stringify(mine));
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

