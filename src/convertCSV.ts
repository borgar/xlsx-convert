import { format } from 'numfmt';
import { CSVParser } from './CSVParser.ts';
import type { JSFStyle, JSFTableColumn, JSFWorkbook } from './jsf-types.ts';
import { toA1 } from './utils/toA1.ts';

type CSVConversionOptions = {
  delimiter?: string; // default: ','
  quoteChar?: string; // default: '"'
  escapeChar?: string; // default: '"'
  skipEmptyLines?: boolean; // default: true
  trimWhitespace?: boolean; // default: true
  sheetName?: string; // default: 'Sheet1'
  // tablename
  // default font
  // table style?
  // locale?: string; // default: 'en-US'
};
// type QUOTE_NONE = 0;
// type QUOTE_ALL = 1;
// type QUOTE_MINIMAL = 2;
// type QUOTE_NONNUMERIC = 3;
// type QUOTE_NOTNULL = 4;
// type QUOTE_STRINGS = 5;
// dataType?: 'text' | 'number' | 'boolean' | 'datetime' | 'unknown';

export function convertCSV (
  csvStream: string,
  name: string,
  options?: CSVConversionOptions,
): JSFWorkbook {
  console.log(csvStream);

  const parser = new CSVParser();
  const cells = parser.parse(csvStream);

  const columns: JSFTableColumn[] = [];
  for (let col = 0; col < parser.width; col++) {
    columns[col] = { name: 'Column' + (col + 1), dataType: 'unknown' };
  }

  let likelyHeader = 0;
  // console.log(parser.columns, parser.columns.length, parser.width);
  for (let col = 0; col < parser.width; col++) {
    const headCell = cells[toA1(col, 0)] ?? { v: null };
    const count = parser.columns[col] ?? { t: 0, total: 0 };
    if (count.t === count.total) {
      // all text column
      columns[col].dataType = 'text';
      const headLength = String(headCell.v || '').length;
      // check for variations in text length, up to 20 rows
      for (let row = 1; row < Math.min(20, parser.height); row++) {
        const cell = cells[toA1(col, row)];
        if (cell && String(cell.v).length !== headLength) {
          likelyHeader++;
          break;
        }
      }
    }
    else if (count.t === 1 && typeof headCell.v === 'string') {
      // this column has only a single text string which is the header
      columns[col].dataType = 'number'; // determine which
      likelyHeader++;
    }
    // console.log(headCell, count);
    // console.log(columns[col]);
    // console.log('');
  }
  // console.log(likelyHeader);
  // console.log('');

  const hasHeader = likelyHeader > 0;
  if (hasHeader) {
    const usedNames = new Set();
    for (let col = 0; col < parser.width; col++) {
      const cellRef = toA1(col, 0);
      const column = columns[col];

      // ensure there is a cell behind the column
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

      // don't allow this name again - Excel is case insensitive but allows whitespace
      usedNames.add(newColName.toLowerCase());

      // cell and column should have the same name/value
      column.name = newColName;
      cells[cellRef].v = newColName;
      delete cells[cellRef].t; // cell is to be treated as text
    }
  }

  // Analyze the sample text (presumed to be in CSV format) and return True
  // if the first row appears to be a series of column headers. Inspecting each
  // column, one of two key criteria will be considered to estimate if the sample
  // contains a header:
  //
  // - the second through n-th rows contain numeric values
  //
  // - the second through n-th rows contain strings where at least one
  //   value’s length differs from that of the putative header of that column.
  //
  // Twenty rows after the first row are sampled; if more than half of columns + rows
  // meet the criteria, True is returned.

  const output: JSFWorkbook = {
    name: name,
    sheets: [
      {
        name: 'Sheet1',
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
    tables: [
      // FIXME: if !parser.width or !parser.height we should not emit a table!
      {
        name: 'Table1',
        sheet: 'Sheet1',
        ref: 'A1:' + toA1(parser.width - 1, parser.height - 1),
        headerRowCount: hasHeader ? 1 : 0,
        totalsRowCount: 0,
        columns: columns,
        // style: {
        //   name: 'TableStyleMedium2',
        //   showRowStripes: false,
        //   showColumnStripes: true,
        //   showFirstColumn: true,
        //   showLastColumn: false,
        // },
      },
    ],
  };
  console.dir(output, { depth: null });
  // console.log(output);

  return output;
}

