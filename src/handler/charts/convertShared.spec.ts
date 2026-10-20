import { describe, it, expect } from 'vitest';
import { toValue } from './convertShared.ts';

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
