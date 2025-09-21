import { describe, it, expect, vi } from 'vitest';
import { attr, numAttr, boolAttr } from './attr.js';

// Mock Element interface for testing
type MockElement = {
  hasAttribute: (name: string) => boolean;
  getAttribute: (name: string) => string | null;
};

function createMockElement (attributes: Record<string, string>): MockElement {
  return {
    hasAttribute: vi.fn((name: string) => name in attributes),
    getAttribute: vi.fn((name: string) => attributes[name] ?? null),
  };
}

describe('attr', () => {
  describe('basic functionality', () => {
    it('should return attribute value when attribute exists', () => {
      const element = createMockElement({ 'data-value': 'test-value' });

      expect(attr(element as any, 'data-value')).toBe('test-value');
    });

    it('should return fallback when attribute does not exist', () => {
      const element = createMockElement({});

      expect(attr(element as any, 'missing-attr', 'default')).toBe('default');
    });

    it('should return null when attribute does not exist and no fallback provided', () => {
      const element = createMockElement({});

      expect(attr(element as any, 'missing-attr')).toBe(null);
    });

    it('should work with various attribute names', () => {
      const element = createMockElement({
        'id': '123',
        'class': 'my-class',
        'data-test': 'value',
        'xmlns:r': 'namespace',
      });

      expect(attr(element as any, 'id')).toBe('123');
      expect(attr(element as any, 'class')).toBe('my-class');
      expect(attr(element as any, 'data-test')).toBe('value');
      expect(attr(element as any, 'xmlns:r')).toBe('namespace');
    });
  });

  describe('fallback handling', () => {
    it('should handle different fallback types', () => {
      const element = createMockElement({});

      expect(attr(element as any, 'missing', 'string-fallback')).toBe('string-fallback');
      expect(attr(element as any, 'missing', 42 as any)).toBe(42);
      expect(attr(element as any, 'missing', true as any)).toBe(true);
      expect(attr(element as any, 'missing', [] as any)).toEqual([]);
    });

    it('should handle undefined fallback', () => {
      const element = createMockElement({});

      expect(attr(element as any, 'missing', undefined)).toBe(null);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string attribute values', () => {
      const element = createMockElement({ empty: '' });

      expect(attr(element as any, 'empty')).toBe('');
    });

    it('should handle attributes with special characters', () => {
      const element = createMockElement({
        special: 'value with spaces & symbols!@#$%',
        unicode: 'éñîçødë',
      });

      expect(attr(element as any, 'special')).toBe('value with spaces & symbols!@#$%');
      expect(attr(element as any, 'unicode')).toBe('éñîçødë');
    });
  });
});

describe('numAttr', () => {
  describe('basic functionality', () => {
    it('should convert numeric string attributes to numbers', () => {
      const element = createMockElement({
        count: '42',
        decimal: '3.14',
        negative: '-10',
        zero: '0',
      });

      expect(numAttr(element as any, 'count')).toBe(42);
      expect(numAttr(element as any, 'decimal')).toBe(3.14);
      expect(numAttr(element as any, 'negative')).toBe(-10);
      expect(numAttr(element as any, 'zero')).toBe(0);
    });

    it('should return fallback when attribute does not exist', () => {
      const element = createMockElement({});

      expect(numAttr(element as any, 'missing', 100)).toBe(100);
    });

    it('should return null when attribute does not exist and no fallback provided', () => {
      const element = createMockElement({});

      expect(numAttr(element as any, 'missing')).toBe(null);
    });
  });

  describe('number conversion', () => {
    it('should handle scientific notation', () => {
      const element = createMockElement({
        scientific: '1e5',
        scientific2: '2.5e-3',
      });

      expect(numAttr(element as any, 'scientific')).toBe(100000);
      expect(numAttr(element as any, 'scientific2')).toBe(0.0025);
    });

    it('should handle hexadecimal numbers', () => {
      const element = createMockElement({ hex: '0xFF' });

      expect(numAttr(element as any, 'hex')).toBe(255);
    });

    it('should convert non-numeric strings to NaN', () => {
      const element = createMockElement({
        text: 'not-a-number',
        mixed: '123abc',
        empty: '',
      });

      expect(numAttr(element as any, 'text')).toBeNaN();
      expect(numAttr(element as any, 'mixed')).toBeNaN();
      expect(numAttr(element as any, 'empty')).toBe(0); // Empty string converts to 0
    });
  });

  describe('fallback handling', () => {
    it('should handle different fallback types', () => {
      const element = createMockElement({});

      expect(numAttr(element as any, 'missing', 42)).toBe(42);
      expect(numAttr(element as any, 'missing', 0)).toBe(0);
      expect(numAttr(element as any, 'missing', -1)).toBe(-1);
      expect(numAttr(element as any, 'missing', 3.14)).toBe(3.14);
    });

    it('should handle non-numeric fallbacks', () => {
      const element = createMockElement({});

      expect(numAttr(element as any, 'missing', 'default' as any)).toBe('default');
      expect(numAttr(element as any, 'missing', undefined as any)).toBe(null);
    });
  });

  describe('edge cases', () => {
    it('should handle Infinity values', () => {
      const element = createMockElement({
        infinity: 'Infinity',
        negInfinity: '-Infinity',
      });

      expect(numAttr(element as any, 'infinity')).toBe(Infinity);
      expect(numAttr(element as any, 'negInfinity')).toBe(-Infinity);
    });

    it('should handle whitespace in numeric strings', () => {
      const element = createMockElement({
        whitespace: '  42  ',
        tabs: '\t123\t',
      });

      expect(numAttr(element as any, 'whitespace')).toBe(42);
      expect(numAttr(element as any, 'tabs')).toBe(123);
    });
  });
});

describe('boolAttr', () => {
  describe('basic functionality', () => {
    it('should convert numeric strings to booleans', () => {
      const element = createMockElement({
        true1: '1',
        true2: '42',
        true3: '-1',
        false1: '0',
        false2: '0.0',
      });

      expect(boolAttr(element as any, 'true1')).toBe(true);
      expect(boolAttr(element as any, 'true2')).toBe(true);
      expect(boolAttr(element as any, 'true3')).toBe(true);
      expect(boolAttr(element as any, 'false1')).toBe(false);
      expect(boolAttr(element as any, 'false2')).toBe(false);
    });

    it('should return fallback when attribute does not exist', () => {
      const element = createMockElement({});

      expect(boolAttr(element as any, 'missing', true)).toBe(true);
      expect(boolAttr(element as any, 'missing', false)).toBe(false);
    });

    it('should return null when attribute does not exist and no fallback provided', () => {
      const element = createMockElement({});

      expect(boolAttr(element as any, 'missing')).toBe(null);
    });
  });

  describe('boolean conversion', () => {
    it('should handle non-numeric strings', () => {
      const element = createMockElement({
        text: 'true',
        empty: '',
        spaces: '   ',
      });

      // Non-numeric strings convert to NaN, which is falsy when converted to boolean
      expect(boolAttr(element as any, 'text')).toBe(false);
      expect(boolAttr(element as any, 'empty')).toBe(false); // '' converts to 0, which is false
      expect(boolAttr(element as any, 'spaces')).toBe(false); // whitespace converts to 0
    });

    it('should handle decimal numbers', () => {
      const element = createMockElement({
        decimal1: '0.5',
        decimal2: '0.0',
        decimal3: '1.1',
      });

      expect(boolAttr(element as any, 'decimal1')).toBe(true); // 0.5 is truthy
      expect(boolAttr(element as any, 'decimal2')).toBe(false); // 0.0 is falsy
      expect(boolAttr(element as any, 'decimal3')).toBe(true); // 1.1 is truthy
    });

    it('should handle scientific notation', () => {
      const element = createMockElement({
        scientific1: '1e-10',
        scientific2: '0e5',
      });

      expect(boolAttr(element as any, 'scientific1')).toBe(true); // Very small positive number
      expect(boolAttr(element as any, 'scientific2')).toBe(false); // 0 in scientific notation
    });
  });

  describe('fallback handling', () => {
    it('should handle different fallback types', () => {
      const element = createMockElement({});

      expect(boolAttr(element as any, 'missing', true)).toBe(true);
      expect(boolAttr(element as any, 'missing', false)).toBe(false);
      expect(boolAttr(element as any, 'missing', 'default' as any)).toBe(false); // 'default' converts to NaN, which is falsy
      expect(boolAttr(element as any, 'missing', 0 as any)).toBe(false); // 0 converts to false
    });
  });

  describe('edge cases', () => {
    it('should handle special numeric values', () => {
      const element = createMockElement({
        infinity: 'Infinity',
        negInfinity: '-Infinity',
        nan: 'NaN',
      });

      expect(boolAttr(element as any, 'infinity')).toBe(true); // Infinity is truthy
      expect(boolAttr(element as any, 'negInfinity')).toBe(true); // -Infinity is truthy
      expect(boolAttr(element as any, 'nan')).toBe(false); // NaN is falsy
    });

    it('should handle negative zero', () => {
      const element = createMockElement({ negZero: '-0' });

      expect(boolAttr(element as any, 'negZero')).toBe(false); // -0 is falsy
    });
  });
});

describe('integration tests', () => {
  it('should work together on the same element', () => {
    const element = createMockElement({
      id: 'test-element',
      count: '5',
      enabled: '1',
      disabled: '0',
    });

    expect(attr(element as any, 'id')).toBe('test-element');
    expect(numAttr(element as any, 'count')).toBe(5);
    expect(boolAttr(element as any, 'enabled')).toBe(true);
    expect(boolAttr(element as any, 'disabled')).toBe(false);
  });

  it('should handle missing attributes consistently', () => {
    const element = createMockElement({});

    expect(attr(element as any, 'missing')).toBe(null);
    expect(numAttr(element as any, 'missing')).toBe(null);
    expect(boolAttr(element as any, 'missing')).toBe(null);
  });

  it('should call hasAttribute and getAttribute correctly', () => {
    const element = createMockElement({ test: 'value' });

    attr(element as any, 'test');
    expect(element.hasAttribute).toHaveBeenCalledWith('test');
    expect(element.getAttribute).toHaveBeenCalledWith('test');

    attr(element as any, 'missing');
    expect(element.hasAttribute).toHaveBeenCalledWith('missing');
    expect(element.getAttribute).not.toHaveBeenCalledWith('missing');
  });
});
