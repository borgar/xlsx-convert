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

  it('covers the expanded font set', () => {
    expect(maxDigitWidth('Aptos', 12)).toBe(6); // 1094/2048*12 = 6.41
    expect(maxDigitWidth('Calibri Light', 11)).toBe(6); // shares Calibri's 1038
    expect(maxDigitWidth('Times New Roman', 10)).toBe(5); // 1024/2048*10 = 5.0
    expect(maxDigitWidth('Times New Roman', 11)).toBe(6); // 1024/2048*11 = 5.5
    expect(maxDigitWidth('Verdana', 12)).toBe(8); // 1302/2048*12 = 7.63
    expect(maxDigitWidth('Verdana', 14)).toBe(9); // 1302/2048*14 = 8.90
    expect(maxDigitWidth('Georgia', 12)).toBe(7); // 1257/2048*12 = 7.36
    expect(maxDigitWidth('Georgia', 14)).toBe(9); // 1257/2048*14 = 8.59
    expect(maxDigitWidth('Tahoma', 12)).toBe(7); // 1118/2048*12 = 6.55
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
