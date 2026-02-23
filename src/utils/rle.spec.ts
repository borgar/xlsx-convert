import { describe, it, expect } from 'vitest';
import { rle } from './rle.js';
import type { GridSize } from '@jsfkit/types';

describe('rle', () => {
  describe('basic functionality', () => {
    it('should handle empty input', () => {
      expect(rle([], 20)).toEqual([]);
    });

    it('should handle single item', () => {
      const input: GridSize[] = [
        { start: 1, end: 1, size: 30 },
      ];
      expect(rle(input, 20)).toEqual([ {
        start: 1,
        end: 1,
        size: 30,
      } ]);
    });

    it('should handle multiple non-consecutive items', () => {
      const input: GridSize[] = [
        { start: 1, end: 1, size: 30 },
        { start: 3, end: 3, size: 25 },
        { start: 5, end: 5, size: 40 },
      ];
      expect(rle(input, 20)).toEqual([
        { start: 1, end: 1, size: 30 },
        { start: 3, end: 3, size: 25 },
        { start: 5, end: 5, size: 40 },
      ]);
    });
  });

  describe('run-length encoding', () => {
    it('should compress consecutive items with same size', () => {
      const input: GridSize[] = [
        { start: 1, end: 1, size: 30 },
        { start: 2, end: 2, size: 30 },
        { start: 3, end: 3, size: 30 },
      ];
      expect(rle(input, 20)).toEqual([ {
        start: 1,
        end: 3,
        size: 30,
      } ]);
    });

    it('should handle mixed consecutive and non-consecutive runs', () => {
      const input: GridSize[] = [
        { start: 1, end: 1, size: 30 }, // consecutive run
        { start: 2, end: 2, size: 30 },
        { start: 4, end: 4, size: 25 }, // single item
        { start: 6, end: 6, size: 40 }, // another consecutive run
        { start: 7, end: 7, size: 40 },
        { start: 8, end: 8, size: 40 },
      ];
      expect(rle(input, 20)).toEqual([
        { start: 1, end: 2, size: 30 },
        { start: 4, end: 4, size: 25 },
        { start: 6, end: 8, size: 40 },
      ]);
    });

    it('should break runs when sizes differ', () => {
      const input: GridSize[] = [
        { start: 1, end: 1, size: 30 },
        { start: 2, end: 2, size: 30 },
        { start: 3, end: 3, size: 25 },
        { start: 4, end: 4, size: 25 },
        { start: 5, end: 5, size: 30 },
      ];
      expect(rle(input, 20)).toEqual([
        { start: 1, end: 2, size: 30 },
        { start: 3, end: 4, size: 25 },
        { start: 5, end: 5, size: 30 },
      ]);
    });

    it('should break runs when indices are not consecutive', () => {
      const input: GridSize[] = [
        { start: 1, end: 1, size: 30 },
        { start: 2, end: 2, size: 30 },
        { start: 4, end: 4, size: 30 },
        { start: 5, end: 5, size: 30 },  // gap between 2 and 4
      ];
      expect(rle(input, 20)).toEqual([
        { start: 1, end: 2, size: 30 },
        { start: 4, end: 5, size: 30 },
      ]);
    });
  });

  describe('default value filtering', () => {
    it('should filter out items with default value', () => {
      const input: GridSize[] = [
        { start: 1, end: 1, size: 30 },
        { start: 2, end: 2, size: 20 },
        { start: 3, end: 3, size: 25 },  // 20 is default
      ];
      expect(rle(input, 20)).toEqual([
        { start: 1, end: 1, size: 30 },
        { start: 3, end: 3, size: 25 },
      ]);
    });

    it('should filter out consecutive runs with default value', () => {
      const input: GridSize[] = [
        { start: 1, end: 1, size: 30 },
        { start: 2, end: 2, size: 20 },
        { start: 3, end: 3, size: 20 },
        { start: 4, end: 4, size: 20 },
        { start: 5, end: 5, size: 25 },
      ];
      expect(rle(input, 20)).toEqual([
        { start: 1, end: 1, size: 30 },
        { start: 5, end: 5, size: 25 },
      ]);
    });

    it('should handle all items having default value', () => {
      const input: GridSize[] = [
        { start: 1, end: 1, size: 20 },
        { start: 2, end: 2, size: 20 },
        { start: 3, end: 3, size: 20 },
      ];
      expect(rle(input, 20)).toEqual([]);
    });

    it('should handle different default values', () => {
      const input: GridSize[] = [
        { start: 1, end: 1, size: 30 },
        { start: 2, end: 2, size: 50 },
        { start: 3, end: 3, size: 25 },
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
      const input: GridSize[] = [
        { start: 3, end: 3, size: 30 },
        { start: 1, end: 1, size: 30 },
        { start: 2, end: 2, size: 30 },  // unsorted
      ];
      expect(rle(input, 20)).toEqual([ {
        start: 1,
        end: 3,
        size: 30,
      } ]);
    });

    it('should handle negative indices', () => {
      const input: GridSize[] = [
        { start: -1, end: -1, size: 30 },
        { start: 0, end: 0, size: 30 },
        { start: 1, end: 1, size: 30 },
      ];
      expect(rle(input, 20)).toEqual([ {
        start: -1,
        end: 1,
        size: 30,
      } ]);
    });

    it('should handle duplicate indices (last one wins after sort)', () => {
      const input: GridSize[] = [
        { start: 1, end: 1, size: 30 },
        { start: 1, end: 1, size: 25 },
        { start: 2, end: 2, size: 25 },
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
      const input: GridSize[] = [
        { start: 1, end: 1, size: 80 },   // wider column A
        { start: 2, end: 2, size: 64 },   // default column B
        { start: 3, end: 3, size: 64 },   // default column C
        { start: 4, end: 4, size: 100 },  // wider column D
        { start: 5, end: 5, size: 100 },  // wider column E
        { start: 6, end: 6, size: 64 },   // default column F
        { start: 7, end: 7, size: 120 },  // widest column G
      ];
      expect(rle(input, 64)).toEqual([
        { start: 1, end: 1, size: 80 },
        { start: 4, end: 5, size: 100 },
        { start: 7, end: 7, size: 120 },
      ]);
    });

    it('should handle Excel-like row heights', () => {
      // Simulating Excel row heights where default is typically around 20 pixels
      const input: GridSize[] = [
        { start: 1, end: 1, size: 25 },   // taller row 1
        { start: 2, end: 2, size: 20 },   // default row 2
        { start: 3, end: 3, size: 30 },   // taller row 3
        { start: 4, end: 4, size: 30 },   // taller row 4
        { start: 5, end: 5, size: 20 },   // default row 5
        { start: 6, end: 6, size: 20 },   // default row 6
      ];
      expect(rle(input, 20)).toEqual([
        { start: 1, end: 1, size: 25 },
        { start: 3, end: 4, size: 30 },
      ]);
    });

    it('should handle sparse data with large gaps', () => {
      const input: GridSize[] = [
        { start: 1, end: 1, size: 30 },
        { start: 100, end: 100, size: 30 },
        { start: 1000, end: 1000, size: 25 },
        { start: 1001, end: 1001, size: 25 },
      ];
      expect(rle(input, 20)).toEqual([
        { start: 1, end: 1, size: 30 },
        { start: 100, end: 100, size: 30 },
        { start: 1000, end: 1001, size: 25 },
      ]);
    });

    it('already compressed data should stay the same', () => {
      const input: GridSize[] = [
        { start: 1, end: 4, size: 10 },
        { start: 5, end: 7, size: 20 },
        { start: 10, end: 13, size: 30 },
      ];
      expect(rle(input, 1)).toEqual([
        { start: 1, end: 4, size: 10 },
        { start: 5, end: 7, size: 20 },
        { start: 10, end: 13, size: 30 },
      ]);
    });
  });

  describe('edge cases', () => {
    it('should handle zero sizes', () => {
      const input: GridSize[] = [
        { start: 1, end: 1, size: 0 },
        { start: 2, end: 2, size: 0 },
        { start: 3, end: 3, size: 30 },
      ];
      expect(rle(input, 20)).toEqual([
        { start: 1, end: 2, size: 0 },
        { start: 3, end: 3, size: 30 },
      ]);
    });

    it('should handle negative sizes', () => {
      const input: GridSize[] = [
        { start: 1, end: 1, size: -10 },
        { start: 2, end: 2, size: -10 },
        { start: 3, end: 3, size: 30 },
      ];
      expect(rle(input, 20)).toEqual([
        { start: 1, end: 2, size: -10 },
        { start: 3, end: 3, size: 30 },
      ]);
    });

    it('should handle very large indices and sizes', () => {
      const input: GridSize[] = [
        { start: 1000000, end: 1000000, size: 999999 },
        { start: 1000001, end: 1000001, size: 999999 },
      ];
      expect(rle(input, 64)).toEqual([ {
        start: 1000000,
        end: 1000001,
        size: 999999,
      } ]);
    });

    it('should handle floating point sizes', () => {
      const input: GridSize[] = [
        { start: 1, end: 1, size: 30.5 },
        { start: 2, end: 2, size: 30.5 },
        { start: 3, end: 3, size: 25.7 },
      ];
      expect(rle(input, 20)).toEqual([
        { start: 1, end: 2, size: 30.5 },
        { start: 3, end: 3, size: 25.7 },
      ]);
    });
  });

  describe('style property handling', () => {
    it('should preserve style property in output', () => {
      const input: GridSize[] = [
        { start: 1, end: 1, size: 30, s: 5 },
        { start: 2, end: 2, size: 25, s: 10 },
      ];
      expect(rle(input, 20)).toEqual([
        { start: 1, end: 1, size: 30, s: 5 },
        { start: 2, end: 2, size: 25, s: 10 },
      ]);
    });

    it('should compress consecutive items with same size and same style', () => {
      const input: GridSize[] = [
        { start: 1, end: 1, size: 30, s: 5 },
        { start: 2, end: 2, size: 30, s: 5 },
        { start: 3, end: 3, size: 30, s: 5 },
      ];
      expect(rle(input, 20)).toEqual([
        { start: 1, end: 3, size: 30, s: 5 },
      ]);
    });

    it('should break runs when styles differ even if size is same', () => {
      const input: GridSize[] = [
        { start: 1, end: 1, size: 30, s: 5 },
        { start: 2, end: 2, size: 30, s: 10 },
        { start: 3, end: 3, size: 30, s: 5 },
      ];
      expect(rle(input, 20)).toEqual([
        { start: 1, end: 1, size: 30, s: 5 },
        { start: 2, end: 2, size: 30, s: 10 },
        { start: 3, end: 3, size: 30, s: 5 },
      ]);
    });

    it('should break runs when one item has style and another does not', () => {
      const input: GridSize[] = [
        { start: 1, end: 1, size: 30, s: 5 },
        { start: 2, end: 2, size: 30 },
        { start: 3, end: 3, size: 30, s: 5 },
      ];
      expect(rle(input, 20)).toEqual([
        { start: 1, end: 1, size: 30, s: 5 },
        { start: 2, end: 2, size: 30 },
        { start: 3, end: 3, size: 30, s: 5 },
      ]);
    });

    it('should compress consecutive items without styles', () => {
      const input: GridSize[] = [
        { start: 1, end: 1, size: 30 },
        { start: 2, end: 2, size: 30 },
        { start: 3, end: 3, size: 30 },
      ];
      expect(rle(input, 20)).toEqual([
        { start: 1, end: 3, size: 30 },
      ]);
    });

    it('should keep items with default size if they have a style', () => {
      const input: GridSize[] = [
        { start: 1, end: 1, size: 20, s: 5 },
        { start: 2, end: 2, size: 20 },
        { start: 3, end: 3, size: 20, s: 10 },
      ];
      expect(rle(input, 20)).toEqual([
        { start: 1, end: 1, size: 20, s: 5 },
        { start: 3, end: 3, size: 20, s: 10 },
      ]);
    });

    it('should compress consecutive items with default size and same style', () => {
      const input: GridSize[] = [
        { start: 1, end: 1, size: 20, s: 5 },
        { start: 2, end: 2, size: 20, s: 5 },
        { start: 3, end: 3, size: 20, s: 5 },
      ];
      expect(rle(input, 20)).toEqual([
        { start: 1, end: 3, size: 20, s: 5 },
      ]);
    });

    it('should handle mixed styled and unstyled items with various sizes', () => {
      const input: GridSize[] = [
        { start: 1, end: 1, size: 30, s: 5 },
        { start: 2, end: 2, size: 30, s: 5 },
        { start: 3, end: 3, size: 30 },
        { start: 4, end: 4, size: 20, s: 10 },
        { start: 5, end: 5, size: 20 },
        { start: 6, end: 6, size: 25, s: 10 },
        { start: 7, end: 7, size: 25, s: 10 },
      ];
      expect(rle(input, 20)).toEqual([
        { start: 1, end: 2, size: 30, s: 5 },
        { start: 3, end: 3, size: 30 },
        { start: 4, end: 4, size: 20, s: 10 },
        { start: 6, end: 7, size: 25, s: 10 },
      ]);
    });

    it('should handle zero style values', () => {
      const input: GridSize[] = [
        { start: 1, end: 1, size: 30, s: 0 },
        { start: 2, end: 2, size: 30, s: 0 },
        { start: 3, end: 3, size: 30 },
      ];
      expect(rle(input, 20)).toEqual([
        { start: 1, end: 2, size: 30, s: 0 },
        { start: 3, end: 3, size: 30 },
      ]);
    });

    it('should handle negative style values', () => {
      const input: GridSize[] = [
        { start: 1, end: 1, size: 30, s: -1 },
        { start: 2, end: 2, size: 30, s: -1 },
      ];
      expect(rle(input, 20)).toEqual([
        { start: 1, end: 2, size: 30, s: -1 },
      ]);
    });

    it('should handle Excel-like scenario with column widths and styles', () => {
      const input: GridSize[] = [
        { start: 1, end: 1, size: 80, s: 1 },   // styled column A
        { start: 2, end: 2, size: 64 },          // default unstyled column B
        { start: 3, end: 3, size: 64, s: 2 },   // default with style column C
        { start: 4, end: 4, size: 100, s: 1 },  // styled column D
        { start: 5, end: 5, size: 100, s: 1 },  // styled column E (same style as D)
        { start: 6, end: 6, size: 64, s: 2 },   // default with style column F (same as C)
      ];
      expect(rle(input, 64)).toEqual([
        { start: 1, end: 1, size: 80, s: 1 },
        { start: 3, end: 3, size: 64, s: 2 },
        { start: 4, end: 5, size: 100, s: 1 },
        { start: 6, end: 6, size: 64, s: 2 },
      ]);
    });
  });

  describe('return type validation', () => {
    it('should return array of JSFGridSize objects', () => {
      const input: GridSize[] = [
        { start: 1, end: 1, size: 30 },
        { start: 2, end: 2, size: 25 },
      ];
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
      const input: GridSize[] = [
        { start: 5, end: 5, size: 30 },
        { start: 3, end: 3, size: 30 },
        { start: 1, end: 1, size: 30 },
        { start: 4, end: 4, size: 30 },
        { start: 2, end: 2, size: 30 },
      ];
      rle(input, 20).forEach(item => {
        expect(item.start).toBeLessThanOrEqual(item.end);
      });
    });
  });
});
