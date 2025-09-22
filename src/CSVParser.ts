import { parseBool, parseDate, parseNumber, parseTime } from 'numfmt';
import type { JSFCell } from './jsf-types.ts';
import { toA1 } from './utils/toA1.ts';

// Common things that are not numbers, but shouldn't identify as text when analizing
const reNotString = /^(?:NA|n\/a|#?N\/A|N\.A\.|#NAME\?|#(REF|DIV\/0|VALUE|NUM)!|NaN|-?Infinity|\.+|-+)$/;

const STRING = 't';
const NUMBER = 'n';
const BOOL = 'b';
const DATE = 'd';

type DataType = typeof STRING | typeof NUMBER | typeof BOOL | typeof DATE;
type ColumnData = {
  [STRING]: number,
  [NUMBER]: number,
  [BOOL]: number,
  [DATE]: number,
  total: number,
};

const lineBreakChains = { '\r': '\n', '\n': '\r' };

export class CSVParser {
  row: number;
  column: number;
  height: number;
  width: number;
  delimiter: string;
  strict: boolean;
  parse_dates: boolean;
  formats: string[];
  table: Record<string, JSFCell>;
  columns: ColumnData[];

  countType (type: DataType) {
    const c = this.column;
    if (!this.columns[c]) {
      this.columns[c] = {
        [STRING]: 0,
        [NUMBER]: 0,
        [BOOL]: 0,
        [DATE]: 0,
        total: 0,
      };
    }
    this.columns[c][type]++;
    this.columns[c].total++;
  }

  setFormatIndex (cell: JSFCell, formatPattern: string): number {
    if (formatPattern) {
      let fmtIdx = this.formats.indexOf(formatPattern);
      if (fmtIdx === -1) {
        fmtIdx = this.formats.length;
        this.formats.push(formatPattern);
      }
      cell.s = fmtIdx;
      return fmtIdx;
    }
    return 0;
  }

  parseValue (
    valueString: string,
    knownString: boolean = false,
  ) {
    if (knownString) {
      this.table[toA1(this.column, this.row)] = { v: valueString };
      if (!reNotString.test(valueString)) {
        this.countType(STRING);
      }
    }
    else if (valueString) {
      let cell: { v: any, z?: string };
      if ((cell = parseNumber(valueString))) {
        // numfmt
        this.table[toA1(this.column, this.row)] = cell;
        this.countType(NUMBER);
        return;
      }
      if ((cell = parseDate(valueString)) || (cell = parseTime(valueString))) {
        // numfmt
        const outCell: JSFCell = { v: cell.v, t: 'd' };
        this.setFormatIndex(outCell, cell.z);
        this.countType(DATE);
        this.table[toA1(this.column, this.row)] = outCell;
        return;
      }
      if ((cell = parseBool(valueString))) {
        this.table[toA1(this.column, this.row)] = cell;
        this.countType(BOOL);
        return;
      }
      // if valueString starts with a "=" maybe emit it as `{ f: valueString }`?
      this.table[toA1(this.column, this.row)] = { v: valueString };
      if (!reNotString.test(valueString)) {
        this.countType(STRING);
      }
    }
    // keep track of table max size
    if (this.width < this.column + 1) {
      this.width = this.column + 1;
    }
    if (this.height < this.row + 1) {
      this.height = this.row + 1;
    }
  }

  parse (stream: string, delimiter?: string): Record<string, JSFCell> {
    this.row = 0;
    this.table = {};
    this.height = 0;
    this.width = 0;

    this.delimiter = delimiter;
    this.formats = [ '' ];
    this.columns = [];
    if (!delimiter && this.delimiter) {
      delimiter = this.delimiter;
    }

    this.row = 0;
    this.column = 0;
    const totalLength = stream.length;
    const QUOTE = '"';
    const ESC = '"';
    let token = '';
    let pos = 0;
    let knownString = false;
    let inString = false;

    const flush = () => {
      this.parseValue(token, knownString);
      token = '';
      knownString = false;
      this.column++;
    };

    do {
      const next_chr = stream.charAt(pos);
      if (inString) {
        // we are inside a string
        if (next_chr === ESC && stream.charAt(pos + 1) === QUOTE) {
          // escaped quote
          token += QUOTE;
          pos += 2;
        }
        else if (next_chr === QUOTE) {
          // XXX: we expect EOL or DELIMITER next up (after possible whitespace)
          // end of string
          inString = false;
          pos++;
        }
        else {
          token += next_chr;
          pos++;
        }
      }
      else {
        // autodetect delimiter
        if (!delimiter && (next_chr === ',' || next_chr === '\t' || next_chr === ';')) {
          // If delimiter is not ',' we could be open to switching to a lang that
          // uses ',' as decimal separator.
          delimiter = next_chr;
        }

        if (next_chr === '\n' || next_chr === '\r') {
          flush();
          this.column = 0;
          this.row++;
          if (stream.charAt(pos + 1) === lineBreakChains[next_chr]) {
            pos++;
          }
          pos++;
        }
        else if (next_chr === QUOTE) {
          // XXX: don't allow this if token
          inString = true;
          knownString = true;
          pos++;
        }
        else if (next_chr === delimiter) {
          pos++;
          flush();
        }
        else if (pos >= totalLength) {
          flush();
          break;
        }
        else if (next_chr === ' ' && !token) {
          // ignorable whitespace
          pos++;
        }
        else {
          // cell content
          token += next_chr;
          pos++;
        }
      }
    }
    while (pos <= totalLength);

    flush();

    return this.table;
  }
}
