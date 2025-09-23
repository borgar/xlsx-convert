import { describe, it, expect, beforeEach } from 'vitest';
import { CSVParser } from './CSVParser.js';

describe('CSVParser', () => {
  let parser: CSVParser;

  beforeEach(() => {
    parser = new CSVParser();
  });

  describe('parse', () => {
    it('should parse simple CSV data', () => {
      const csv = 'name,age,city\nJohn,25,NYC\nJane,30,LA';
      const result = parser.parse(csv, ',');

      expect(result).toEqual({
        A1: { v: 'name' },
        B1: { v: 'age' },
        C1: { v: 'city' },
        A2: { v: 'John' },
        B2: { v: 25 },
        C2: { v: 'NYC' },
        A3: { v: 'Jane' },
        B3: { v: 30 },
        C3: { v: 'LA' },
      });
      expect(parser.width).toBe(3);
      expect(parser.height).toBe(3);
    });

    it('should auto-detect comma delimiter', () => {
      const csv = 'a,b,c\n1,2,3';
      parser.parse(csv);

      expect(parser.table).toEqual({
        A1: { v: 'a' },
        B1: { v: 'b' },
        C1: { v: 'c' },
        A2: { v: 1 },
        B2: { v: 2 },
        C2: { v: 3 },
      });
      expect(parser.width).toBe(3);
      expect(parser.height).toBe(2);
    });

    it('should auto-detect tab delimiter', () => {
      const csv = 'a\tb\tc\n1\t2\t3';
      parser.parse(csv);

      expect(parser.table).toEqual({
        A1: { v: 'a' },
        B1: { v: 'b' },
        C1: { v: 'c' },
        A2: { v: 1 },
        B2: { v: 2 },
        C2: { v: 3 },
      });
      expect(parser.width).toBe(3);
      expect(parser.height).toBe(2);
    });

    it('should auto-detect semicolon delimiter', () => {
      const csv = 'a;b;c\n1;2;3';
      parser.parse(csv);

      expect(parser.table).toEqual({
        A1: { v: 'a' },
        B1: { v: 'b' },
        C1: { v: 'c' },
        A2: { v: 1 },
        B2: { v: 2 },
        C2: { v: 3 },
      });
      expect(parser.width).toBe(3);
      expect(parser.height).toBe(2);
    });

    it('should handle quoted strings', () => {
      const csv = '"hello, world","simple text",123';
      const result = parser.parse(csv);

      expect(result).toEqual({
        A1: { v: 'hello, world' },
        B1: { v: 'simple text' },
        C1: { v: 123 },
      });
    });

    it('should handle "" escaped quotes', () => {
      const csv = '"He said ""Hello""","Normal text"';
      const result = parser.parse(csv);

      expect(result).toEqual({
        A1: { v: 'He said "Hello"' },
        B1: { v: 'Normal text' },
      });
    });

    it('should handle \\" escaped quotes', () => {
      const csv = '"He said \\"Hello\\"","Normal text"';
      parser.escapeChar = '\\';
      const result = parser.parse(csv);

      expect(result).toEqual({
        A1: { v: 'He said "Hello"' },
        B1: { v: 'Normal text' },
      });
    });

    it('should handle \\n line endings', () => {
      const csvCRLF = 'a,b\r\n1,2';
      const csvLF = 'a,b\n1,2';
      const csvCR = 'a,b\r1,2';
      const csvLFCR = 'a,b\r\n1,2';
      const expected = {
        A1: { v: 'a' },
        B1: { v: 'b' },
        A2: { v: 1 },
        B2: { v: 2 },
      };
      expect(parser.parse(csvCRLF)).toEqual(expected);
      parser = new CSVParser();
      expect(parser.parse(csvLF)).toEqual(expected);
      parser = new CSVParser();
      expect(parser.parse(csvCR)).toEqual(expected);
      parser = new CSVParser();
      expect(parser.parse(csvLFCR)).toEqual(expected);
    });

    it('should handle empty cells', () => {
      const csv = 'a,,c\n,2,';
      const result = parser.parse(csv);

      expect(result).toEqual({
        A1: { v: 'a' },
        C1: { v: 'c' },
        B2: { v: 2 },
      });
    });

    it('should handle trailing empty cells', () => {
      const csv = 'a,b,\n1,2,\n,,';
      const result = parser.parse(csv);

      expect(result).toEqual({
        A1: { v: 'a' },
        B1: { v: 'b' },
        A2: { v: 1 },
        B2: { v: 2 },
      });
      expect(parser.width).toBe(2);
      expect(parser.height).toBe(2);
    });

    it('should ignore whitespace in unquoted cells', () => {
      const csv = '  a  ,  b  ,  c  \n  1  ,2,  3  ';
      const result = parser.parse(csv);

      expect(result).toEqual({
        A1: { v: 'a' },
        B1: { v: 'b' },
        C1: { v: 'c' },
        A2: { v: 1 },
        B2: { v: 2 },
        C2: { v: 3 },
      });
    });

    it('should preserve whitespace in quoted cells', () => {
      const csv = '  "  hello  "  ,  "  123  "  ';
      const result = parser.parse(csv);

      expect(result).toEqual({
        A1: { v: '  hello  ' },
        B1: { v: '  123  ' },
      });
    });

    it('should skip empty rows', () => {
      const csv = 'a,b,c\n   \n1,2,3\n , \n4,5,6';
      const result = parser.parse(csv);

      expect(result).toEqual({
        A1: { v: 'a' },
        B1: { v: 'b' },
        C1: { v: 'c' },
        A2: { v: 1 },
        B2: { v: 2 },
        C2: { v: 3 },
        A3: { v: 4 },
        B3: { v: 5 },
        C3: { v: 6 },
      });
    });

    it('should not skip empty rows if skipEmptyLines is set to false', () => {
      parser.skipEmptyLines = false;
      const csv = 'a,b,c\n , \n1,2,3\n  \n4,5,6';
      const result = parser.parse(csv);

      expect(result).toEqual({
        A1: { v: 'a' },
        B1: { v: 'b' },
        C1: { v: 'c' },
        A3: { v: 1 },
        B3: { v: 2 },
        C3: { v: 3 },
        A5: { v: 4 },
        B5: { v: 5 },
        C5: { v: 6 },
      });
    });

    it('should handle mixed data types', () => {
      const csv = 'text,number,boolean,date\nHello,123,TRUE,2023-12-25';
      const result = parser.parse(csv, ',');

      expect(result.A1).toEqual({ v: 'text' });
      expect(result.B1).toEqual({ v: 'number' });
      expect(result.C1).toEqual({ v: 'boolean' });
      expect(result.D1).toEqual({ v: 'date' });
      expect(result.A2).toEqual({ v: 'Hello' });
      expect(result.B2).toEqual({ v: 123 });
      expect(result.C2).toEqual({ v: true });
      expect(result.D2).toEqual({ v: 45285, t: 'd', s: 1 }); // Serial date
      expect(parser.formats).toEqual([ '', 'yyyy-mm-dd' ]);
    });

    it('should reset state between parses', () => {
      parser.parse('a,b\n1,2', ',');
      const firstResult = { ...parser.table };
      parser.parse('x,y,z\n3,4,5', ',');

      expect(parser.table).not.toEqual(firstResult);
      expect(parser.table).toEqual({
        A1: { v: 'x' },
        B1: { v: 'y' },
        C1: { v: 'z' },
        A2: { v: 3 },
        B2: { v: 4 },
        C2: { v: 5 },
      });
    });

    it('should handle single column data', () => {
      const csv = 'header\nvalue1\nvalue2';
      const result = parser.parse(csv);

      expect(result).toEqual({
        A1: { v: 'header' },
        A2: { v: 'value1' },
        A3: { v: 'value2' },
      });
      expect(parser.width).toBe(1);
      expect(parser.height).toBe(3);
    });

    it('should handle empty input', () => {
      const result = parser.parse('');

      expect(result).toEqual({});
      expect(parser.width).toBe(0);
      expect(parser.height).toBe(0);
    });

    it('should use provided delimiter over auto-detection', () => {
      const csv = 'a;b;c\n1;2;3';
      parser.parse(csv, ','); // Force comma delimiter

      // Should treat semicolons as part of the text since comma is forced
      expect(parser.table.A1).toEqual({ v: 'a;b;c' });
      expect(parser.table.A2).toEqual({ v: '1;2;3' });
    });

    it('should handle complex quoted content', () => {
      const csv = '"Line 1\nLine 2","Text with, comma","Text with ""quotes"""';
      const result = parser.parse(csv, ',');

      expect(result).toEqual({
        A1: { v: 'Line 1\nLine 2' },
        B1: { v: 'Text with, comma' },
        C1: { v: 'Text with "quotes"' },
      });
    });
  });

  describe('edge cases', () => {
    it('should handle large numbers', () => {
      const csv = '999999999999999999';
      const result = parser.parse(csv);

      // eslint-disable-next-line no-loss-of-precision
      expect(result.A1).toEqual({ v: 999999999999999999 });
    });

    it('should handle scientific notation', () => {
      const csv = '1.23E+10,5.67e-5';
      const result = parser.parse(csv, ',');

      expect(result).toEqual({
        A1: { v: 12300000000, s: 1 },
        B1: { v: 0.0000567, s: 1 },
      });
      expect(parser.formats).toEqual([ '', '0.00E+00' ]);
    });

    it('should handle content outside ascii range', () => {
      const csv = 'héllo,wörld,测试';
      const result = parser.parse(csv, ',');

      expect(result).toEqual({
        A1: { v: 'héllo' },
        B1: { v: 'wörld' },
        C1: { v: '测试' },
      });
    });

    it('should handle malformed CSV gracefully', () => {
      const csv = 'a,"unclosed quote\nb,c';
      const result = parser.parse(csv, ',');

      // The actual parser continues parsing until end of string when quote is unclosed
      expect(result.A1).toEqual({ v: 'a' });
      expect(result.B1).toEqual({ v: 'unclosed quote\nb,c' });
    });

    it('should maintain column statistics correctly', () => {
      const csv = 'text,number,bool\nhello,123,TRUE\nworld,456,FALSE\ntest,789,TRUE';
      parser.parse(csv, ',');

      expect(parser.columns[0]).toEqual({
        t: 4, // 'text' + 3 string values
        n: 0,
        b: 0,
        d: 0,
        total: 4,
      });

      expect(parser.columns[1]).toEqual({
        t: 1, // 'number'
        n: 3, // 123, 456, 789
        b: 0,
        d: 0,
        total: 4,
      });

      expect(parser.columns[2]).toEqual({
        t: 1, // 'bool'
        n: 0,
        b: 3, // TRUE, FALSE, TRUE
        d: 0,
        total: 4,
      });
    });
  });

  describe('countType', () => {
    beforeEach(() => {
      parser.columns = [];
    });

    it('should initialize column data if it does not exist', () => {
      parser.column = 0;
      parser.countType('t');

      expect(parser.columns[0]).toEqual({
        t: 1,
        n: 0,
        b: 0,
        d: 0,
        total: 1,
      });
    });

    it('should increment existing type counts', () => {
      parser.column = 0;
      parser.countType('t');
      parser.countType('t');
      parser.countType('n');

      expect(parser.columns[0]).toEqual({
        t: 2,
        n: 1,
        b: 0,
        d: 0,
        total: 3,
      });
    });

    it('should handle different column indices', () => {
      parser.column = 0;
      parser.countType('t');

      parser.column = 2;
      parser.countType('n');

      expect(parser.columns[0]).toEqual({
        t: 1,
        n: 0,
        b: 0,
        d: 0,
        total: 1,
      });
      expect(parser.columns[1]).toBeUndefined();
      expect(parser.columns[2]).toEqual({
        t: 0,
        n: 1,
        b: 0,
        d: 0,
        total: 1,
      });
    });
  });

  describe('parseValue', () => {
    beforeEach(() => {
      parser.row = 0;
      parser.column = 0;
      parser.width = 0;
      parser.height = 0;
      parser.table = {};
      parser.columns = [];
      parser.formats = [ '' ];
    });

    it('should parse string values when knownString is true', () => {
      parser.parseValue('hello world', true);

      expect(parser.table.A1).toEqual({ v: 'hello world' });
      expect(parser.columns[0].t).toBe(1);
      expect(parser.columns[0].total).toBe(1);
      expect(parser.width).toBe(1);
      expect(parser.height).toBe(1);
    });

    it('should count "non-string" values when knownString is true', () => {
      parser.parseValue('NA', true);
      parser.parseValue('n/a', true);
      parser.parseValue('#N/A', true);
      parser.parseValue('NaN', true);

      expect(parser.columns[0]?.total || 0).toBe(4);
    });

    it('should parse numeric values', () => {
      parser.parseValue('123');
      parser.column = 1;
      parser.parseValue('3.14');
      parser.column = 2;
      parser.parseValue('-42.5');

      expect(parser.table.A1).toEqual({ v: 123 });
      expect(parser.table.B1).toEqual({ v: 3.14 });
      expect(parser.table.C1).toEqual({ v: -42.5 });
      expect(parser.columns[0].n).toBe(1);
      expect(parser.columns[1].n).toBe(1);
      expect(parser.columns[2].n).toBe(1);
    });

    it('should parse boolean values', () => {
      parser.parseValue('TRUE');
      parser.column = 1;
      parser.parseValue('FALSE');

      expect(parser.table.A1).toEqual({ v: true });
      expect(parser.table.B1).toEqual({ v: false });
      expect(parser.columns[0].b).toBe(1);
      expect(parser.columns[1].b).toBe(1);
    });

    it('should parse date values', () => {
      parser.parseValue('2023-12-25');

      expect(parser.table.A1.v).toBe(45285); // Serial date number
      expect(parser.table.A1.t).toBe('d');
      expect(parser.columns[0].d).toBe(1);
      expect(parser.formats[parser.table.A1.s]).toBe('yyyy-mm-dd');
    });

    it('should parse time values', () => {
      parser.parseValue('14:30:00');

      expect(parser.table.A1.v).toBe(0.6041666666666666); // Fractional day
      expect(parser.table.A1.t).toBe('d');
      expect(parser.table.A1.s).toBe(1); // Format index
      expect(parser.formats[parser.table.A1.s]).toBe('hh:mm:ss');
    });

    it('should handle empty values', () => {
      parser.parseValue('');

      expect(parser.table.A1).toBeUndefined();
      expect(parser.width).toBe(0);
      expect(parser.height).toBe(0);
    });

    it('should parse text values as fallback', () => {
      parser.parseValue('some text');

      expect(parser.table.A1).toEqual({ v: 'some text' });
      expect(parser.columns[0].t).toBe(1);
    });

    it('should update table dimensions', () => {
      parser.row = 2;
      parser.column = 3;
      parser.parseValue('test');

      expect(parser.width).toBe(4);
      expect(parser.height).toBe(3);
    });

    it('should not count special non-string values', () => {
      const specialValues = [ 'NA', 'n/a', '#N/A', 'N.A.', '#NAME?', '#REF!', '#DIV/0!', '#VALUE!', '#NUM!', 'NaN', '-Infinity', 'Infinity', '...', '---' ];

      specialValues.forEach((value, index) => {
        parser.column = index;
        parser.parseValue(value);
      });

      const totalCounted = parser.columns.reduce((sum, col) => sum + (col?.total || 0), 0);
      expect(totalCounted).toBe(0);
    });
  });
});
