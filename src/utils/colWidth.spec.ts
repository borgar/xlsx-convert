import { describe, it, expect } from 'vitest';
import { colWidth } from './colWidth.js';

describe('colWidth', () => {
  describe('basic functionality', () => {
    it('should return correct width for positive character values', () => {
      expect(colWidth(1)).toBe(6);
      expect(colWidth(5)).toBe(30);
      expect(colWidth(10)).toBe(60);
      expect(colWidth(15)).toBe(90);
    });

    it('should handle decimal character values', () => {
      expect(colWidth(1.5)).toBe(9);
      expect(colWidth(2.75)).toBe(16);
      expect(colWidth(10.25)).toBe(61);
    });

    it('should apply padding correctly', () => {
      expect(colWidth(5, 10)).toBe(40);
      expect(colWidth(10, 5)).toBe(65);
      expect(colWidth(1, 20)).toBe(26);
    });

    it('should use custom MDW (Max Digit Width)', () => {
      expect(colWidth(5, 0, 7)).toBe(35);
      expect(colWidth(5, 0, 8)).toBe(40);
      expect(colWidth(10, 0, 5)).toBe(50);
    });

    it('should combine padding and custom MDW', () => {
      expect(colWidth(5, 10, 7)).toBe(45);
      expect(colWidth(10, 5, 8)).toBe(85);
    });
  });

  describe('edge cases', () => {
    it('should return null for null input', () => {
      expect(colWidth(null)).toBe(null);
    });

    it('should return null for undefined input', () => {
      expect(colWidth(undefined)).toBe(null);
    });

    it('should return null for NaN input', () => {
      expect(colWidth(NaN)).toBe(null);
    });

    it('should return 0 for zero input', () => {
      expect(colWidth(0)).toBe(0);
    });

    it('should return 0 for negative input', () => {
      expect(colWidth(-1)).toBe(0);
      expect(colWidth(-10)).toBe(0);
      expect(colWidth(-0.5)).toBe(0);
    });
  });

  describe('mathematical properties', () => {
    it('should always return integer values', () => {
      const testValues = [ 1.1, 2.7, 5.3, 8.43, 12.9, 15.6 ];

      testValues.forEach(value => {
        const result = colWidth(value);
        expect(Number.isInteger(result)).toBe(true);
      });
    });

    it('should be monotonically increasing for positive inputs', () => {
      const prev = colWidth(1);
      for (let chars = 1.1; chars <= 20; chars += 0.1) {
        const current = colWidth(chars);
        expect(current).toBeGreaterThanOrEqual(prev);
      }
    });

    it('should scale approximately linearly', () => {
      const width1 = colWidth(1);
      const width10 = colWidth(10);
      const width20 = colWidth(20);

      // Should be roughly proportional (allowing for rounding differences)
      expect(width10).toBeGreaterThan(width1 * 8);
      expect(width10).toBeLessThan(width1 * 12);
      expect(width20).toBeGreaterThan(width10 * 1.8);
      expect(width20).toBeLessThan(width10 * 2.2);
    });
  });

  describe('default parameters', () => {
    it('should use default padding of 0', () => {
      expect(colWidth(5)).toBe(colWidth(5, 0));
    });

    it('should use default MDW of 6', () => {
      expect(colWidth(5)).toBe(colWidth(5, 0, 6));
      expect(colWidth(5, 10)).toBe(colWidth(5, 10, 6));
    });
  });
});
