import { describe, it, expect } from 'vitest';
import { normalizeFormula } from './normalizeFormula.js';

describe('normalizeFormula', () => {
  describe('basic functionality', () => {
    it('should return unchanged formula when no normalization needed', () => {
      const simpleFormula = 'SUM(A1:B2)';
      expect(normalizeFormula(simpleFormula, null)).toBe(simpleFormula);

      const basicFormula = 'A1+B1*2';
      expect(normalizeFormula(basicFormula, null)).toBe(basicFormula);

      const textFormula = 'CONCATENATE("Hello", " ", "World")';
      expect(normalizeFormula(textFormula, null)).toBe(textFormula);
    });

    it('should handle empty and simple formulas', () => {
      expect(normalizeFormula('', null)).toBe('');
      expect(normalizeFormula('1', null)).toBe('1');
      expect(normalizeFormula('"text"', null)).toBe('"text"');
      expect(normalizeFormula('TRUE', null)).toBe('TRUE');
    });
  });

  describe('function namespace normalization', () => {
    it('should remove _xlfn namespace from functions', () => {
      expect(normalizeFormula('_xlfn.IFERROR(A1,0)', null)).toBe('IFERROR(A1,0)');
      expect(normalizeFormula('_xlfn.SUMIFS(A:A,B:B,">0")', null)).toBe('SUMIFS(A:A,B:B,">0")');
      expect(normalizeFormula('SUM(_xlfn.IFERROR(A1,0))', null)).toBe('SUM(IFERROR(A1,0))');
    });

    it('should remove _xludf namespace from functions', () => {
      expect(normalizeFormula('_xludf.CUSTOMFUNC(A1)', null)).toBe('CUSTOMFUNC(A1)');
      expect(normalizeFormula('_xludf.MYFUNC(A1,B1)', null)).toBe('MYFUNC(A1,B1)');
    });

    it('should remove _xlws namespace from functions', () => {
      expect(normalizeFormula('_xlws.WEBSERVICE("http://example.com")', null)).toBe('WEBSERVICE("http://example.com")');
    });

    it('should remove multiple namespaces', () => {
      expect(normalizeFormula('_xlfn._xlws.FUNC(A1)', null)).toBe('FUNC(A1)');
      expect(normalizeFormula('_xlws._xlfn.FUNC(A1)', null)).toBe('FUNC(A1)');
    });

    it('should handle case insensitive namespace removal', () => {
      expect(normalizeFormula('_XLFN.IFERROR(A1,0)', null)).toBe('IFERROR(A1,0)');
      expect(normalizeFormula('_XlFn.IFERROR(A1,0)', null)).toBe('IFERROR(A1,0)');
    });

    it('is not fooled by strings', () => {
      expect(normalizeFormula('"_XLFN.FUNC()"', null)).toBe('"_XLFN.FUNC()"');
      expect(normalizeFormula('"_xlfn.FUNC()"', null)).toBe('"_xlfn.FUNC()"');
    });
  });

  describe('named reference normalization', () => {
    it('should remove _xlpm namespace from named references', () => {
      const wb = { externalLinks: [] };
      expect(normalizeFormula('_xlpm.MyName', wb)).toBe('MyName');
      expect(normalizeFormula('SUM(_xlpm.DataRange)', wb)).toBe('SUM(DataRange)');
    });

    it('should handle case insensitive _xlpm removal', () => {
      const wb = { externalLinks: [] };
      expect(normalizeFormula('_XLPM.MyName', wb)).toBe('MyName');
      expect(normalizeFormula('_XlPm.MyName', wb)).toBe('MyName');
    });
  });

  describe('external reference normalization', () => {
    it('should handle external references with workbook links', () => {
      const wb = {
        externalLinks: [
          { name: 'External.xlsx' },
          { name: 'Data.xlsx' },
        ],
      };
      expect(normalizeFormula('[0]Sheet1!A1', wb)).toBe('#REF!');
      expect(normalizeFormula('[1]Sheet1!A1', wb)).toBe('[External.xlsx]Sheet1!A1');
      expect(normalizeFormula('[2]Sheet1!A1', wb)).toBe('[Data.xlsx]Sheet1!A1');
    });

    it('should handle formulas without external links when wb has no externalLinks', () => {
      const wb = { externalLinks: [] };
      expect(normalizeFormula('[1]Sheet1!A1', wb)).toBe('#REF!');
    });

    it('should handle formulas when wb is null or undefined', () => {
      expect(normalizeFormula('[1]Sheet1!A1', null)).toBe('#REF!');
      expect(normalizeFormula('[1]Sheet1!A1', undefined)).toBe('#REF!');
    });
  });

  describe('complex formulas', () => {
    it('should handle formulas with multiple normalizations', () => {
      const wb = { externalLinks: [ { name: 'External.xlsx' } ] };
      expect(normalizeFormula('_xlfn.IFERROR(_xlpm.MyName+[1]Sheet1!A1,0)', wb))
        .toBe('IFERROR(MyName+[External.xlsx]Sheet1!A1,0)');
    });

    it('should handle nested function calls with namespaces', () => {
      expect(normalizeFormula('_xlfn.IF(_xlfn.ISNA(A1),"",A1)', null))
        .toBe('IF(ISNA(A1),"",A1)');

      expect(normalizeFormula('SUM(_xlfn.IFERROR(A1:A10,0))', null))
        .toBe('SUM(IFERROR(A1:A10,0))');
    });

    it('should handle formulas with mixed content', () => {
      const formula = '_xlfn.CONCATENATE("Value: ",_xlfn.TEXT(A1,"0.00"))';
      expect(normalizeFormula(formula, null))
        .toBe('CONCATENATE("Value: ",TEXT(A1,"0.00"))');
    });
  });

  describe('edge cases', () => {
    it('should handle formulas with no special tokens', () => {
      const formulas = [
        'A1+B1',
        'SUM(1,2,3)',
        'IF(A1>0,"Positive","Not Positive")',
        'VLOOKUP(A1,B:C,2,FALSE)',
      ];
      formulas.forEach(formula => {
        expect(normalizeFormula(formula, null)).toBe(formula);
      });
    });

    it('should handle special characters in formulas', () => {
      const formula = '_xlfn.REGEX("test@example.com","[a-z]+@[a-z]+\\.[a-z]+")';
      const result = normalizeFormula(formula, null);
      expect(result).toBe('REGEX("test@example.com","[a-z]+@[a-z]+\\.[a-z]+")');
    });

    it('should preserve whitespace and formatting', () => {
      const formula = '_xlfn.SUM( A1 : B2 )';
      expect(normalizeFormula(formula, null)).toBe('SUM( A1 : B2 )');
    });
  });
});
