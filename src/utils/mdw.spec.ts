import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_MDW, maxDigitWidth, resolveColumnMdw } from './mdw.js';

describe('maxDigitWidth', () => {
  it('rounds advance/upm*size for known fonts (Excel-verified, F009)', () => {
    expect(maxDigitWidth('Aptos Narrow', 12)).toBe(6);
    expect(maxDigitWidth('Aptos Narrow', 13)).toBe(7);
    expect(maxDigitWidth('Calibri', 11)).toBe(6);
    expect(maxDigitWidth('Calibri', 14)).toBe(7);
  });

  it('crosses Arial MDW 6/7/8 boundaries (1139/2048)', () => {
    expect(maxDigitWidth('Arial', 11)).toBe(6);
    expect(maxDigitWidth('Arial', 12)).toBe(7);
    expect(maxDigitWidth('Arial', 14)).toBe(8);
  });

  it('is case- and whitespace-insensitive on the family name', () => {
    expect(maxDigitWidth('  ARIAL  ', 12)).toBe(7);
  });

  it('returns undefined for an unknown font', () => {
    expect(maxDigitWidth('Comic Sans MS', 12)).toBeUndefined();
  });

  it('lets a resolver override the table', () => {
    expect(maxDigitWidth('Arial', 12, () => 9)).toBe(9);
    expect(maxDigitWidth('Arial', 12, () => undefined)).toBe(7);
  });
});

describe('resolveColumnMdw', () => {
  it('returns the table value without warning for known fonts', () => {
    const warn = vi.fn();
    expect(resolveColumnMdw('Arial', 12, { warn })).toBe(7);
    expect(warn).not.toHaveBeenCalled();
  });

  it('falls back to DEFAULT_MDW and warns for unknown fonts', () => {
    const warn = vi.fn();
    expect(resolveColumnMdw('Comic Sans MS', 12, { warn })).toBe(DEFAULT_MDW);
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toContain('Comic Sans MS');
  });

  it('prefers a resolver over the fallback', () => {
    const warn = vi.fn();
    expect(resolveColumnMdw('Comic Sans MS', 12, { resolveMdw: () => 5, warn })).toBe(5);
    expect(warn).not.toHaveBeenCalled();
  });
});
