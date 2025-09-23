import { format } from 'numfmt';
import { CSVParser } from './CSVParser.ts';
import type { JSFStyle, JSFTableColumn, JSFWorkbook } from './jsf-types.ts';
import { toA1 } from './utils/toA1.ts';

/** CSV convertion options */
export type CSVConversionOptions = {
  /**
   * The delimiter to use to parse the CSV. Normally this is auto-detected.
   * @defaultValue null
   */
  delimiter?: null | ',' | ';' | '\t';
  /**
   * The character used to escape quotation marks in strings.
   * @defaultValue '"'
   */
  escapeChar?: null | '\\' | '"';
  /**
   * Skip empty lines instead of creating empty rows.
   * @defaultValue true
   */
  skipEmptyLines?: boolean;
  /**
   * The name of the sheet to create in the resulting workbook.
   * @defaultValue 'Sheet1'
   */
  sheetName?: string;
  /**
   * The locale (as a BCP 47 string) to use when parsing dates and numbers.
   * @see {https://developer.mozilla.org/en-US/docs/Glossary/BCP_47_language_tag}
   * @defaultValue 'en-US'
   */
  locale?: string;
};

const EMPTY_COLUMN = { t: 0, b: 0, n: 0, d: 0, total: 0 };

/**
 * Convert a CSV/TSV into JSF format.
 *
 * The returned JSF structure contains all the data table found in the file presented as
 * a spreadsheet table.
 *
 * @param csvStream A string of CSV data
 * @param name Name of the file being converted, to be used as the workbook name
 * @param [options] Conversion options
 * @return A JSON spreadsheet formatted object.
 */
export function convertCSV (
  csvStream: string,
  name: string,
  options: CSVConversionOptions = {},
): JSFWorkbook {
  const parser = new CSVParser();
  if (options.skipEmptyLines === false) {
    parser.skipEmptyLines = false;
  }
  if (options.escapeChar) {
    parser.escapeChar = options.escapeChar;
  }
  if (options.locale) {
    parser.locale = options.locale;
  }
  const cells = parser.parse(csvStream, options.delimiter);

  const columns: JSFTableColumn[] = [];
  for (let col = 0; col < parser.width; col++) {
    columns[col] = { name: 'Column' + (col + 1), dataType: 'unknown' };
  }

  let likelyHeader = 0;
  let singleType = 0;
  for (let col = 0; col < parser.width; col++) {
    const headCell = cells[toA1(col, 0)] ?? { v: null };
    const count = parser.columns[col] ?? EMPTY_COLUMN;
    if (count.t === count.total) {
      // all text column
      // heading is sniffed by looking for for variations in text length, up to 20 rows
      // this is the same method Python's CSV parser uses
      singleType++;
      columns[col].dataType = 'text';
      const headLength = String(headCell.v || '').length;
      for (let row = 1; row < Math.min(20, parser.height); row++) {
        const cell = cells[toA1(col, row)];
        if (cell && String(cell.v).length !== headLength) {
          likelyHeader++;
          break;
        }
      }
    }
    else if (count.n === count.total) {
      // all numbers, unlikely to be a heading
      columns[col].dataType = 'number';
      singleType++;
    }
    else if (count.b === count.total) {
      // all booleans, unlikely to be a heading
      columns[col].dataType = 'boolean';
      singleType++;
    }
    else if (count.d === count.total) {
      // all dates, unlikely to be a heading
      columns[col].dataType = 'datetime';
      singleType++;
    }
    else if (
      count.t === 1 && typeof headCell.v === 'string' ||
      count.n === 1 && typeof headCell.v === 'number' ||
      count.b === 1 && typeof headCell.v === 'boolean' ||
      count.d === 1 && headCell.t === 'd'
    ) {
      // this column has only a single variant type which is *very likely* the header
      likelyHeader += 2;
      if (count.b === count.total - 1) {
        columns[col].dataType = 'boolean';
      }
      else if (count.n === count.total - 1) {
        columns[col].dataType = 'number';
      }
      else if (count.d === count.total - 1) {
        columns[col].dataType = 'datetime';
      }
      else if (count.t === count.total - 1) {
        columns[col].dataType = 'text';
      }
    }
  }

  // We have a header if:
  // - there is more than one row
  // - there is at least one likely header column
  // - the number of likely header columns is at least equal to the number of single-type columns
  const hasHeader = parser.height > 1 && likelyHeader >= singleType && likelyHeader > 0;
  if (hasHeader) {
    const usedNames = new Set();
    for (let col = 0; col < parser.width; col++) {
      const cellRef = toA1(col, 0);
      const column = columns[col];
      // ensure there is a cell object at the column header cell location
      if (!cells[cellRef]) {
        cells[cellRef] = { v: '' };
      }
      // use the cell's value as the column header as is possible
      const numFormat = parser.formats[cells[cellRef].s] || 'General';
      let newColName = format(numFormat, cells[cellRef].v ?? '') || columns[col].name;
      // name nust not be over 255 characters
      newColName = newColName.slice(0, 255);
      // name must not be duplicated
      let counter = 1;
      const orgName = newColName;
      while (usedNames.has(newColName.toLowerCase())) {
        newColName = orgName + (++counter);
      }
      // don't allow this name again, Excel is case-insensitive but allows whitespace
      usedNames.add(newColName.toLowerCase());
      // cell and column should have the same name/value
      column.name = newColName;
      cells[cellRef].v = newColName;
      delete cells[cellRef].t; // cell is to be treated as text
    }
  }

  const sheetName = options.sheetName || 'Sheet1';
  const table = {
    name: 'Table1',
    sheet: sheetName,
    ref: 'A1:' + toA1(parser.width - 1, parser.height - 1),
    headerRowCount: hasHeader ? 1 : 0,
    totalsRowCount: 0,
    columns: columns,
  };

  const output: JSFWorkbook = {
    name: name,
    sheets: [
      {
        name: sheetName,
        cells: cells,
        hidden: 0,
        columns: [],
        rows: [],
        merges: [],
        defaults: { colWidth: 65, rowHeight: 16 },
      },
    ],
    names: [],
    styles: parser.formats.map(pattern => {
      const fmt: JSFStyle = { fontFamily: 'Aptos Narrow', fontSize: 12 };
      if (pattern) {
        fmt.numberFormat = pattern;
      }
      return fmt;
    }),
    tables: (parser.width && parser.height) ? [ table ] : [],
  };

  return output;
}
