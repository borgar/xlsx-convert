import { performance } from 'node:perf_hooks';
import { readdir, writeFile, mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { convert } from './src/index.ts';

type Stats = {
  count: number;
  min: number;
  max: number;
  median: number;
  average: number;
  stddev: number;
  p1: number;
  p10: number;
  p90: number;
  p99: number;
};

type Result = {
  file: string;
  fileSizeMB: number;
  durationMs: number;
  success: boolean;
  error?: { name: string; message: string };
};

function log (msg: string) {
  process.stderr.write(msg + '\n');
}

function formatDuration (ms: number): string {
  const [ duration, unitName ] =
    Math.abs(ms) >= 1000
      ? [ ms / 1000, 's' ]
      : [ ms, 'ms' ];
  const decimalPlaces = duration === 0 ? 0 : Math.max(0, 3 - Math.ceil(Math.log10(Math.abs(duration) + 1e-12)));
  return `${duration.toFixed(decimalPlaces)} ${unitName}`;
}

function percentile (sorted: number[], p: number): number {
  if (sorted.length === 0) {
    return 0;
  }
  if (sorted.length === 1) {
    return sorted[0];
  }
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) {
    return sorted[lower];
  }
  const frac = index - lower;
  return sorted[lower] * (1 - frac) + sorted[upper] * frac;
}

function computeStats (durations: number[]): Stats {
  const sorted = [ ...durations ].sort((a, b) => a - b);
  const count = sorted.length;
  const min = sorted[0];
  const max = sorted[count - 1];
  const sum = sorted.reduce((a, b) => a + b, 0);
  const average = sum / count;
  const variance = sorted.reduce((acc, d) => acc + (d - average) ** 2, 0) / count;
  const stddev = Math.sqrt(variance);
  return {
    count,
    min,
    max,
    median: percentile(sorted, 50),
    average,
    stddev,
    p1: percentile(sorted, 1),
    p10: percentile(sorted, 10),
    p90: percentile(sorted, 90),
    p99: percentile(sorted, 99),
  };
}

function formatRate (msPerMB: number): string {
  if (msPerMB === 0) return '0 ms/MB';
  const digits = 3;
  const magnitude = Math.floor(Math.log10(Math.abs(msPerMB)));
  const decimalPlaces = Math.max(0, digits - 1 - magnitude);
  return `${msPerMB.toFixed(decimalPlaces)} ms/MB`;
}

function reportStats (label: string, stats: Stats, format: (n: number) => string = formatDuration) {
  log(`\n  ${label}:`);
  log(`    count:   ${stats.count}`);
  log(`    median:  ${format(stats.median)}`);
  log(`    average: ${format(stats.average)}`);
  log(`    stddev:  ${format(stats.stddev)}`);
  log(`    min:     ${format(stats.min)}`);
  log(`    max:     ${format(stats.max)}`);
  log(`    p1:      ${format(stats.p1)}`);
  log(`    p10:     ${format(stats.p10)}`);
  log(`    p90:     ${format(stats.p90)}`);
  log(`    p99:     ${format(stats.p99)}`);
}

async function main () {
  const inputFolder = process.argv[2];
  const outputFolder = process.argv[3];

  if (!inputFolder) {
    log('Usage: benchmark.ts <input-folder> [output-folder]');
    process.exit(1);
  }

  const entries = await readdir(inputFolder);
  const xlsxFiles = entries.filter(f => f.endsWith('.xlsx') && !f.startsWith('~$')).sort();

  if (xlsxFiles.length === 0) {
    log(`No .xlsx files found in ${inputFolder}`);
    process.exit(1);
  }

  log(`Benchmarking ${xlsxFiles.length} .xlsx files from ${inputFolder}`);

  if (outputFolder) {
    await mkdir(outputFolder, { recursive: true });
  }

  const results: Result[] = [];

  for (const file of xlsxFiles) {
    const filepath = join(inputFolder, file);
    const st = await stat(filepath);
    const fileSizeMB = st.size / (1024 * 1024);
    const start = performance.now();
    let success = true;
    let errorInfo: { name: string; message: string } | undefined;
    let workbook: unknown;

    try {
      workbook = await convert(filepath);
    }
    catch (err) {
      success = false;
      const e = err instanceof Error ? err : new Error(String(err));
      errorInfo = { name: e.name, message: e.message };
    }

    const durationMs = performance.now() - start;
    results.push({ file, fileSizeMB, durationMs, success, error: errorInfo });

    const status = success ? 'OK' : 'FAIL';
    const msPerMB = durationMs / fileSizeMB;
    log(`  ${formatDuration(durationMs).padStart(12)}  ${status}  ${file}  (${formatRate(msPerMB)})`);

    if (outputFolder) {
      const baseName = file.replace(/\.xlsx$/, '');
      if (success) {
        await writeFile(join(outputFolder, baseName + '.jsf'), JSON.stringify(workbook, null, 2));
      }
      else {
        await writeFile(join(outputFolder, baseName + '.error'), JSON.stringify(errorInfo, null, 2));
      }
    }
  }

  const allDurations = results.map(r => r.durationMs);
  const successDurations = results.filter(r => r.success).map(r => r.durationMs);
  const failCount = results.length - successDurations.length;

  reportStats('All conversions', computeStats(allDurations));

  const allRates = results.map(r => r.durationMs / r.fileSizeMB);
  const successRates = results.filter(r => r.success).map(r => r.durationMs / r.fileSizeMB);

  reportStats('All conversions (normalized)', computeStats(allRates), formatRate);

  if (failCount > 0 && successDurations.length > 0) {
    reportStats('Successful conversions only', computeStats(successDurations));
    reportStats('Successful conversions only (normalized)', computeStats(successRates), formatRate);
    log(`\n  Failures: ${failCount}`);
    for (const r of results) {
      if (!r.success) {
        log(`    ${r.file}: ${r.error?.name}: ${r.error?.message}`);
      }
    }
  }

  log('');
}

main().catch(err => {
  log(String(err));
  process.exit(1);
});
