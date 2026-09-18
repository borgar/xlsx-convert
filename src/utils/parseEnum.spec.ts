import { describe, it, expect } from 'vitest';
import { parseEnum } from './parseEnum.ts';

const COLORS = new Set([ 'red', 'green', 'blue' ] as const);

describe('parseEnum', () => {
  it('should return mapped values for recognized keys', () => {
    const colors = new Map([ [ 'r', 'red' ], [ 'g', 'green' ], [ '', '' ] ] as const);
    expect(parseEnum('r', colors)).toBe('red');
    expect(parseEnum('g', colors)).toBe('green');
    expect(parseEnum('', colors)).toBe('');
  });

  it('should return undefined for missing or unknown map keys', () => {
    const colors = new Map([ [ 'r', 'red' ] ] as const);
    for (const value of [ null, undefined, '', 'red', 'constructor', '__proto__' ]) {
      expect(parseEnum(value, colors)).toBeUndefined();
    }
  });

  it('should return the value when it is in the set', () => {
    expect(parseEnum('red', COLORS)).toBe('red');
    expect(parseEnum('blue', COLORS)).toBe('blue');
  });

  it('should return undefined for values not in the set', () => {
    expect(parseEnum('yellow', COLORS)).toBeUndefined();
  });

  it('should return undefined for null', () => {
    expect(parseEnum(null, COLORS)).toBeUndefined();
  });

  it('should return undefined for undefined', () => {
    expect(parseEnum(undefined, COLORS)).toBeUndefined();
  });

  it('should return undefined for empty string when not in set', () => {
    expect(parseEnum('', COLORS)).toBeUndefined();
  });

  it('should return empty string when it is in the set', () => {
    const withEmpty = new Set([ '', 'a' ] as const);
    expect(parseEnum('', withEmpty)).toBe('');
  });
});
