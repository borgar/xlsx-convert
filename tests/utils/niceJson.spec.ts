import { describe, expect, test } from 'vitest';
import { niceJson } from './niceJson.ts';

describe('niceJson', () => {
  describe('primitives', () => {
    test('strings are quoted', () => {
      expect(niceJson('hello')).toBe('"hello"');
    });

    test('strings escape special characters', () => {
      expect(niceJson('a "b" c')).toBe('"a \\"b\\" c"');
      expect(niceJson('line\nbreak')).toBe('"line\\nbreak"');
    });

    test('numbers are stringified', () => {
      expect(niceJson(42)).toBe('42');
      expect(niceJson(-1.5)).toBe('-1.5');
      expect(niceJson(0)).toBe('0');
    });

    test('booleans are stringified', () => {
      expect(niceJson(true)).toBe('true');
      expect(niceJson(false)).toBe('false');
    });

    test('null is stringified', () => {
      expect(niceJson(null)).toBe('null');
    });
  });

  describe('arrays', () => {
    test('empty array', () => {
      expect(niceJson([])).toBe('[]');
    });

    test('short flat array collapses to one line', () => {
      expect(niceJson([ 1, 2, 3 ])).toBe('[ 1, 2, 3 ]');
    });

    test('single-element array with object collapses if short', () => {
      expect(niceJson([ { a: 1 } ])).toBe('[ { "a": 1 } ]');
    });

    test('multi-element array of objects expands', () => {
      expect(niceJson([ { a: 1 }, { b: 2 } ])).toBe(
        '[\n  { "a": 1 },\n  { "b": 2 }\n]',
      );
    });

    test('long flat array expands', () => {
      const arr = [ 'aaaaaaaaaa', 'bbbbbbbbbb', 'cccccccccc', 'dddddddddd' ];
      expect(niceJson(arr)).toBe(
        '[\n  "aaaaaaaaaa",\n  "bbbbbbbbbb",\n  "cccccccccc",\n  "dddddddddd"\n]',
      );
    });

    test.only('correctly deals with sparse arrays', () => {
      // eslint-disable-next-line no-sparse-arrays
      expect(niceJson([ 1, , 1, 1, , ])).toBe(
        '[ 1, null, 1, 1, null ]',
      );
    });
  });

  describe('objects', () => {
    test('empty object', () => {
      expect(niceJson({})).toBe('{}');
    });

    test('short flat object collapses to one line', () => {
      expect(niceJson({ a: 1, b: 2 })).toBe('{ "a": 1, "b": 2 }');
    });

    test('object with nested object expands', () => {
      expect(niceJson({ a: { b: 1 } })).toBe('{\n  "a": { "b": 1 }\n}');
    });

    test('undefined property values are omitted', () => {
      expect(niceJson({ a: 1, b: undefined, c: null })).toBe(
        '{\n  "a": 1,\n  "c": null\n}',
      );
    });

    test('long flat object expands', () => {
      const obj = {
        longKeyOne: 'longValueOne',
        longKeyTwo: 'longValueTwo',
        longKeyThree: 'longValueThree',
      };
      expect(niceJson(obj)).toBe(
        '{\n  "longKeyOne": "longValueOne",\n  "longKeyTwo": "longValueTwo",\n  "longKeyThree": "longValueThree"\n}',
      );
    });
  });

  describe('nesting and indentation', () => {
    test('nested structure uses 2-space indentation per level', () => {
      const input = { outer: { inner: [ 'aaaaaaaaaaaaaaaaaaaa', 'bbbbbbbbbbbbbbbbbbbb', 'cccccccccccccccccccc' ] } };
      expect(niceJson(input)).toBe(
        '{\n  "outer": {\n    "inner": [\n      "aaaaaaaaaaaaaaaaaaaa",\n      "bbbbbbbbbbbbbbbbbbbb",\n      "cccccccccccccccccccc"\n    ]\n  }\n}',
      );
    });
  });

  describe('colorize', () => {
    test('colorize=false produces no ANSI escapes', () => {
      const out = niceJson({ a: 1, b: 'x' }, false);
      // eslint-disable-next-line no-control-regex
      expect(out).not.toMatch(/\x1B\[/);
    });

    test('colorize=true wraps output in ANSI escapes', () => {
      const out = niceJson({ a: 1, b: 'x' }, true);
      // eslint-disable-next-line no-control-regex
      expect(out).toMatch(/\x1B\[\d+m/);
    });

    test('stripping ANSI escapes from colored output matches uncolored output', () => {
      const colored = niceJson({ a: 1, b: [ 2, 3 ] }, true);
      const plain = niceJson({ a: 1, b: [ 2, 3 ] }, false);
      // eslint-disable-next-line no-control-regex
      expect(colored.replace(/\x1B\[\d+m/g, '')).toBe(plain);
    });
  });
});
