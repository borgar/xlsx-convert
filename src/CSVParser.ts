import { parseBool, parseDate, parseNumber, parseTime, type ParseData } from 'numfmt';
import type { JSFCell } from './jsf-types.ts';
import { toA1 } from './utils/toA1.ts';

// Common things that are not numbers, but shouldn't identify as text when auto-detecting types
const reNotString = /^(?:NA|n\/a|#?N\/A|N\.A\.|NULL|null|nil|#NAME\?|#(REF|DIV\/0|VALUE|NUM|NULL)!|NaN|-?Infinity|\.+|-+)$/;

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
  escapeChar: string;
  locale: string;
  skipEmptyLines: boolean;
  formats: string[];
  table: Record<string, JSFCell>;
  columns: ColumnData[];
  numfmtOptions: { locale: string; };

  constructor () {
    this.escapeChar = '"';
    this.skipEmptyLines = true;
  }

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
    let cell: ParseData;
    const cellID = toA1(this.column, this.row);
    if (knownString) {
      this.table[cellID] = { v: valueString };
      this.countType(STRING);
    }
    else if (valueString) {
      if ((cell = parseNumber(valueString, this.numfmtOptions))) {
        const outCell: JSFCell = { v: cell.v };
        this.setFormatIndex(outCell, cell.z);
        this.table[cellID] = outCell;
        this.countType(NUMBER);
      }
      else if (
        (cell = parseDate(valueString, this.numfmtOptions)) ||
        (cell = parseTime(valueString, this.numfmtOptions))
      ) {
        const outCell: JSFCell = { v: cell.v, t: 'd' };
        this.setFormatIndex(outCell, cell.z);
        this.countType(DATE);
        this.table[cellID] = outCell;
      }
      else if ((cell = parseBool(valueString, this.numfmtOptions))) {
        this.table[cellID] = cell;
        this.countType(BOOL);
      }
      else {
        // XXX: if valueString starts with a "=" maybe emit it as `{ f: valueString }`?
        this.table[cellID] = { v: valueString };
        if (!reNotString.test(valueString)) {
          this.countType(STRING);
        }
      }
    }
    // keep track of table max size, but only if we actually wrote a value
    if (this.table[cellID]) {
      if (this.width < this.column + 1) {
        this.width = this.column + 1;
      }
      if (this.height < this.row + 1) {
        this.height = this.row + 1;
      }
    }
  }

  parse (stream: string, delimiter?: string): Record<string, JSFCell> {
    this.row = 0;
    this.table = {};
    this.height = 0;
    this.width = 0;
    this.formats = [ '' ];
    this.columns = [];
    this.numfmtOptions = { locale: this.locale ?? 'en-US' };

    if (!delimiter && this.delimiter) {
      delimiter = this.delimiter;
    }

    this.row = 0;
    this.column = 0;
    const totalLength = stream.length;
    const QUOTE = '"';
    const ESC = this.escapeChar ?? '"';
    let token = '';
    let pos = 0;
    let knownString = false;
    let inString = false;
    let lockedValue = false;
    let lineData = 0;

    const flush = () => {
      this.parseValue(knownString ? token : token.trim(), knownString);
      token = '';
      knownString = false;
      lockedValue = false;
    };

    do {
      const next_chr = stream.charAt(pos);

      if (inString) {
        // we are inside a string
        if (next_chr === ESC && stream.charAt(pos + 1) === QUOTE) {
          // escaped quote
          token += QUOTE;
          pos += 2;
          lineData++;
        }
        else if (next_chr === QUOTE) {
          // XXX: we expect EOL or DELIMITER next up (after possible whitespace)
          // end of string
          inString = false;
          lockedValue = true;
          pos++;
        }
        else {
          token += next_chr;
          pos++;
          lineData++;
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
          pos += (stream.charAt(pos + 1) === lineBreakChains[next_chr]) ? 2 : 1;
          if (lineData || !this.skipEmptyLines) {
            this.row++;
            lineData = 0;
          }
          this.column = 0;
        }
        else if (next_chr === QUOTE) {
          if (token) {
            // this is an unescaped quote in the middle of a token
            // it is treated as any other character
            token += next_chr;
          }
          else {
            inString = true;
          }
          knownString = true;
          pos++;
        }
        else if (next_chr === delimiter) {
          pos++;
          flush();
          this.column++;
        }
        else if (pos >= totalLength) {
          flush();
          break;
        }
        else if (next_chr === ' ' && (!token || lockedValue)) {
          // ignorable whitespace
          pos++;
        }
        else {
          if (lockedValue) {
            // the case here is `"foo"bar`, which we'll retrospectively treat the token as non-quoted
            // XXX: minor issue still present is that if we get `"foo" bar` the whitespace will be lost.
            token = '"' + token.replaceAll('"', ESC + '"') + '"';
            lockedValue = false;
          }
          // cell content
          token += next_chr;
          lineData++;
          pos++;
        }
      }
    }
    while (pos <= totalLength);

    flush();

    return this.table;
  }
}
