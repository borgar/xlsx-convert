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

  it('should return undefined for worksheetSource with ref but no sheet', () => {
    const xml = `<pivotCacheDefinition>
      <cacheSource type="worksheet">
        <worksheetSource ref="A1:C10"/>
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

  it('should parse worksheetSource with name and sheet but no ref', () => {
    const xml = `<pivotCacheDefinition>
      <cacheSource type="worksheet">
        <worksheetSource name="SalesTable" sheet="Sheet1"/>
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
    expect(cache.worksheetSource).toEqual({ name: 'SalesTable', sheet: 'Sheet1' });
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
    expect(cache.fields[0].sharedItems).toEqual([
      { t: 's', v: 'Alice' },
      { t: 's', v: 'Bob' },
    ]);
    expect(cache.fields[1].name).toBe('Amount');
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
      { t: 's', v: 'hello' },
      { t: 'n', v: 42 },
      { t: 'b', v: true },
      { t: 'd', v: '2024-01-15T00:00:00' },
      { t: 'e', v: '#REF!' },
      { t: 'z' },
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
      { t: 'b', v: false },
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
    // numFmtId is no longer stored (requires style table to resolve to format code string)
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

  it('should omit ref on rangeSet when ref attribute is absent', () => {
    const xml = `<pivotCacheDefinition>
      <cacheSource type="consolidation">
        <consolidation>
          <rangeSets count="1">
            <rangeSet sheet="Sheet1"/>
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
    expect(cache.consolidation.rangeSets).toEqual([ { sheet: 'Sheet1' } ]);
    // ref should be absent, not set to empty string
    expect(cache.consolidation.rangeSets[0]).not.toHaveProperty('ref');
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

  it('should fallback to empty string when cacheField name attribute is missing', () => {
    const xml = `<pivotCacheDefinition>
      <cacheSource type="worksheet">
        <worksheetSource ref="A1:B5" sheet="Data"/>
      </cacheSource>
      <cacheFields count="1">
        <cacheField/>
      </cacheFields>
    </pivotCacheDefinition>`;
    const cache = parse(xml)!;
    expect(cache.fields).toHaveLength(1);
    expect(cache.fields[0].name).toBe('');
  });

  it('should parse fieldGroup with rangePr', () => {
    const xml = `<pivotCacheDefinition>
      <cacheSource type="worksheet">
        <worksheetSource ref="A1:B5" sheet="Data"/>
      </cacheSource>
      <cacheFields count="1">
        <cacheField name="Date">
          <fieldGroup par="1" base="0">
            <rangePr autoStart="0" autoEnd="0" groupBy="months" startDate="2024-01-01T00:00:00" endDate="2024-12-31T00:00:00" groupInterval="2"/>
          </fieldGroup>
        </cacheField>
      </cacheFields>
    </pivotCacheDefinition>`;
    const cache = parse(xml)!;
    const fg = cache.fields[0].fieldGroup!;
    expect(fg).toBeDefined();
    expect(fg.par).toBe(1);
    expect(fg.base).toBe(0);
    expect(fg.rangePr).toEqual({
      autoStart: false,
      autoEnd: false,
      groupBy: 'months',
      startDate: '2024-01-01T00:00:00',
      endDate: '2024-12-31T00:00:00',
      groupInterval: 2,
    });
  });

  it('should parse fieldGroup with discretePr and groupItems', () => {
    const xml = `<pivotCacheDefinition>
      <cacheSource type="worksheet">
        <worksheetSource ref="A1:B5" sheet="Data"/>
      </cacheSource>
      <cacheFields count="1">
        <cacheField name="Category">
          <fieldGroup base="0">
            <discretePr count="3">
              <x v="0"/><x v="1"/><x v="0"/>
            </discretePr>
            <groupItems count="2">
              <s v="Group A"/><s v="Group B"/>
            </groupItems>
          </fieldGroup>
        </cacheField>
      </cacheFields>
    </pivotCacheDefinition>`;
    const cache = parse(xml)!;
    const fg = cache.fields[0].fieldGroup!;
    expect(fg).toBeDefined();
    expect(fg.base).toBe(0);
    expect(fg.discretePr).toEqual([ 0, 1, 0 ]);
    expect(fg.groupItems).toEqual([
      { t: 's', v: 'Group A' },
      { t: 's', v: 'Group B' },
    ]);
  });

  it('should parse fieldGroup rangePr with numeric range', () => {
    const xml = `<pivotCacheDefinition>
      <cacheSource type="worksheet">
        <worksheetSource ref="A1:B5" sheet="Data"/>
      </cacheSource>
      <cacheFields count="1">
        <cacheField name="Amount">
          <fieldGroup>
            <rangePr startNum="0" endNum="100"/>
          </fieldGroup>
        </cacheField>
      </cacheFields>
    </pivotCacheDefinition>`;
    const cache = parse(xml)!;
    const fg = cache.fields[0].fieldGroup!;
    expect(fg.rangePr).toEqual({ startNum: 0, endNum: 100 });
  });

  it('should omit rangePr groupBy when it is the default "range"', () => {
    const xml = `<pivotCacheDefinition>
      <cacheSource type="worksheet">
        <worksheetSource ref="A1:B5" sheet="Data"/>
      </cacheSource>
      <cacheFields count="1">
        <cacheField name="Amount">
          <fieldGroup>
            <rangePr groupBy="range" startNum="0" endNum="100"/>
          </fieldGroup>
        </cacheField>
      </cacheFields>
    </pivotCacheDefinition>`;
    const cache = parse(xml)!;
    const fg = cache.fields[0].fieldGroup!;
    expect(fg.rangePr!.groupBy).toBeUndefined();
  });

  it('should omit rangePr groupInterval when it is the default 1', () => {
    const xml = `<pivotCacheDefinition>
      <cacheSource type="worksheet">
        <worksheetSource ref="A1:B5" sheet="Data"/>
      </cacheSource>
      <cacheFields count="1">
        <cacheField name="Amount">
          <fieldGroup>
            <rangePr groupInterval="1" startNum="0" endNum="100"/>
          </fieldGroup>
        </cacheField>
      </cacheFields>
    </pivotCacheDefinition>`;
    const cache = parse(xml)!;
    const fg = cache.fields[0].fieldGroup!;
    expect(fg.rangePr!.groupInterval).toBeUndefined();
  });

  it('should omit fieldGroup for empty <fieldGroup/> element', () => {
    const xml = `<pivotCacheDefinition>
      <cacheSource type="worksheet">
        <worksheetSource ref="A1:B5" sheet="Data"/>
      </cacheSource>
      <cacheFields count="1">
        <cacheField name="Col">
          <fieldGroup/>
        </cacheField>
      </cacheFields>
    </pivotCacheDefinition>`;
    const cache = parse(xml)!;
    expect(cache.fields[0]).not.toHaveProperty('fieldGroup');
  });

  it('should parse all sharedItemsMeta attributes', () => {
    const xml = `<pivotCacheDefinition>
      <cacheSource type="worksheet">
        <worksheetSource ref="A1:A10" sheet="Data"/>
      </cacheSource>
      <cacheFields count="1">
        <cacheField name="Mixed">
          <sharedItems containsBlank="1" containsMixedTypes="1" containsSemiMixedTypes="0" containsString="0" containsNumber="1" containsInteger="0" containsDate="1" containsNonDate="0" minValue="1.5" maxValue="99.9" minDate="2024-01-01T00:00:00" maxDate="2024-12-31T00:00:00">
            <n v="42"/>
          </sharedItems>
        </cacheField>
      </cacheFields>
    </pivotCacheDefinition>`;
    const cache = parse(xml)!;
    expect(cache.fields[0].sharedItemsMeta).toEqual({
      containsBlank: true,
      containsMixedTypes: true,
      containsSemiMixedTypes: false,
      containsString: false,
      containsNumber: true,
      containsInteger: false,
      containsDate: true,
      containsNonDate: false,
      minValue: 1.5,
      maxValue: 99.9,
      minDate: '2024-01-01T00:00:00',
      maxDate: '2024-12-31T00:00:00',
    });
  });

  it('should omit sharedItemsMeta when no metadata attributes are present', () => {
    const xml = `<pivotCacheDefinition>
      <cacheSource type="worksheet">
        <worksheetSource ref="A1:A5" sheet="Data"/>
      </cacheSource>
      <cacheFields count="1">
        <cacheField name="Col">
          <sharedItems><s v="a"/></sharedItems>
        </cacheField>
      </cacheFields>
    </pivotCacheDefinition>`;
    const cache = parse(xml)!;
    expect(cache.fields[0].sharedItems).toHaveLength(1);
    expect(cache.fields[0].sharedItemsMeta).toBeUndefined();
  });

  it('should parse all cache metadata attributes', () => {
    const xml = `<pivotCacheDefinition
      refreshedBy="User" refreshedDate="45000.5" refreshedDateIso="2023-03-15T12:00:00"
      recordCount="100" createdVersion="8" refreshedVersion="7" minRefreshableVersion="3"
      saveData="0" refreshOnLoad="1" enableRefresh="0" upgradeOnRefresh="1" xr:uid="{ABC-123}">
      <cacheSource type="worksheet">
        <worksheetSource ref="A1:B5" sheet="Data"/>
      </cacheSource>
      <cacheFields count="0"/>
    </pivotCacheDefinition>`;
    const cache = parse(xml)!;
    expect(cache.refreshedBy).toBe('User');
    expect(cache.refreshedDate).toBe(45000.5);
    expect(cache.refreshOnLoad).toBe(true);
    expect(cache.enableRefresh).toBe(false);
    expect(cache.upgradeOnRefresh).toBe(true);
  });

  it('should omit cache metadata attributes when absent', () => {
    const xml = `<pivotCacheDefinition>
      <cacheSource type="worksheet">
        <worksheetSource ref="A1:B5" sheet="Data"/>
      </cacheSource>
      <cacheFields count="0"/>
    </pivotCacheDefinition>`;
    const cache = parse(xml)!;
    expect(cache.refreshedBy).toBeUndefined();
    expect(cache.refreshedDate).toBeUndefined();
    expect(cache.refreshOnLoad).toBeUndefined();
    expect(cache.enableRefresh).toBeUndefined();
    expect(cache.upgradeOnRefresh).toBeUndefined();
  });

  // Extensions are no longer part of the PivotCache type; extLst is parsed but not stored.

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
