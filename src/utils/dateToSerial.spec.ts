import { describe, it, expect } from 'vitest';
import { dateToSerial } from './dateToSerial.js';

describe('dateToSerial', () => {
  describe('basic functionality', () => {
    it('should convert valid dates to Excel serial numbers', () => {
      expect(dateToSerial(new Date(1900, 0, 0))).toBe(0);
      expect(dateToSerial(new Date(1900, 0, 1))).toBe(1);
      expect(dateToSerial(new Date(1900, 0, 2))).toBe(2);
    });

    it('should handle dates with time components', () => {
      // January 1, 1900 at noon should be 1.5
      expect(dateToSerial(new Date(1900, 0, 1, 12, 0, 0, 0))).toBe(1.5);
      // January 1, 1900 at 6 AM should be 1.25
      expect(dateToSerial(new Date(1900, 0, 1, 6, 0, 0, 0))).toBe(1.25);
      // January 1, 1900 at 6 PM should be 1.75
      expect(dateToSerial(new Date(1900, 0, 1, 18, 0, 0, 0))).toBe(1.75);
    });

    it('should handle fractional time components', () => {
      // Test with minutes and seconds
      const dateWithMinutes = new Date(1900, 0, 1, 0, 30, 0, 0); // 30 minutes = 0.5/24 hours
      const expected = 1 + (30 / (60 * 24)); // 1 + 0.020833...
      expect(dateToSerial(dateWithMinutes)).toBeCloseTo(expected, 5);

      // Test with seconds
      const dateWithSeconds = new Date(1900, 0, 1, 0, 0, 30, 0); // 30 seconds
      const expectedSeconds = 1 + (30 / (60 * 60 * 24)); // 1 + 0.000347...
      expect(dateToSerial(dateWithSeconds)).toBeCloseTo(expectedSeconds, 6);

      // Test with milliseconds
      const dateWithMs = new Date(1900, 0, 1, 0, 0, 0, 500); // 500 milliseconds
      const expectedMs = 1 + (500 / (1000 * 60 * 60 * 24));
      expect(dateToSerial(dateWithMs)).toBeCloseTo(expectedMs, 8);
    });
  });

  describe('Excel date system compatibility', () => {
    it('should handle the Excel 1900 date system correctly', () => {
      // Excel incorrectly treats 1900 as a leap year, but this function
      // should still convert dates correctly relative to the epoch

      // March 1, 1900 (after the non-existent Feb 29, 1900 in Excel)
      expect(dateToSerial(new Date(1900, 2, 1))).toBe(61);
    });

    it('should handle dates before Excel epoch (before 1900)', () => {
      expect(dateToSerial(new Date(1899, 11, 31))).toBe(0);
    });

    it('should handle modern dates correctly', () => {
      expect(dateToSerial(new Date(2000, 0, 1))).toBe(36526);
      expect(dateToSerial(new Date(2020, 0, 1))).toBe(43831);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle invalid dates', () => {
      expect(dateToSerial(new Date('invalid'))).toBe(null);
    });

    it('should handle dates with invalid components', () => {
      // Date automatically adjusts these, so it should still work
      expect(dateToSerial(new Date(2000, 13, 1))).toBe(36923);
      expect(dateToSerial(new Date(2000, 0, 32))).toBe(36557);
    });

    it('should handle extreme dates', () => {
      expect(dateToSerial(new Date(1800, 0, 1))).toBe(-36523);
      expect(dateToSerial(new Date(2100, 0, 1))).toBe(73051);
    });
  });

  describe('mathematical properties', () => {
    it('should be monotonic - later dates have higher serial numbers', () => {
      const serial1 = dateToSerial(new Date(2000, 0, 1));
      const serial2 = dateToSerial(new Date(2000, 0, 2));
      const serial3 = dateToSerial(new Date(2000, 0, 3));
      expect(serial2).toBeGreaterThan(serial1);
      expect(serial3).toBeGreaterThan(serial2);
    });

    it('should have consistent day differences', () => {
      const serial1 = dateToSerial(new Date(2000, 0, 1));
      const serial2 = dateToSerial(new Date(2000, 0, 2));
      expect(serial2 - serial1).toBe(1);
    });

    it('should handle time precision correctly', () => {
      const baseSerial = dateToSerial(new Date(2000, 0, 1, 0, 0, 0, 0));
      const hourSerial = dateToSerial(new Date(2000, 0, 1, 1, 0, 0, 0));
      // 1 hour = 1/24 of a day
      expect(hourSerial - baseSerial).toBeCloseTo(1 / 24, 10);
    });
  });

  describe('timezone handling', () => {
    it('should convert local time to UTC-based serial numbers', () => {
      // The function creates a UTC date from local date components
      // This test verifies the conversion is consistent
      const serial = dateToSerial(new Date(2000, 0, 1, 12, 0, 0, 0));
      expect(typeof serial).toBe('number');
      expect(serial).toBeGreaterThan(36526); // Should be > Jan 1, 2000
      expect(serial).toBeLessThan(36527); // Should be < Jan 2, 2000
    });

    it('should handle same local time across different dates', () => {
      const serial1 = dateToSerial(new Date(2000, 0, 1, 15, 30, 0, 0));
      const serial2 = dateToSerial(new Date(2000, 0, 2, 15, 30, 0, 0));
      expect(serial2 - serial1).toBe(1);
    });
  });

  describe('specific known values', () => {
    it('should match known Excel serial numbers for specific dates', () => {
      // January 1, 1901 (avoiding the 1900 leap year issue)
      const serial1901 = dateToSerial(new Date(1901, 0, 1));
      expect(serial1901).toBe(367); // Should be around 367
      // December 31, 1999
      const serial1999 = dateToSerial(new Date(1999, 11, 31));
      expect(serial1999).toBe(36525); // Should be around 36525
    });
  });
});
