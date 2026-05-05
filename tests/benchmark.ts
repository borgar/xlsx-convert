import { Bench, type Statistics, type Task } from 'tinybench';

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { convertBinary } from '../src/convertBinary.ts';
import { format } from 'numfmt';
import { join, dirname } from 'node:path';
import { color, printTable } from './utils/printTable.ts';
import { convertCSV } from '../src/convertCSV.ts';

const inputFolder = process.argv[2];
const outputFolder = process.argv[3];

const entries = await readdir(inputFolder, { recursive: true });
const xlsxFiles = entries.filter(f => /\.(xls[xt]|[ct]sv)$/.test(f)).sort();

if (!inputFolder) {
  console.error('Usage: benchmark.ts <input-folder> [output-folder]');
  process.exit(1);
}

if (xlsxFiles.length === 0) {
  console.error(`No .xlsx or .csv files found in ${inputFolder}`);
  process.exit(1);
}

const bench = new Bench({ time: 100 });

xlsxFiles.forEach(fn => {
  let bin: undefined | Buffer;
  let error: unknown = null;
  let workbook: unknown = null;

  bench.add(fn, async () => {
    try {
      workbook = /\.[ct]sv$/.test(fn)
        ? convertCSV(new TextDecoder().decode(bin), fn)
        : await convertBinary(bin!, fn);
    }
    catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      error = { name: e.name, message: e.message };
    }
  }, {
    beforeAll: async () => {
      bin = await readFile(join(inputFolder, fn));
    },
    afterAll: async () => {
      bin = undefined;
      if (outputFolder) {
        await mkdir(dirname(join(outputFolder, fn)), { recursive: true });
        if (workbook) {
          await writeFile(join(outputFolder, fn + '.jsf'), JSON.stringify(workbook, null, 2));
        }
        if (error) {
          await writeFile(join(outputFolder, fn + '.error'), JSON.stringify(error, null, 2));
        }
      }
    },
  });
});

await bench.run();

const fmt = (v: unknown, pattern = '0.000'): string => {
  if (v == null) { return 'N/A'; }
  if (typeof v !== 'number') { String(v); }
  const s = format(pattern, v);
  return color(s, 33);
};

printTable(bench.table((task: Task) => {
  // @ts-expect-error The prop is there but not typed?
  const result = (task.result.latency ?? {}) as Statistics;
  return {
    file: task.name,
    runs: fmt(task.runs, '0'),
    mean: fmt(result?.mean),
    min: fmt(result?.min),
    max: fmt(result?.max),
    p75: fmt(result?.p75),
    p99: fmt(result?.p99),
    p995: fmt(result?.p995),
    p999: fmt(result?.p999),
    stddev: fmt(result?.sd),
  };
}));
