import { describe, it, expect } from 'vitest';
import { handlerPivotCacheDefinition } from './pivotCacheDefinition.ts';
import { parseXML } from '@borgar/simple-xml';

function parse (xml: string) {
  return handlerPivotCacheDefinition(parseXML(xml));
}

describe('handlerPivotCacheDefinition', () => {
  it('should return undefined for missing pivotCacheDefinition', () => {
    expect(parse('<root/>')).toBeUndefined();
  });

  it('should return undefined for unsupported source type', () => {
    const xml = `<pivotCacheDefinition>
      <cacheSource type="unknown"/>
    </pivotCacheDefinition>`;
    expect(parse(xml)).toBeUndefined();
  });

  it('should return undefined for missing type attribute', () => {
    const xml = `<pivotCacheDefinition>
      <cacheSource/>
    </pivotCacheDefinition>`;
    expect(parse(xml)).toBeUndefined();
  });

  it('should return undefined for worksheetSource with no ref/sheet/name', () => {
    const xml = `<pivotCacheDefinition>
      <cacheSource type="worksheet">
        <worksheetSource/>
      </cacheSource>
    </pivotCacheDefinition>`;
    expect(parse(xml)).toBeUndefined();
  });

  it('should parse worksheetSource with name attribute (named range/table)', () => {
    const xml = `<pivotCacheDefinition>
      <cacheSource type="worksheet">
        <worksheetSource name="SalesTable"/>
      </cacheSource>
      <cacheFields count="1">
        <cacheField name="Amount"/>
      </cacheFields>
    </pivotCacheDefinition>`;
    const cache = parse(xml)!;
    expect(cache).toBeDefined();
    expect(cache.sourceType).toBe('worksheet');
    if (cache.sourceType !== 'worksheet') {
      throw new Error('expected worksheet');
    }
    expect(cache.worksheetSource).toEqual({ name: 'SalesTable' });
    expect(cache.fields).toHaveLength(1);
  });

  it('should parse worksheetSource with both name and ref/sheet', () => {
    const xml = `<pivotCacheDefinition>
      <cacheSource type="worksheet">
        <worksheetSource name="SalesTable" ref="A1:C10" sheet="Sheet1"/>
      </cacheSource>
      <cacheFields count="1">
        <cacheField name="Amount"/>
      </cacheFields>
    </pivotCacheDefinition>`;
    const cache = parse(xml)!;
    expect(cache).toBeDefined();
    expect(cache.sourceType).toBe('worksheet');
    if (cache.sourceType !== 'worksheet') {
      throw new Error('expected worksheet');
    }
    expect(cache.worksheetSource).toEqual({ name: 'SalesTable', ref: 'A1:C10', sheet: 'Sheet1' });
  });

  it('should parse a basic cache with worksheet source and fields', () => {
    const xml = `<pivotCacheDefinition>
      <cacheSource type="worksheet">
        <worksheetSource ref="A1:C10" sheet="Sheet1"/>
      </cacheSource>
      <cacheFields count="2">
        <cacheField name="Name" numFmtId="0">
          <sharedItems count="2"><s v="Alice"/><s v="Bob"/></sharedItems>
        </cacheField>
        <cacheField name="Amount" numFmtId="4">
          <sharedItems/>
        </cacheField>
      </cacheFields>
    </pivotCacheDefinition>`;
    const cache = parse(xml)!;
    expect(cache.sourceType).toBe('worksheet');
    if (cache.sourceType !== 'worksheet') {
      throw new Error('expected worksheet');
    }
    expect(cache.worksheetSource).toEqual({ ref: 'A1:C10', sheet: 'Sheet1' });
    expect(cache.fields).toHaveLength(2);
    expect(cache.fields[0].name).toBe('Name');
    expect(cache.fields[0].numFmtId).toBe(0);
    expect(cache.fields[0].sharedItems).toEqual([
      { type: 'string', value: 'Alice' },
      { type: 'string', value: 'Bob' },
    ]);
    expect(cache.fields[1].name).toBe('Amount');
    expect(cache.fields[1].numFmtId).toBe(4);
    expect(cache.fields[1].sharedItems).toBeUndefined();
  });

  it('should parse shared items of each type', () => {
    const xml = `<pivotCacheDefinition>
      <cacheSource type="worksheet">
        <worksheetSource ref="A1:A10" sheet="Data"/>
      </cacheSource>
      <cacheFields count="1">
        <cacheField name="Mixed">
          <sharedItems count="6">
            <s v="hello"/>
            <n v="42"/>
            <b v="1"/>
            <d v="2024-01-15T00:00:00"/>
            <e v="#REF!"/>
            <m/>
          </sharedItems>
        </cacheField>
      </cacheFields>
    </pivotCacheDefinition>`;
    const cache = parse(xml)!;
    expect(cache.fields[0].sharedItems).toEqual([
      { type: 'string', value: 'hello' },
      { type: 'number', value: 42 },
      { type: 'boolean', value: true },
      { type: 'date', value: '2024-01-15T00:00:00' },
      { type: 'error', value: '#REF!' },
      { type: 'missing' },
    ]);
  });

  it('should parse boolean false value', () => {
    const xml = `<pivotCacheDefinition>
      <cacheSource type="worksheet">
        <worksheetSource ref="A1:A2" sheet="Data"/>
      </cacheSource>
      <cacheFields count="1">
        <cacheField name="Flag">
          <sharedItems count="1"><b v="0"/></sharedItems>
        </cacheField>
      </cacheFields>
    </pivotCacheDefinition>`;
    const cache = parse(xml)!;
    expect(cache.fields[0].sharedItems).toEqual([
      { type: 'boolean', value: false },
    ]);
  });

  it('should parse numFmtId and formula attributes', () => {
    const xml = `<pivotCacheDefinition>
      <cacheSource type="worksheet">
        <worksheetSource ref="A1:B5" sheet="Data"/>
      </cacheSource>
      <cacheFields count="1">
        <cacheField name="Calc" numFmtId="164" formula="Amount * Rate">
          <sharedItems/>
        </cacheField>
      </cacheFields>
    </pivotCacheDefinition>`;
    const cache = parse(xml)!;
    expect(cache.fields[0].numFmtId).toBe(164);
    expect(cache.fields[0].formula).toBe('Amount * Rate');
  });

  it('should handle empty sharedItems element', () => {
    const xml = `<pivotCacheDefinition>
      <cacheSource type="worksheet">
        <worksheetSource ref="A1:A5" sheet="Data"/>
      </cacheSource>
      <cacheFields count="1">
        <cacheField name="Col">
          <sharedItems/>
        </cacheField>
      </cacheFields>
    </pivotCacheDefinition>`;
    const cache = parse(xml)!;
    expect(cache.fields[0].sharedItems).toBeUndefined();
  });

  it('should parse external source with connectionId', () => {
    const xml = `<pivotCacheDefinition>
      <cacheSource type="external" connectionId="1"/>
      <cacheFields count="1">
        <cacheField name="Col"/>
      </cacheFields>
    </pivotCacheDefinition>`;
    const cache = parse(xml)!;
    expect(cache.sourceType).toBe('external');
    expect(cache).toHaveProperty('connectionId', 1);
    expect(cache.fields).toHaveLength(1);
  });

  it('should return undefined for external source without connectionId', () => {
    const xml = `<pivotCacheDefinition>
      <cacheSource type="external"/>
    </pivotCacheDefinition>`;
    expect(parse(xml)).toBeUndefined();
  });

  it('should parse consolidation source with pages and rangeSets', () => {
    const xml = `<pivotCacheDefinition>
      <cacheSource type="consolidation">
        <consolidation autoPage="0">
          <pages count="1">
            <page count="2">
              <pageItem name="East"/>
              <pageItem name="West"/>
            </page>
          </pages>
          <rangeSets count="2">
            <rangeSet ref="A1:C10" sheet="East" i1="0"/>
            <rangeSet ref="A1:C10" sheet="West" i1="1"/>
          </rangeSets>
        </consolidation>
      </cacheSource>
      <cacheFields count="1">
        <cacheField name="Value"/>
      </cacheFields>
    </pivotCacheDefinition>`;
    const cache = parse(xml)!;
    expect(cache.sourceType).toBe('consolidation');
    if (cache.sourceType !== 'consolidation') {
      throw new Error('expected consolidation');
    }
    expect(cache.consolidation.autoPage).toBe(false);
    expect(cache.consolidation.pages).toEqual([ [ 'East', 'West' ] ]);
    expect(cache.consolidation.rangeSets).toEqual([
      { ref: 'A1:C10', sheet: 'East', i1: 0 },
      { ref: 'A1:C10', sheet: 'West', i1: 1 },
    ]);
    expect(cache.fields).toHaveLength(1);
  });

  it('should parse consolidation source without pages', () => {
    const xml = `<pivotCacheDefinition>
      <cacheSource type="consolidation">
        <consolidation>
          <rangeSets count="1">
            <rangeSet ref="A1:B5" sheet="Sheet1"/>
          </rangeSets>
        </consolidation>
      </cacheSource>
      <cacheFields count="0"/>
    </pivotCacheDefinition>`;
    const cache = parse(xml)!;
    expect(cache.sourceType).toBe('consolidation');
    if (cache.sourceType !== 'consolidation') {
      throw new Error('expected consolidation');
    }
    expect(cache.consolidation.autoPage).toBeUndefined();
    expect(cache.consolidation.pages).toBeUndefined();
    expect(cache.consolidation.rangeSets).toEqual([ { ref: 'A1:B5', sheet: 'Sheet1' } ]);
  });

  it('should return undefined for consolidation source without consolidation element', () => {
    const xml = `<pivotCacheDefinition>
      <cacheSource type="consolidation"/>
      <cacheFields count="1">
        <cacheField name="Value"/>
      </cacheFields>
    </pivotCacheDefinition>`;
    expect(parse(xml)).toBeUndefined();
  });

  it('should parse scenario source', () => {
    const xml = `<pivotCacheDefinition>
      <cacheSource type="scenario"/>
      <cacheFields count="1">
        <cacheField name="Scenario"/>
      </cacheFields>
    </pivotCacheDefinition>`;
    const cache = parse(xml)!;
    expect(cache.sourceType).toBe('scenario');
    expect(cache.fields).toHaveLength(1);
    expect(cache.fields[0].name).toBe('Scenario');
  });
});
