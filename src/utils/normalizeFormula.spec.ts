import { describe, it, expect } from 'vitest';
import { normalizeFormula } from './normalizeFormula.js';
import { tokenize, tokenTypes } from '@borgar/fx/xlsx';

describe('normalizeFormula', () => {
  describe('basic functionality', () => {
    it('should return unchanged formula when no normalization needed', () => {
      const simpleFormula = 'SUM(A1:B2)';
      expect(normalizeFormula(simpleFormula)).toBe(simpleFormula);

      const basicFormula = 'A1+B1*2';
      expect(normalizeFormula(basicFormula)).toBe(basicFormula);

      const textFormula = 'CONCATENATE("Hello", " ", "World")';
      expect(normalizeFormula(textFormula)).toBe(textFormula);
    });

    it('should handle empty and simple formulas', () => {
      expect(normalizeFormula('')).toBe('');
      expect(normalizeFormula('1')).toBe('1');
      expect(normalizeFormula('"text"')).toBe('"text"');
      expect(normalizeFormula('TRUE')).toBe('TRUE');
    });
  });

  describe('function namespace normalization', () => {
    it('should remove _xlfn namespace from functions', () => {
      expect(normalizeFormula('_xlfn.IFERROR(A1,0)')).toBe('IFERROR(A1,0)');
      expect(normalizeFormula('_xlfn.SUMIFS(A:A,B:B,">0")')).toBe('SUMIFS(A:A,B:B,">0")');
      expect(normalizeFormula('SUM(_xlfn.IFERROR(A1,0))')).toBe('SUM(IFERROR(A1,0))');
    });

    it('should remove _xludf namespace from functions', () => {
      expect(normalizeFormula('_xludf.CUSTOMFUNC(A1)')).toBe('CUSTOMFUNC(A1)');
      expect(normalizeFormula('_xludf.MYFUNC(A1,B1)')).toBe('MYFUNC(A1,B1)');
    });

    it('should remove _xlws namespace from functions', () => {
      expect(normalizeFormula('_xlws.WEBSERVICE("http://example.com")')).toBe('WEBSERVICE("http://example.com")');
    });

    it('should remove multiple namespaces', () => {
      expect(normalizeFormula('_xlfn._xlws.FUNC(A1)')).toBe('FUNC(A1)');
      expect(normalizeFormula('_xlws._xlfn.FUNC(A1)')).toBe('FUNC(A1)');
    });

    it('should handle case insensitive namespace removal', () => {
      expect(normalizeFormula('_XLFN.IFERROR(A1,0)')).toBe('IFERROR(A1,0)');
      expect(normalizeFormula('_XlFn.IFERROR(A1,0)')).toBe('IFERROR(A1,0)');
    });

    it('is not fooled by strings', () => {
      expect(normalizeFormula('"_XLFN.FUNC()"')).toBe('"_XLFN.FUNC()"');
      expect(normalizeFormula('"_xlfn.FUNC()"')).toBe('"_xlfn.FUNC()"');
    });
  });

  describe('Trimmed ranges handling', () => {
    it('should convert _TRO_ALL to ".:."', () => {
      expect(normalizeFormula('_xlfn._TRO_ALL(A1)')).toBe('A1');
      expect(normalizeFormula('_xlfn._TRO_ALL(A1:B2)')).toBe('A1.:.B2');
      expect(normalizeFormula('_xlfn._TRO_ALL( A1:B2 )')).toBe('A1.:.B2');
      expect(normalizeFormula('SUM( _xlfn._TRO_ALL( A1:B2 ) )')).toBe('SUM( A1.:.B2 )');
      expect(normalizeFormula('_TRO_ALL(A1:B2)')).toBe('A1.:.B2');
      // test r1c1
    });

    it('should convert _TRO_LEADING to ".:"', () => {
      expect(normalizeFormula('_xlfn._TRO_LEADING(A1)')).toBe('A1');
      expect(normalizeFormula('_xlfn._TRO_LEADING(A1:B2)')).toBe('A1.:B2');
      expect(normalizeFormula('_xlfn._TRO_LEADING( A1:B2 )')).toBe('A1.:B2');
      expect(normalizeFormula('SUM( _xlfn._TRO_LEADING( A1:B2 ) )')).toBe('SUM( A1.:B2 )');
      expect(normalizeFormula('_TRO_LEADING(A1:B2)')).toBe('A1.:B2');
    });

    it('should convert _TRO_TRAILING to ":."', () => {
      expect(normalizeFormula('_xlfn._TRO_TRAILING(A1)')).toBe('A1');
      expect(normalizeFormula('_xlfn._TRO_TRAILING(A1:B2)')).toBe('A1:.B2');
      expect(normalizeFormula('_xlfn._TRO_TRAILING( A1:B2 )')).toBe('A1:.B2');
      expect(normalizeFormula('SUM( _xlfn._TRO_TRAILING( A1:B2 ) )')).toBe('SUM( A1:.B2 )');
      expect(normalizeFormula('_TRO_TRAILING(A1:B2)')).toBe('A1:.B2');
    });
  });

  describe('SINGLE & ANCHORARRAY handling', () => {
    it('should convert ANCHORARRAY to #', () => {
      expect(normalizeFormula('_xlfn.ANCHORARRAY(D1)')).toBe('D1#');
      expect(normalizeFormula('_xlfn.ANCHORARRAY( D1:ZZ10 )')).toBe('D1:ZZ10#');
      expect(normalizeFormula('_xlfn.ANCHORARRAY(INDIRECT("D1"))')).toBe('INDIRECT("D1")#');
      expect(normalizeFormula('_xlfn.ANCHORARRAY(#REF!)')).toBe('#REF!#');
      expect(normalizeFormula('SUM( _xlfn.ANCHORARRAY(D1:ZZ10) + 12 )')).toBe('SUM( D1:ZZ10# + 12 )');
      // invalid expression, but WTH:
      expect(normalizeFormula('_xlfn.ANCHORARRAY(SUM({1,2,3,4}))')).toBe('SUM({1,2,3,4})#');
    });

    it('should convert SINGLE to @', () => {
      expect(normalizeFormula('_xlfn.SINGLE(A1)')).toBe('@A1');
      expect(normalizeFormula('_xlfn.SINGLE( A1 )')).toBe('@A1');
      expect(normalizeFormula('SINGLE(A1 )')).toBe('@A1');
      expect(normalizeFormula('SINGLE( A1)')).toBe('@A1');
      expect(normalizeFormula('_xlfn.SINGLE(INDIRECT("A1"))')).toBe('@INDIRECT("A1")');
      expect(normalizeFormula('_xlfn.SINGLE(#REF!)')).toBe('@#REF!');
      expect(normalizeFormula('_xlfn.SINGLE(A1:B1:C1:D1)')).toBe('@A1:B1:C1:D1');
      expect(normalizeFormula('_xlfn.SINGLE(_xlfn.XLOOKUP(1,B1:B4,A1:A4))')).toBe('@XLOOKUP(1,B1:B4,A1:A4)');
      expect(normalizeFormula('SINGLE(SUM({1,2,3},(1+2)))')).toBe('@SUM({1,2,3},(1+2))');
      expect(normalizeFormula('SUM( _xlfn.SINGLE(D1:ZZ10) + 12 )')).toBe('SUM( @D1:ZZ10 + 12 )');
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
      expect(normalizeFormula('_xlfn.IF(_xlfn.ISNA(A1),"",A1)'))
        .toBe('IF(ISNA(A1),"",A1)');

      expect(normalizeFormula('SUM(_xlfn.IFERROR(A1:A10,0))'))
        .toBe('SUM(IFERROR(A1:A10,0))');
    });

    it('should handle formulas with mixed content', () => {
      const formula = '_xlfn.CONCATENATE("Value: ",_xlfn.TEXT(A1,"0.00"))';
      expect(normalizeFormula(formula))
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
        expect(normalizeFormula(formula)).toBe(formula);
      });
    });

    it('should handle special characters in formulas', () => {
      const formula = '_xlfn.REGEX("test@example.com","[a-z]+@[a-z]+\\.[a-z]+")';
      const result = normalizeFormula(formula);
      expect(result).toBe('REGEX("test@example.com","[a-z]+@[a-z]+\\.[a-z]+")');
    });

    it('should preserve whitespace and formatting', () => {
      const formula = '_xlfn.SUM( A1 : B2 )';
      expect(normalizeFormula(formula)).toBe('SUM( A1 : B2 )');
    });
  });

  describe('preservePrefixes', () => {
    const pp = { externalLinks: [], preservePrefixes: true };

    it('should preserve _xlfn namespace on functions', () => {
      expect(normalizeFormula('_xlfn.IFERROR(A1,0)', pp)).toBe('_xlfn.IFERROR(A1,0)');
      expect(normalizeFormula('_xlfn.SUMIFS(A:A,B:B,">0")', pp)).toBe('_xlfn.SUMIFS(A:A,B:B,">0")');
    });

    it('should preserve _xludf namespace on functions', () => {
      expect(normalizeFormula('_xludf.CUSTOMFUNC(A1)', pp)).toBe('_xludf.CUSTOMFUNC(A1)');
    });

    it('should preserve _xlws namespace on functions', () => {
      expect(normalizeFormula('_xlws.WEBSERVICE("http://example.com")', pp))
        .toBe('_xlws.WEBSERVICE("http://example.com")');
    });

    it('should preserve SINGLE as function call', () => {
      expect(normalizeFormula('_xlfn.SINGLE(A1)', pp)).toBe('_xlfn.SINGLE(A1)');
      expect(normalizeFormula('SINGLE(A1)', pp)).toBe('SINGLE(A1)');
    });

    it('should preserve ANCHORARRAY as function call', () => {
      expect(normalizeFormula('_xlfn.ANCHORARRAY(D1)', pp)).toBe('_xlfn.ANCHORARRAY(D1)');
      expect(normalizeFormula('ANCHORARRAY(D1)', pp)).toBe('ANCHORARRAY(D1)');
    });

    it('should preserve _TRO_* as function calls', () => {
      expect(normalizeFormula('_xlfn._TRO_ALL(A1:B2)', pp)).toBe('_xlfn._TRO_ALL(A1:B2)');
      expect(normalizeFormula('_xlfn._TRO_LEADING(A1:B2)', pp)).toBe('_xlfn._TRO_LEADING(A1:B2)');
      expect(normalizeFormula('_xlfn._TRO_TRAILING(A1:B2)', pp)).toBe('_xlfn._TRO_TRAILING(A1:B2)');
    });

    it('should preserve _xlpm and _xlnm on named references', () => {
      expect(normalizeFormula('_xlpm.MyName', pp)).toBe('_xlpm.MyName');
      expect(normalizeFormula('_xlnm.Print_Area', pp)).toBe('_xlnm.Print_Area');
      expect(normalizeFormula('SUM(_xlpm.DataRange)', pp)).toBe('SUM(_xlpm.DataRange)');
    });

    it('should still normalize external references', () => {
      const wb = { externalLinks: [ { name: 'External.xlsx' } ], preservePrefixes: true };
      expect(normalizeFormula('[1]Sheet1!A1', wb)).toBe('[External.xlsx]Sheet1!A1');
    });

    it('should preserve prefixes while normalizing external references', () => {
      const wb = { externalLinks: [ { name: 'External.xlsx' } ], preservePrefixes: true };
      expect(normalizeFormula('_xlfn.IFERROR(_xlpm.MyName+[1]Sheet1!A1,0)', wb))
        .toBe('_xlfn.IFERROR(_xlpm.MyName+[External.xlsx]Sheet1!A1,0)');
    });

    it('should preserve LET with _xlpm parameters and fx parses c:r as name range not column range', () => {
      const formula = '_xlfn.LET(_xlpm.c, C24,_xlpm.r, OFFSET(_xlpm.c,1,1), _xlpm.c:_xlpm.r)';
      const result = normalizeFormula(formula, pp);
      expect(result).toBe(formula);

      // With prefixes preserved, fx tokenizes "_xlpm.c" and "_xlpm.r" as
      // separate named references (REF_NAMED) joined by a ":" operator —
      // a normal range between two LET-parameter names.
      const tokens = tokenize(result);
      const lastNamedIdx = tokens.reduce((acc, t, i) => (t.type === tokenTypes.REF_NAMED ? i : acc), -1);
      const lastRef = tokens[lastNamedIdx];
      expect(lastRef.value).toBe('_xlpm.r');
      const prevRef = tokens[lastNamedIdx - 2];
      expect(prevRef.value).toBe('_xlpm.c');
      expect(prevRef.type).toBe(tokenTypes.REF_NAMED);
      const colon = tokens[lastNamedIdx - 1];
      expect(colon.value).toBe(':');

      // Without preservePrefixes, prefixes are stripped and "c:r" becomes a
      // column range (REF_BEAM) — the wrong interpretation.
      const stripped = normalizeFormula(formula);
      const strippedTokens = tokenize(stripped);
      const beamToken = strippedTokens.find(t => t.value === 'c:r');
      expect(beamToken).toBeDefined();
      expect(beamToken.type).toBe(tokenTypes.REF_BEAM);
    });
  });
});
