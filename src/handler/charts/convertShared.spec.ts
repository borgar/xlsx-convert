import { describe, it, expect } from 'vitest';
import { splitUnion, toValue } from './convertShared.ts';

describe('toValue', () => {
  it('keeps text data as text, even when it looks like an error', () => {
    expect(toValue('#N/A', false, true)).toBe('#N/A');
    expect(toValue('#DIV/0!', false)).toBe('#DIV/0!');
    expect(toValue('12', false)).toBe('12');
  });

  it('reads #N/A in legacy number data as an error', () => {
    expect(toValue('3.5', true, true)).toBe(3.5);
    expect(toValue('#N/A', true, true)).toEqual({ t: 'e', v: '#N/A' });
  });

  it('reads no errors in ChartEx number data', () => {
    expect(toValue('#N/A', true)).toBe('#N/A');
  });
});

describe('splitUnion', () => {
  it('splits a union of ranges', () => {
    expect(splitUnion('(Sheet1!$E$2:$E$6,Sheet1!$A$2:$A$6)')).toEqual([ 'Sheet1!$E$2:$E$6', 'Sheet1!$A$2:$A$6' ]);
    expect(splitUnion("('A, B'!$E$2:$E$6,'A, B'!$A$2:$A$6)")).toEqual([ "'A, B'!$E$2:$E$6", "'A, B'!$A$2:$A$6" ]);
  });

  it('gives nothing for a single range, or for something other than ranges', () => {
    expect(splitUnion('Sheet1!$A$2:$B$6')).toBeUndefined();
    expect(splitUnion('(Sheet1!$A$2:$B$6)')).toBeUndefined();
    expect(splitUnion('(SUM(A1),Sheet1!$A$2:$A$6)')).toBeUndefined();
  });
});
