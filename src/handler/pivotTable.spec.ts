import { describe, it, expect } from 'vitest';
import { handlerPivotTable } from './pivotTable.ts';
import { parseXML } from '@borgar/simple-xml';

function parse (xml: string) {
  return handlerPivotTable(parseXML(xml));
}

const MINIMAL_PT = `<?xml version="1.0" encoding="UTF-8"?>
<pivotTableDefinition name="PivotTable1" cacheId="0">
  <location ref="A3:D20" firstHeaderRow="1" firstDataRow="2" firstDataCol="1"/>
  <pivotFields count="2">
    <pivotField axis="axisRow" showAll="1"/>
    <pivotField dataField="1" showAll="0"/>
  </pivotFields>
  <rowFields count="1"><field x="0"/></rowFields>
  <colFields count="1"><field x="-2"/></colFields>
  <dataFields count="1">
    <dataField name="Sum of Amount" fld="1"/>
  </dataFields>
</pivotTableDefinition>`;

describe('handlerPivotTable', () => {
  it('should return undefined for missing pivotTableDefinition', () => {
    expect(parse('<root/>')).toBeUndefined();
  });

  it('should return undefined for missing name', () => {
    expect(parse('<pivotTableDefinition><location ref="A1" firstHeaderRow="1" firstDataRow="1" firstDataCol="0"/></pivotTableDefinition>')).toBeUndefined();
  });

  it('should return undefined for missing location', () => {
    expect(parse('<pivotTableDefinition name="PT1"></pivotTableDefinition>')).toBeUndefined();
  });

  it('should parse a basic pivot table', () => {
    const pt = parse(MINIMAL_PT);
    expect(pt).toBeDefined();
    expect(pt!.name).toBe('PivotTable1');
    expect(pt!.ref).toBe('A3:D20');
    expect(pt!.location).toEqual({ firstHeaderRow: 1, firstDataRow: 2, firstDataCol: 1 });
    expect(pt!.fields).toHaveLength(2);
    expect(pt!.rowFieldIndices).toEqual([0]);
    expect(pt!.colFieldIndices).toEqual([-2]);
    expect(pt!.dataFields).toHaveLength(1);
    expect(pt!.dataFields[0]).toEqual({ name: 'Sum of Amount', fieldIndex: 1 });
  });

  it('should parse field axis values', () => {
    const xml = `<pivotTableDefinition name="PT1" cacheId="0">
      <location ref="A1" firstHeaderRow="1" firstDataRow="1" firstDataCol="0"/>
      <pivotFields count="4">
        <pivotField axis="axisRow" showAll="1"/>
        <pivotField axis="axisCol" showAll="1"/>
        <pivotField axis="axisPage" showAll="1"/>
        <pivotField dataField="1" showAll="1"/>
      </pivotFields>
      <rowFields count="0"/><colFields count="0"/>
      <dataFields count="1"><dataField name="Val" fld="3"/></dataFields>
    </pivotTableDefinition>`;
    const pt = parse(xml)!;
    expect(pt.fields[0].axis).toBe('row');
    expect(pt.fields[1].axis).toBe('col');
    expect(pt.fields[2].axis).toBe('page');
    expect(pt.fields[3].axis).toBe('values');
  });

  it('should parse showAll=false', () => {
    const pt = parse(MINIMAL_PT)!;
    expect(pt.fields[0].showAll).toBeUndefined();
    expect(pt.fields[1].showAll).toBe(false);
  });

  it('should parse subtotalFunctions', () => {
    const xml = `<pivotTableDefinition name="PT1" cacheId="0">
      <location ref="A1" firstHeaderRow="1" firstDataRow="1" firstDataCol="0"/>
      <pivotFields count="1">
        <pivotField axis="axisRow" showAll="1" sumSubtotal="1" countASubtotal="1"/>
      </pivotFields>
      <rowFields count="1"><field x="0"/></rowFields>
      <colFields count="0"/>
      <dataFields count="0"/>
    </pivotTableDefinition>`;
    const pt = parse(xml)!;
    expect(pt.fields[0].subtotalFunctions).toEqual(['sum', 'countA']);
  });

  it('should parse stdDevSubtotal and stdDevPSubtotal (camelCase per OOXML)', () => {
    const xml = `<pivotTableDefinition name="PT1" cacheId="0">
      <location ref="A1" firstHeaderRow="1" firstDataRow="1" firstDataCol="0"/>
      <pivotFields count="1">
        <pivotField axis="axisRow" showAll="1" stdDevSubtotal="1" stdDevPSubtotal="1"/>
      </pivotFields>
      <rowFields count="1"><field x="0"/></rowFields>
      <colFields count="0"/>
      <dataFields count="0"/>
    </pivotTableDefinition>`;
    const pt = parse(xml)!;
    expect(pt.fields[0].subtotalFunctions).toEqual(['stdDev', 'stdDevP']);
  });

  it('should parse sortType', () => {
    const xml = `<pivotTableDefinition name="PT1" cacheId="0">
      <location ref="A1" firstHeaderRow="1" firstDataRow="1" firstDataCol="0"/>
      <pivotFields count="1">
        <pivotField axis="axisRow" showAll="1" sortType="descending"/>
      </pivotFields>
      <rowFields count="1"><field x="0"/></rowFields>
      <colFields count="0"/>
      <dataFields count="0"/>
    </pivotTableDefinition>`;
    const pt = parse(xml)!;
    expect(pt.fields[0].sortType).toBe('descending');
  });

  it('should parse field items with itemType, hidden, and itemIndex', () => {
    const xml = `<pivotTableDefinition name="PT1" cacheId="0">
      <location ref="A1" firstHeaderRow="1" firstDataRow="1" firstDataCol="0"/>
      <pivotFields count="1">
        <pivotField axis="axisRow" showAll="1">
          <items count="3">
            <item x="0"/>
            <item x="1" h="1"/>
            <item t="default"/>
          </items>
        </pivotField>
      </pivotFields>
      <rowFields count="1"><field x="0"/></rowFields>
      <colFields count="0"/>
      <dataFields count="0"/>
    </pivotTableDefinition>`;
    const pt = parse(xml)!;
    expect(pt.fields[0].items).toEqual([
      { itemIndex: 0 },
      { itemIndex: 1, hidden: true },
      { itemType: 'default' },
    ]);
  });

  it('should parse data fields with subtotal, showDataAs, baseField/baseItem', () => {
    const xml = `<pivotTableDefinition name="PT1" cacheId="0">
      <location ref="A1" firstHeaderRow="1" firstDataRow="1" firstDataCol="0"/>
      <pivotFields count="1"><pivotField dataField="1" showAll="1"/></pivotFields>
      <rowFields count="0"/><colFields count="0"/>
      <dataFields count="1">
        <dataField name="% of Total" fld="0" subtotal="sum" showDataAs="percentOfTotal" baseField="0" baseItem="0" numFmtId="10"/>
      </dataFields>
    </pivotTableDefinition>`;
    const pt = parse(xml)!;
    expect(pt.dataFields[0]).toEqual({
      name: '% of Total',
      fieldIndex: 0,
      subtotal: 'sum',
      showDataAs: 'percentOfTotal',
      baseField: 0,
      baseItem: 0,
      numFmtId: 10,
    });
  });

  it('should parse page fields with selectedItem', () => {
    const xml = `<pivotTableDefinition name="PT1" cacheId="0">
      <location ref="A1" firstHeaderRow="1" firstDataRow="1" firstDataCol="0"/>
      <pivotFields count="1"><pivotField axis="axisPage" showAll="1"/></pivotFields>
      <rowFields count="0"/><colFields count="0"/>
      <dataFields count="0"/>
      <pageFields count="1">
        <pageField fld="0" item="2" name="Region"/>
      </pageFields>
    </pivotTableDefinition>`;
    const pt = parse(xml)!;
    expect(pt.pageFields).toEqual([{ fieldIndex: 0, selectedItem: 2, name: 'Region' }]);
  });

  it('should parse style info', () => {
    const xml = `<pivotTableDefinition name="PT1" cacheId="0">
      <location ref="A1" firstHeaderRow="1" firstDataRow="1" firstDataCol="0"/>
      <pivotFields count="0"/>
      <rowFields count="0"/><colFields count="0"/>
      <dataFields count="0"/>
      <pivotTableStyleInfo name="PivotStyleLight16" showRowHeaders="1" showColHeaders="1" showRowStripes="0" showColStripes="0"/>
    </pivotTableDefinition>`;
    const pt = parse(xml)!;
    expect(pt.style).toEqual({
      name: 'PivotStyleLight16',
      showRowHeaders: true,
      showColHeaders: true,
      showRowStripes: false,
      showColStripes: false,
    });
  });

  it('should parse grand total flags', () => {
    const xml = `<pivotTableDefinition name="PT1" cacheId="0" rowGrandTotals="0" colGrandTotals="0">
      <location ref="A1" firstHeaderRow="1" firstDataRow="1" firstDataCol="0"/>
      <pivotFields count="0"/>
      <rowFields count="0"/><colFields count="0"/>
      <dataFields count="0"/>
    </pivotTableDefinition>`;
    const pt = parse(xml)!;
    expect(pt.rowGrandTotals).toBe(false);
    expect(pt.colGrandTotals).toBe(false);
  });

  it('should parse autoRefresh attribute', () => {
    const xml = `<pivotTableDefinition name="PT1" cacheId="0" autoRefresh="1">
      <location ref="A1" firstHeaderRow="1" firstDataRow="1" firstDataCol="0"/>
      <pivotFields count="0"/>
      <rowFields count="0"/><colFields count="0"/>
      <dataFields count="0"/>
    </pivotTableDefinition>`;
    const pt = parse(xml)!;
    expect(pt.autoRefresh).toBe(true);
  });

  it('should not set autoRefresh when absent', () => {
    const pt = parse(MINIMAL_PT)!;
    expect(pt.autoRefresh).toBeUndefined();
  });

  it('should parse row and column items', () => {
    const xml = `<pivotTableDefinition name="PT1" cacheId="0">
      <location ref="A1" firstHeaderRow="1" firstDataRow="1" firstDataCol="0"/>
      <pivotFields count="0"/>
      <rowFields count="0"/><colFields count="0"/>
      <dataFields count="0"/>
      <rowItems count="2">
        <i><x v="0"/></i>
        <i t="grand"><x v="0"/></i>
      </rowItems>
      <colItems count="1">
        <i r="1"><x v="2"/></i>
      </colItems>
    </pivotTableDefinition>`;
    const pt = parse(xml)!;
    expect(pt.rowItems).toEqual([
      { itemIndices: [0] },
      { itemType: 'grand', itemIndices: [0] },
    ]);
    expect(pt.colItems).toEqual([
      { repeatedItemCount: 1, itemIndices: [2] },
    ]);
  });
});
