import { describe, expect, it } from 'vitest';

import { cleanWorkbookName } from './cleanWorkbookName.ts';

describe('cleanWorkbookName', () => {
  it('returns a null for an empty name', () => {
    expect(cleanWorkbookName('')).toBe(null);
  });

  it('returns a plain name unchanged', () => {
    expect(cleanWorkbookName('Budget 2026.xlsx')).toBe('Budget 2026.xlsx');
    expect(cleanWorkbookName('Budget')).toBe('Budget');
  });

  describe('directories', () => {
    it('strips a POSIX directory', () => {
      expect(cleanWorkbookName('/Users/me/Documents/Budget.xlsx')).toBe('Budget.xlsx');
      expect(cleanWorkbookName('../Budget.xlsx')).toBe('Budget.xlsx');
    });

    it('strips a Windows directory', () => {
      expect(cleanWorkbookName('C:\\Users\\me\\Budget.xlsx')).toBe('Budget.xlsx');
    });

    it('strips the path of a URL', () => {
      expect(cleanWorkbookName('https://example.com/files/Budget.xlsx')).toBe('Budget.xlsx');
      expect(cleanWorkbookName('file:///C:/Users/me/Budget.xlsx')).toBe('Budget.xlsx');
    });

    it('returns a null for a path that ends in a separator', () => {
      expect(cleanWorkbookName('/Users/me/')).toBe(null);
      expect(cleanWorkbookName('C:\\Users\\me\\')).toBe(null);
    });
  });

  describe('decoding', () => {
    it('decodes URL escapes', () => {
      expect(cleanWorkbookName('My%20Budget.xlsx')).toBe('My Budget.xlsx');
      expect(cleanWorkbookName('https://example.com/Fj%C3%A1rhagur.xlsx')).toBe('Fjárhagur.xlsx');
    });

    it('decodes an escaped separator after splitting off the directory', () => {
      // %2F is decoded to "/" after the directory is stripped, and then removed as illegal.
      expect(cleanWorkbookName('dir/a%2Fb.xlsx')).toBe('ab.xlsx');
      expect(cleanWorkbookName('dir/a%2Fb.xlsx', false)).toBe('a/b.xlsx');
    });

    it('normalizes the name to NFC', () => {
      const decomposed = 'Fja\u0301rhagur.xlsx';
      const composed = 'Fj\u00e1rhagur.xlsx';
      expect(cleanWorkbookName(decomposed)).toBe(composed);
    });

    it('keeps a "%" that is not a URL escape', () => {
      expect(cleanWorkbookName('100%.xlsx')).toBe('100%.xlsx');
      expect(cleanWorkbookName('50%off.xlsx')).toBe('50%off.xlsx');
      expect(cleanWorkbookName('%.xlsx')).toBe('%.xlsx');
    });

    it('decodes valid escapes in a name that also has a stray "%"', () => {
      expect(cleanWorkbookName('100%%20done.xlsx')).toBe('100% done.xlsx');
      expect(cleanWorkbookName('100%_Fj%C3%A1rhagur.xlsx')).toBe('100%_Fjárhagur.xlsx');
    });

    it('keeps escapes that are not valid UTF-8 and decodes the rest', () => {
      expect(cleanWorkbookName('%FF%20x.xlsx')).toBe('%FF x.xlsx');
      expect(cleanWorkbookName('%FF%C3%A1.xlsx')).toBe('%FFá.xlsx');
      expect(cleanWorkbookName('%C3%A1%C3.xlsx')).toBe('á%C3.xlsx');
      expect(cleanWorkbookName('%E0%A4%A.xlsx')).toBe('%E0%A4%A.xlsx');
    });
  });

  describe('illegal characters', () => {
    it.each([
      [ ':' ], [ '*' ], [ '?' ], [ '"' ], [ '<' ], [ '>' ], [ '|' ], [ '\u0000' ], [ '\t' ], [ '\u001f' ],
    ])('removes %j', char => {
      expect(cleanWorkbookName(`a${char}b.xlsx`)).toBe('ab.xlsx');
    });

    it('keeps illegal characters when stripIllegal is false', () => {
      expect(cleanWorkbookName('a:b.xlsx', false)).toBe('a:b.xlsx');
      expect(cleanWorkbookName('a?b.xlsx', false)).toBe('a?b.xlsx');
    });

    it('keeps characters that are allowed', () => {
      expect(cleanWorkbookName('Q1 (draft) [v2] #3 & co.xlsx')).toBe('Q1 (draft) [v2] #3 & co.xlsx');
    });

    it('removes every illegal character', () => {
      expect(cleanWorkbookName('a:b*c?.xlsx')).toBe('abc.xlsx');
    });
  });

  describe('length', () => {
    it('keeps a name of exactly 255 characters', () => {
      const name = 'x'.repeat(250) + '.xlsx';
      expect(cleanWorkbookName(name)).toBe(name);
    });

    it('shortens a longer name to 255 characters and keeps the extension', () => {
      const out = cleanWorkbookName('x'.repeat(300) + '.xlsx');
      expect(out).toBe('x'.repeat(250) + '.xlsx');
      expect(out).toHaveLength(255);
    });

    it('trims whitespace at the cut', () => {
      const out = cleanWorkbookName('x'.repeat(248) + '  ' + 'y'.repeat(50) + '.xlsx');
      expect(out).toBe('x'.repeat(248) + '.xlsx');
    });

    it('shortens a long name without an extension to 250 characters', () => {
      expect(cleanWorkbookName('x'.repeat(300))).toBe('x'.repeat(250));
    });

    it('keeps only the last extension when shortening', () => {
      const out = cleanWorkbookName('x'.repeat(300) + '.backup.xlsx');
      expect(out).toBe('x'.repeat(250) + '.xlsx');
    });

    it('measures the length after stripping the directory', () => {
      const name = 'x'.repeat(250) + '.xlsx';
      expect(cleanWorkbookName('/' + 'd'.repeat(300) + '/' + name)).toBe(name);
    });
  });

  describe('reserved names', () => {
    it.each([
      'CON.xlsx',
      'PRN.xlsx',
      'AUX.xlsx',
      'NUL.xlsx',
      'COM1.xlsx',
      'COM9.xlsx',
      'LPT1.xlsx',
      'LPT9.xlsx',
      'con.xlsx',
      'Nul.xlsx',
      'CON.xlsm',
      'CON.xlsb',
      'CON.XLSX',
    ])('returns a null for %s', name => {
      expect(cleanWorkbookName(name)).toBe(null);
    });

    it('returns a null for a reserved name in a directory', () => {
      expect(cleanWorkbookName('C:\\Users\\me\\CON.xlsx')).toBe(null);
    });

    it('returns a null for a name that is only an extension', () => {
      expect(cleanWorkbookName('.xlsx')).toBe(null);
      expect(cleanWorkbookName('   .xlsx')).toBe(null);
    });

    it('returns a null when stripping illegal characters leaves a reserved name', () => {
      expect(cleanWorkbookName('C:ON.xlsx')).toBe(null);
      expect(cleanWorkbookName(':.xlsx')).toBe(null);
    });

    it('keeps names that only start with a reserved name', () => {
      expect(cleanWorkbookName('CONSOLE.xlsx')).toBe('CONSOLE.xlsx');
      expect(cleanWorkbookName('NULL.xlsx')).toBe('NULL.xlsx');
      expect(cleanWorkbookName('COM10.xlsx')).toBe('COM10.xlsx');
    });

    it('returns a null for a reserved name with any extension or none', () => {
      expect(cleanWorkbookName('CON.csv')).toBe(null);
      expect(cleanWorkbookName('CON.xls')).toBe(null);
      expect(cleanWorkbookName('CON.tar.gz')).toBe(null);
      expect(cleanWorkbookName('CON')).toBe(null);
      expect(cleanWorkbookName('lpt1')).toBe(null);
    });
  });
});
