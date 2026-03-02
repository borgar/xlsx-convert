#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import { convertBinary, convertCSV } from './index.ts';

type CliOptions = {
  input?: string;
  output?: string;
};

function printUsage (): void {
  const usage = [
    'Usage: xlsx-convert <input> [-o <output>]',
    '',
    'Converts .xlsx to JSON via convertBinary,',
    'and .csv to JSON via convertCSV.',
    '',
    'Options:',
    '  -o, --output <file>  Write JSON output to a file (defaults to stdout)',
    '  -h, --help           Show this help text',
  ].join('\n');
  process.stdout.write(usage + '\n');
}

function parseArgs (args: string[]): CliOptions | null {
  const opts: CliOptions = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-h' || arg === '--help') {
      return null;
    }
    if (arg === '-o' || arg === '--output') {
      const next = args[i + 1];
      if (!next) {
        throw new Error('Missing value for -o/--output');
      }
      opts.output = next;
      i++;
      continue;
    }
    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    }
    if (opts.input) {
      throw new Error(`Unexpected argument: ${arg}`);
    }
    opts.input = arg;
  }
  return opts;
}

async function main (): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));
  if (!parsed) {
    printUsage();
    process.exit(0);
  }
  if (!parsed.input) {
    process.stderr.write('Error: No input file specified.\n');
    process.exit(1);
  }

  const input = parsed.input;
  const lower = input.toLowerCase();
  const ext = extname(lower);
  let outputJson: string;

  if (ext === '.csv') {
    const csvText = await readFile(input, 'utf8');
    const workbook = convertCSV(csvText, basename(input));
    outputJson = JSON.stringify(workbook);
  }
  else if (ext === '.xlsx' || ext === '.xlsm') {
    const bin = await readFile(input);
    const workbook = await convertBinary(bin, input);
    outputJson = JSON.stringify(workbook);
  }
  else {
    throw new Error('Unsupported file type. Expected .xlsx, .xlsm, or .csv.');
  }

  if (parsed.output) {
    await writeFile(parsed.output, outputJson + '\n');
  }
  else {
    process.stdout.write(outputJson + '\n');
  }
}

main().catch(err => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`Error: ${message}\n`);
  process.exit(1);
});
