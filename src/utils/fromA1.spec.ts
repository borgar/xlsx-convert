import { describe, it, test, expect } from 'vitest';
import { fromA1 } from './fromA1.ts';

describe('fromA1', () => {
  describe('single cell references', () => {
    test.each([
      [ 'A1',            { top: 0, left: 0, right: 0, bottom: 0 } ],
      [ 'B2',            { top: 1, left: 1, right: 1, bottom: 1 } ],
      [ 'Z1',            { top: 0, left: 25, right: 25, bottom: 0 } ],
      [ 'AA10',          { top: 9, left: 26, right: 26, bottom: 9 } ],
      [ 'ab123',         { top: 122, left: 27, right: 27, bottom: 122 } ], // case-insensitive
      [ '$A$1',          { top: 0, left: 0, right: 0, bottom: 0 } ],
      [ '$AA$10',        { top: 9, left: 26, right: 26, bottom: 9 } ],
      [ '$A1',           { top: 0, left: 0, right: 0, bottom: 0 } ],
      [ 'A$1',           { top: 0, left: 0, right: 0, bottom: 0 } ],
    ])('parses "%s"', (source, expected) => {
      expect(fromA1(source)).toEqual(expected);
    });
  });

  describe('rectangle references', () => {
    test.each([
      // plain ranges
      [ 'A1:A1',               { top: 0, left: 0, right: 0, bottom: 0 } ],
      [ 'A1:B2',               { top: 0, left: 0, right: 1, bottom: 1 } ],
      [ 'B2:D5',               { top: 1, left: 1, right: 3, bottom: 4 } ],
      [ 'b2:d5',               { top: 1, left: 1, right: 3, bottom: 4 } ], // case-insensitive
      [ 'AA10:AB12',           { top: 9, left: 26, right: 27, bottom: 11 } ],

      // absolute locks on both sides
      [ '$A$1:$B$2',           { top: 0, left: 0, right: 1, bottom: 1 } ],
      [ '$AA$10:$AB$12',       { top: 9, left: 26, right: 27, bottom: 11 } ],

      // mixed absolute/relative (locks should not affect numeric result)
      [ '$A1:$B2',             { top: 0, left: 0, right: 1, bottom: 1 } ],
      [ 'A$1:B$2',             { top: 0, left: 0, right: 1, bottom: 1 } ],
      [ '$A$1:B2',             { top: 0, left: 0, right: 1, bottom: 1 } ],
      [ 'A1:$B$2',             { top: 0, left: 0, right: 1, bottom: 1 } ],

      // reversed endpoints should still yield top<=bottom and left<=right
      [ 'D5:B2',               { top: 1, left: 1, right: 3, bottom: 4 } ],
      [ '$AB$12:$AA$10',       { top: 9, left: 26, right: 27, bottom: 11 } ],
    ])('parses "%s"', (source, expected) => {
      expect(fromA1(source)).toEqual(expected);
    });
  });

  describe('invalid inputs', () => {
    test.each([
      '',           // empty
      ':',          // just a colon
      'A',          // missing row
      '1',          // missing column
      'A0',         // row numbers start at 1 in A1 notation
      'A-1',        // negative row
      'A1:',        // dangling colon
      ':B2',        // dangling colon
      'A1:B',       // incomplete second ref
      '$A',         // incomplete with dollar
      '$1',         // invalid absolute on row without column
      'A$0',        // invalid absolute row 0
      '$A$0',       // invalid absolute row 0
      'A1:B0',      // invalid second row 0
      'A1:B-2',     // invalid negative
      '!',          // random char
      '  C3  ',     // whitespace
      '  B2 : D5 ', // whitespace
    ])('returns null for "%s"', bad => {
      expect(fromA1(bad)).toBeNull();
    });
  });

  describe('robustness / formatting', () => {
    const MAX_ROW = 1048575;
    const MAX_COL = 16383;

    it('handles very large columns and rows', () => {
      // XFD1048576 is the bottom-right cell of modern Excel
      expect(fromA1('XFD1048576')).toEqual({ top: MAX_ROW, left: MAX_COL, right: MAX_COL, bottom: MAX_ROW });
      expect(fromA1('A1:XFD1048576')).toEqual({ top: 0, left: 0, right: MAX_COL, bottom: MAX_ROW });
    });

    it('rejects columns and rows larger than Excel maximum', () => {
      expect(fromA1('XFD1048577')).toEqual(null);
      expect(fromA1('XFE1048576')).toEqual(null);
      expect(fromA1('A1:XFD1048577')).toEqual(null);
      expect(fromA1('A1:XFE1048576')).toEqual(null);
    });
  });
});
