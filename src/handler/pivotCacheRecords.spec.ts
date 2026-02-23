import { describe, it, expect } from 'vitest';
import { handlerPivotCacheRecords } from './pivotCacheRecords.ts';
import { parseXML } from '@borgar/simple-xml';

function parse (xml: string) {
  return handlerPivotCacheRecords(parseXML(xml));
}

describe('handlerPivotCacheRecords', () => {
  it('should return empty array for missing root element', () => {
    expect(parse('<root/>')).toEqual([]);
  });

  it('should return empty array for empty records element', () => {
    expect(parse('<pivotCacheRecords count="0"/>')).toEqual([]);
  });

  it('should parse shared item index values', () => {
    const xml = `<pivotCacheRecords count="1">
      <r><x v="3"/><x v="0"/></r>
    </pivotCacheRecords>`;
    const records = parse(xml);
    expect(records).toEqual([ [ { x: 3 }, { x: 0 } ] ]);
  });

  it('should default x value to 0 when v attribute is absent', () => {
    const xml = `<pivotCacheRecords count="1">
      <r><x/></r>
    </pivotCacheRecords>`;
    const records = parse(xml);
    expect(records).toEqual([ [ { x: 0 } ] ]);
  });

  it('should parse inline number values', () => {
    const xml = `<pivotCacheRecords count="1">
      <r><n v="42.5"/><n v="-7"/></r>
    </pivotCacheRecords>`;
    const records = parse(xml);
    expect(records).toEqual([ [ 42.5, -7 ] ]);
  });

  it('should parse inline string values', () => {
    const xml = `<pivotCacheRecords count="1">
      <r><s v="hello"/><s v="world"/></r>
    </pivotCacheRecords>`;
    const records = parse(xml);
    expect(records).toEqual([ [ 'hello', 'world' ] ]);
  });

  it('should parse boolean values', () => {
    const xml = `<pivotCacheRecords count="1">
      <r><b v="1"/><b v="0"/></r>
    </pivotCacheRecords>`;
    const records = parse(xml);
    expect(records).toEqual([ [ true, false ] ]);
  });

  it('should parse date values', () => {
    const xml = `<pivotCacheRecords count="1">
      <r><d v="2024-01-15T00:00:00"/></r>
    </pivotCacheRecords>`;
    const records = parse(xml);
    expect(records).toEqual([ [ { d: '2024-01-15T00:00:00' } ] ]);
  });

  it('should parse error values', () => {
    const xml = `<pivotCacheRecords count="1">
      <r><e v="#REF!"/></r>
    </pivotCacheRecords>`;
    const records = parse(xml);
    expect(records).toEqual([ [ { e: '#REF!' } ] ]);
  });

  it('should parse missing values as null', () => {
    const xml = `<pivotCacheRecords count="1">
      <r><m/></r>
    </pivotCacheRecords>`;
    const records = parse(xml);
    expect(records).toEqual([ [ null ] ]);
  });

  it('should parse multiple records with mixed value types', () => {
    const xml = `<pivotCacheRecords count="3">
      <r><x v="0"/><n v="100"/><s v="note"/></r>
      <r><x v="1"/><n v="200"/><m/></r>
      <r><x v="2"/><b v="1"/><d v="2024-06-01T00:00:00"/></r>
    </pivotCacheRecords>`;
    const records = parse(xml);
    expect(records).toHaveLength(3);
    expect(records[0]).toEqual([ { x: 0 }, 100, 'note' ]);
    expect(records[1]).toEqual([ { x: 1 }, 200, null ]);
    expect(records[2]).toEqual([ { x: 2 }, true, { d: '2024-06-01T00:00:00' } ]);
  });
});
