import { describe, it, expect } from 'vitest';
import { parseCacheSharedItem } from './parseCacheSharedItem.ts';
import { parseXML } from '@borgar/simple-xml';

function parse (xml: string) {
  const doc = parseXML(`<root>${xml}</root>`);
  const root = doc.getElementsByTagName('root')[0];
  return parseCacheSharedItem(root.getElementsByTagName('*')[0]);
}

describe('parseCacheSharedItem', () => {
  it('parses string item', () => {
    expect(parse('<s v="hello"/>')).toEqual({ t: 's', v: 'hello' });
  });

  it('parses numeric item', () => {
    expect(parse('<n v="42"/>')).toEqual({ t: 'n', v: 42 });
  });

  it('parses boolean item', () => {
    expect(parse('<b v="1"/>')).toEqual({ t: 'b', v: true });
  });

  it('parses date item', () => {
    expect(parse('<d v="2024-01-15T00:00:00"/>')).toEqual({ t: 'd', v: '2024-01-15T00:00:00' });
  });

  it('parses error item', () => {
    expect(parse('<e v="#REF!"/>')).toEqual({ t: 'e', v: '#REF!' });
  });

  it('parses nil item', () => {
    expect(parse('<m/>')).toEqual({ t: 'z' });
  });

  it('preserves u="1" (unused marker) on string item', () => {
    expect(parse('<s v="old" u="1"/>')).toEqual({ t: 's', v: 'old', u: true });
  });

  it('preserves u="1" on numeric item', () => {
    expect(parse('<n v="99" u="1"/>')).toEqual({ t: 'n', v: 99, u: true });
  });

  it('does not set u for u="0"', () => {
    const result = parse('<s v="hello" u="0"/>');
    expect(result).toEqual({ t: 's', v: 'hello' });
    expect(result).not.toHaveProperty('u');
  });

  it('preserves u="1" on nil item', () => {
    expect(parse('<m u="1"/>')).toEqual({ t: 'z', u: true });
  });

  it('does not set u on nil items without u attribute', () => {
    const result = parse('<m/>');
    expect(result).toEqual({ t: 'z' });
    expect(result).not.toHaveProperty('u');
  });

  it('returns undefined for unrecognized tag', () => {
    expect(parse('<unknown v="1"/>')).toBeUndefined();
  });
});
