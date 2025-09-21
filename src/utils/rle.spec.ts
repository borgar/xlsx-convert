import { describe, it, expect } from 'vitest';
import { rle } from './rle.js';

describe('rle', () => {
  describe('basic functionality', () => {
    it('should handle empty input', () => {
      expect(rle([], 20)).toEqual([]);
    });

    it('should handle single item', () => {
      const input: [number, number][] = [ [ 1, 30 ] ];
      expect(rle(input, 20)).toEqual([ {
        start: 1,
        end: 1,
        size: 30,
      } ]);
    });

    it('should handle multiple non-consecutive items', () => {
      const input: [number, number][] = [ [ 1, 30 ], [ 3, 25 ], [ 5, 40 ] ];
      expect(rle(input, 20)).toEqual([
        { start: 1, end: 1, size: 30 },
        { start: 3, end: 3, size: 25 },
        { start: 5, end: 5, size: 40 },
      ]);
    });
  });

  describe('run-length encoding', () => {
    it('should compress consecutive items with same size', () => {
      const input: [number, number][] = [ [ 1, 30 ], [ 2, 30 ], [ 3, 30 ] ];
      expect(rle(input, 20)).toEqual([ {
        start: 1,
        end: 3,
        size: 30,
      } ]);
    });

    it('should handle mixed consecutive and non-consecutive runs', () => {
      const input: [number, number][] = [
        [ 1, 30 ], // consecutive run
        [ 2, 30 ],
        [ 4, 25 ], // single item
        [ 6, 40 ], // another consecutive run
        [ 7, 40 ],
        [ 8, 40 ],
      ];
      expect(rle(input, 20)).toEqual([
        { start: 1, end: 2, size: 30 },
        { start: 4, end: 4, size: 25 },
        { start: 6, end: 8, size: 40 },
      ]);
    });

    it('should break runs when sizes differ', () => {
      const input: [number, number][] = [
        [ 1, 30 ], [ 2, 30 ], [ 3, 25 ], [ 4, 25 ], [ 5, 30 ],
      ];
      expect(rle(input, 20)).toEqual([
        { start: 1, end: 2, size: 30 },
        { start: 3, end: 4, size: 25 },
        { start: 5, end: 5, size: 30 },
      ]);
    });

    it('should break runs when indices are not consecutive', () => {
      const input: [number, number][] = [
        [ 1, 30 ], [ 2, 30 ], [ 4, 30 ], [ 5, 30 ],  // gap between 2 and 4
      ];
      expect(rle(input, 20)).toEqual([
        { start: 1, end: 2, size: 30 },
        { start: 4, end: 5, size: 30 },
      ]);
    });
  });

  describe('default value filtering', () => {
    it('should filter out items with default value', () => {
      const input: [number, number][] = [
        [ 1, 30 ], [ 2, 20 ], [ 3, 25 ],  // 20 is default
      ];
      expect(rle(input, 20)).toEqual([
        { start: 1, end: 1, size: 30 },
        { start: 3, end: 3, size: 25 },
      ]);
    });

    it('should filter out consecutive runs with default value', () => {
      const input: [number, number][] = [
        [ 1, 30 ], [ 2, 20 ], [ 3, 20 ], [ 4, 20 ], [ 5, 25 ],
      ];
      expect(rle(input, 20)).toEqual([
        { start: 1, end: 1, size: 30 },
        { start: 5, end: 5, size: 25 },
      ]);
    });

    it('should handle all items having default value', () => {
      const input: [number, number][] = [
        [ 1, 20 ], [ 2, 20 ], [ 3, 20 ],
      ];
      expect(rle(input, 20)).toEqual([]);
    });

    it('should handle different default values', () => {
      const input: [number, number][] = [
        [ 1, 30 ], [ 2, 50 ], [ 3, 25 ],
      ];
      expect(rle(input, 30)).toEqual([
        { start: 2, end: 2, size: 50 },
        { start: 3, end: 3, size: 25 },
      ]);
      expect(rle(input, 50)).toEqual([
        { start: 1, end: 1, size: 30 },
        { start: 3, end: 3, size: 25 },
      ]);
    });
  });

  describe('input sorting', () => {
    it('should sort input by index before processing', () => {
      const input: [number, number][] = [
        [ 3, 30 ], [ 1, 30 ], [ 2, 30 ],  // unsorted
      ];
      expect(rle(input, 20)).toEqual([ {
        start: 1,
        end: 3,
        size: 30,
      } ]);
    });

    it('should handle negative indices', () => {
      const input: [number, number][] = [
        [ -1, 30 ], [ 0, 30 ], [ 1, 30 ],
      ];
      expect(rle(input, 20)).toEqual([ {
        start: -1,
        end: 1,
        size: 30,
      } ]);
    });

    it('should handle duplicate indices (last one wins after sort)', () => {
      const input: [number, number][] = [
        [ 1, 30 ], [ 1, 25 ], [ 2, 25 ],
      ];
      expect(rle(input, 20)).toEqual([
        { start: 1, end: 1, size: 30 },
        { start: 1, end: 2, size: 25 },
      ]);
    });
  });

  describe('complex scenarios', () => {
    it('should handle Excel-like column widths', () => {
      // Simulating Excel column widths where default is typically around 64 pixels
      const input: [number, number][] = [
        [ 1, 80 ],   // wider column A
        [ 2, 64 ],   // default column B
        [ 3, 64 ],   // default column C
        [ 4, 100 ],  // wider column D
        [ 5, 100 ],  // wider column E
        [ 6, 64 ],   // default column F
        [ 7, 120 ],  // widest column G
      ];
      expect(rle(input, 64)).toEqual([
        { start: 1, end: 1, size: 80 },
        { start: 4, end: 5, size: 100 },
        { start: 7, end: 7, size: 120 },
      ]);
    });

    it('should handle Excel-like row heights', () => {
      // Simulating Excel row heights where default is typically around 20 pixels
      const input: [number, number][] = [
        [ 1, 25 ],   // taller row 1
        [ 2, 20 ],   // default row 2
        [ 3, 30 ],   // taller row 3
        [ 4, 30 ],   // taller row 4
        [ 5, 20 ],   // default row 5
        [ 6, 20 ],   // default row 6
      ];
      expect(rle(input, 20)).toEqual([
        { start: 1, end: 1, size: 25 },
        { start: 3, end: 4, size: 30 },
      ]);
    });

    it('should handle sparse data with large gaps', () => {
      const input: [number, number][] = [
        [ 1, 30 ], [ 100, 30 ], [ 1000, 25 ], [ 1001, 25 ],
      ];
      expect(rle(input, 20)).toEqual([
        { start: 1, end: 1, size: 30 },
        { start: 100, end: 100, size: 30 },
        { start: 1000, end: 1001, size: 25 },
      ]);
    });
  });

  describe('edge cases', () => {
    it('should handle zero sizes', () => {
      const input: [number, number][] = [
        [ 1, 0 ], [ 2, 0 ], [ 3, 30 ],
      ];
      expect(rle(input, 20)).toEqual([
        { start: 1, end: 2, size: 0 },
        { start: 3, end: 3, size: 30 },
      ]);
    });

    it('should handle negative sizes', () => {
      const input: [number, number][] = [
        [ 1, -10 ], [ 2, -10 ], [ 3, 30 ],
      ];
      expect(rle(input, 20)).toEqual([
        { start: 1, end: 2, size: -10 },
        { start: 3, end: 3, size: 30 },
      ]);
    });

    it('should handle very large indices and sizes', () => {
      const input: [number, number][] = [
        [ 1000000, 999999 ], [ 1000001, 999999 ],
      ];
      expect(rle(input, 64)).toEqual([ {
        start: 1000000,
        end: 1000001,
        size: 999999,
      } ]);
    });

    it('should handle floating point sizes', () => {
      const input: [number, number][] = [
        [ 1, 30.5 ], [ 2, 30.5 ], [ 3, 25.7 ],
      ];
      expect(rle(input, 20)).toEqual([
        { start: 1, end: 2, size: 30.5 },
        { start: 3, end: 3, size: 25.7 },
      ]);
    });
  });

  describe('return type validation', () => {
    it('should return array of JSFGridSize objects', () => {
      const input: [number, number][] = [ [ 1, 30 ], [ 2, 25 ] ];
      const result = rle(input, 20);

      expect(Array.isArray(result)).toBe(true);
      result.forEach(item => {
        expect(item).toHaveProperty('start');
        expect(item).toHaveProperty('end');
        expect(item).toHaveProperty('size');
        expect(typeof item.start).toBe('number');
        expect(typeof item.end).toBe('number');
        expect(typeof item.size).toBe('number');
        expect(item.start).toBeLessThanOrEqual(item.end);
      });
    });

    it('should maintain start <= end invariant', () => {
      const input: [number, number][] = [
        [ 5, 30 ], [ 3, 30 ], [ 1, 30 ], [ 4, 30 ], [ 2, 30 ],
      ];
      rle(input, 20).forEach(item => {
        expect(item.start).toBeLessThanOrEqual(item.end);
      });
    });
  });
});
