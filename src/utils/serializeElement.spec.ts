import { describe, it, expect } from 'vitest';
import { serializeElement } from './serializeElement.ts';
import { parseXML } from '@borgar/simple-xml';

function serialize (xml: string): string {
  const doc = parseXML(xml);
  return serializeElement(doc.children[0]);
}

describe('serializeElement', () => {
  it('should serialize a self-closing element', () => {
    expect(serialize('<foo/>')).toBe('<foo/>');
  });

  it('should serialize an element with attributes', () => {
    expect(serialize('<foo bar="1" baz="2"/>')).toBe('<foo bar="1" baz="2"/>');
  });

  it('should escape special characters in attribute values', () => {
    expect(serialize('<foo val="a&lt;b"/>')).toBe('<foo val="a&lt;b"/>');
  });

  it('should serialize text content', () => {
    expect(serialize('<foo>hello</foo>')).toBe('<foo>hello</foo>');
  });

  it('should escape special characters in text content', () => {
    expect(serialize('<foo>a&amp;b&lt;c</foo>')).toBe('<foo>a&amp;b&lt;c</foo>');
  });

  it('should serialize nested child elements', () => {
    expect(serialize('<a><b><c/></b></a>')).toBe('<a><b><c/></b></a>');
  });

  it('should preserve namespace prefixes via fullName', () => {
    const xml = '<x14:pivotCacheDefinition xmlns:x14="http://example.com"/>';
    const result = serialize(xml);
    expect(result).toContain('x14:pivotCacheDefinition');
    expect(result).toContain('xmlns:x14=');
  });

  it('should serialize attributes and children together', () => {
    const xml = '<ext uri="{ABC}"><child val="1"/></ext>';
    expect(serialize(xml)).toBe('<ext uri="{ABC}"><child val="1"/></ext>');
  });

  it('should handle element with both text and children (text before children)', () => {
    // Mixed content: text is collected before child elements
    const xml = '<a>text<b/></a>';
    const result = serialize(xml);
    expect(result).toBe('<a>text<b/></a>');
  });
});
