import { describe, it, expect } from 'vitest';
import { handlerPivotTable } from './pivotTable.ts';
import { parseXML } from '@borgar/simple-xml';

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

function parse (xml: string) {
  return handlerPivotTable(parseXML(xml));
}

describe('handlerPivotTable', () => {
  it('should return undefined for missing pivotTableDefinition', () => {
    expect(parse('<root/>')).toBeUndefined();
  });

  it('should return undefined for missing name', () => {
    expect(
      parse(
        '<pivotTableDefinition><location ref="A1" firstHeaderRow="1" firstDataRow="1" firstDataCol="0"/></pivotTableDefinition>',
      ),
    ).toBeUndefined();
  });

  it('should return undefined for missing location', () => {
    expect(
      parse('<pivotTableDefinition name="PT1"></pivotTableDefinition>'),
    ).toBeUndefined();
  });

  it('should parse a basic pivot table', () => {
    const pt = parse(MINIMAL_PT);
    expect(pt).toBeDefined();
    expect(pt!.name).toBe('PivotTable1');
    expect(pt!.ref).toBe('A3:D20');
    expect(pt!.location).toEqual({
      firstHeaderRow: 1,
      firstDataRow: 2,
      firstDataCol: 1,
    });
    expect(pt!.fields).toHaveLength(2);
    expect(pt!.rowFieldIndices).toEqual([ 0 ]);
    expect(pt!.colFieldIndices).toEqual([ -2 ]);
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
    expect(pt.fields[3].axis).toBeUndefined();
    expect(pt.fields[3].dataField).toBe(true);
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
    expect(pt.fields[0].subtotalFunctions).toEqual([ 'sum', 'countA' ]);
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
    expect(pt.fields[0].subtotalFunctions).toEqual([ 'stdDev', 'stdDevP' ]);
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

  it('should parse autoSortScope', () => {
    const xml = `<pivotTableDefinition name="PT1" cacheId="0">
      <location ref="A1" firstHeaderRow="1" firstDataRow="1" firstDataCol="0"/>
      <pivotFields count="1">
        <pivotField axis="axisRow" showAll="1" sortType="descending">
          <items count="1"><item t="default"/></items>
          <autoSortScope>
            <pivotArea>
              <references count="1">
                <reference field="4294967294" count="1" selected="0">
                  <x v="0"/>
                </reference>
              </references>
            </pivotArea>
          </autoSortScope>
        </pivotField>
      </pivotFields>
      <rowFields count="1"><field x="0"/></rowFields>
      <colFields count="0"/>
      <dataFields count="0"/>
    </pivotTableDefinition>`;
    const pt = parse(xml)!;
    expect(pt.fields[0].autoSortScope).toEqual({
      references: [
        { field: -2, selected: false, itemIndices: [ 0 ] },
      ],
    });
  });

  it('should parse autoSortScope with multiple references', () => {
    const xml = `<pivotTableDefinition name="PT1" cacheId="0">
      <location ref="A1" firstHeaderRow="1" firstDataRow="1" firstDataCol="0"/>
      <pivotFields count="1">
        <pivotField axis="axisRow" showAll="1" sortType="descending">
          <items count="1"><item t="default"/></items>
          <autoSortScope>
            <pivotArea dataOnly="0" outline="0" fieldPosition="0">
              <references count="2">
                <reference field="4294967294" count="1" selected="0">
                  <x v="0"/>
                </reference>
                <reference field="25" count="1" selected="0">
                  <x v="0"/>
                </reference>
              </references>
            </pivotArea>
          </autoSortScope>
        </pivotField>
      </pivotFields>
      <rowFields count="1"><field x="0"/></rowFields>
      <colFields count="0"/>
      <dataFields count="0"/>
    </pivotTableDefinition>`;
    const pt = parse(xml)!;
    expect(pt.fields[0].autoSortScope).toEqual({
      dataOnly: false,
      outline: false,
      references: [
        { field: -2, selected: false, itemIndices: [ 0 ] },
        { field: 25, selected: false, itemIndices: [ 0 ] },
      ],
    });
  });

  it('should convert unsigned field index sentinels to signed', () => {
    // 4294967294 (0xFFFFFFFE) → -2 (values), 4294967295 (0xFFFFFFFF) → -1 (nothing)
    const xml = `<pivotTableDefinition name="PT1" cacheId="0">
      <location ref="A1" firstHeaderRow="1" firstDataRow="1" firstDataCol="0"/>
      <pivotFields count="1">
        <pivotField axis="axisRow" showAll="1" sortType="descending">
          <items count="1"><item t="default"/></items>
          <autoSortScope>
            <pivotArea field="4294967295">
              <references count="2">
                <reference field="4294967294" count="1" selected="0">
                  <x v="0"/>
                </reference>
                <reference field="3" count="1" selected="0">
                  <x v="1"/>
                </reference>
              </references>
            </pivotArea>
          </autoSortScope>
        </pivotField>
      </pivotFields>
      <rowFields count="1"><field x="0"/></rowFields>
      <colFields count="0"/>
      <dataFields count="0"/>
    </pivotTableDefinition>`;
    const pt = parse(xml)!;
    const scope = pt.fields[0].autoSortScope!;
    expect(scope.field).toBe(-1);
    expect(scope.references![0].field).toBe(-2);
    expect(scope.references![1].field).toBe(3);
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
    expect(pt.pageFields).toEqual([
      { fieldIndex: 0, selectedItem: 2, name: 'Region' },
    ]);
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
      showColumnHeaders: true,
      showRowStripes: false,
      showColumnStripes: false,
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

  it('should parse subtotal-typed row/col items (e.g. t="sum")', () => {
    const xml = `<pivotTableDefinition name="PT1" cacheId="0">
      <location ref="A1" firstHeaderRow="1" firstDataRow="1" firstDataCol="0"/>
      <pivotFields count="0"/>
      <rowFields count="0"/><colFields count="0"/>
      <dataFields count="0"/>
      <rowItems count="2">
        <i t="sum"><x v="0"/></i>
        <i t="avg"><x v="0"/></i>
      </rowItems>
    </pivotTableDefinition>`;
    const pt = parse(xml)!;
    expect(pt.rowItems).toEqual([
      { itemType: 'sum', itemIndices: [ 0 ] },
      { itemType: 'avg', itemIndices: [ 0 ] },
    ]);
  });

  it('should parse field layout attributes (compact, outline, subtotalTop, insertBlankRow)', () => {
    const xml = `<pivotTableDefinition name="PT1" cacheId="0">
      <location ref="A1" firstHeaderRow="1" firstDataRow="1" firstDataCol="0"/>
      <pivotFields count="1">
        <pivotField axis="axisRow" showAll="1" compact="0" outline="0" subtotalTop="0" insertBlankRow="1"/>
      </pivotFields>
      <rowFields count="1"><field x="0"/></rowFields>
      <colFields count="0"/>
      <dataFields count="0"/>
    </pivotTableDefinition>`;
    const pt = parse(xml)!;
    expect(pt.fields[0].compact).toBe(false);
    expect(pt.fields[0].outline).toBe(false);
    expect(pt.fields[0].subtotalTop).toBe(false);
    expect(pt.fields[0].insertBlankRow).toBe(true);
  });

  it('should not set field layout attributes when at defaults', () => {
    const pt = parse(MINIMAL_PT)!;
    expect(pt.fields[0].compact).toBeUndefined();
    expect(pt.fields[0].outline).toBeUndefined();
    expect(pt.fields[0].subtotalTop).toBeUndefined();
    expect(pt.fields[0].insertBlankRow).toBeUndefined();
  });

  it('should parse field subtotal control (defaultSubtotal, subtotalCaption)', () => {
    const xml = `<pivotTableDefinition name="PT1" cacheId="0">
      <location ref="A1" firstHeaderRow="1" firstDataRow="1" firstDataCol="0"/>
      <pivotFields count="1">
        <pivotField axis="axisRow" showAll="1" defaultSubtotal="0" subtotalCaption="My Total"/>
      </pivotFields>
      <rowFields count="1"><field x="0"/></rowFields>
      <colFields count="0"/>
      <dataFields count="0"/>
    </pivotTableDefinition>`;
    const pt = parse(xml)!;
    expect(pt.fields[0].defaultSubtotal).toBe(false);
    expect(pt.fields[0].subtotalCaption).toBe('My Total');
  });

  // numFmtId is not preserved on PivotField (requires style table to resolve to format code).

  it('should parse field UI/drag behavior attributes', () => {
    const xml = `<pivotTableDefinition name="PT1" cacheId="0">
      <location ref="A1" firstHeaderRow="1" firstDataRow="1" firstDataCol="0"/>
      <pivotFields count="1">
        <pivotField axis="axisRow" showAll="1" showDropDowns="0" dragToRow="0" dragToCol="0" dragToPage="0" dragToData="0" dragOff="0" multipleItemSelectionAllowed="1" insertPageBreak="1" hideNewItems="1" includeNewItemsInFilter="1"/>
      </pivotFields>
      <rowFields count="1"><field x="0"/></rowFields>
      <colFields count="0"/>
      <dataFields count="0"/>
    </pivotTableDefinition>`;
    const pt = parse(xml)!;
    const f = pt.fields[0];
    expect(f.showDropDowns).toBe(false);
    expect(f.dragToRow).toBe(false);
    expect(f.dragToCol).toBe(false);
    expect(f.dragToPage).toBe(false);
    expect(f.dragToData).toBe(false);
    expect(f.dragOff).toBe(false);
    expect(f.multipleItemSelectionAllowed).toBe(true);
    expect(f.insertPageBreak).toBe(true);
    expect(f.hideNewItems).toBe(true);
    expect(f.includeNewItemsInFilter).toBe(true);
  });

  it('should parse field auto-show attributes', () => {
    const xml = `<pivotTableDefinition name="PT1" cacheId="0">
      <location ref="A1" firstHeaderRow="1" firstDataRow="1" firstDataCol="0"/>
      <pivotFields count="1">
        <pivotField axis="axisRow" showAll="1" autoShow="1" topAutoShow="0" itemPageCount="5"/>
      </pivotFields>
      <rowFields count="1"><field x="0"/></rowFields>
      <colFields count="0"/>
      <dataFields count="0"/>
    </pivotTableDefinition>`;
    const pt = parse(xml)!;
    expect(pt.fields[0].autoShow).toBe(true);
    expect(pt.fields[0].topAutoShow).toBe(false);
    expect(pt.fields[0].itemPageCount).toBe(5);
  });

  it('should parse field sort and OLAP attributes', () => {
    const xml = `<pivotTableDefinition name="PT1" cacheId="0">
      <location ref="A1" firstHeaderRow="1" firstDataRow="1" firstDataCol="0"/>
      <pivotFields count="1">
        <pivotField axis="axisRow" showAll="1" nonAutoSortDefault="1" rankBy="2" hiddenLevel="1" serverField="1"/>
      </pivotFields>
      <rowFields count="1"><field x="0"/></rowFields>
      <colFields count="0"/>
      <dataFields count="0"/>
    </pivotTableDefinition>`;
    const pt = parse(xml)!;
    expect(pt.fields[0].nonAutoSortDefault).toBe(true);
    expect(pt.fields[0].rankBy).toBe(2);
    expect(pt.fields[0].hiddenLevel).toBe(true);
    expect(pt.fields[0].serverField).toBe(true);
  });

  it('should parse field item name and expanded attributes', () => {
    const xml = `<pivotTableDefinition name="PT1" cacheId="0">
      <location ref="A1" firstHeaderRow="1" firstDataRow="1" firstDataCol="0"/>
      <pivotFields count="1">
        <pivotField axis="axisRow" showAll="1">
          <items count="2">
            <item x="0" n="Custom Name"/>
            <item x="1" sd="0"/>
          </items>
        </pivotField>
      </pivotFields>
      <rowFields count="1"><field x="0"/></rowFields>
      <colFields count="0"/>
      <dataFields count="0"/>
    </pivotTableDefinition>`;
    const pt = parse(xml)!;
    expect(pt.fields[0].items![0].name).toBe('Custom Name');
    expect(pt.fields[0].items![0].expanded).toBeUndefined();
    expect(pt.fields[0].items![1].expanded).toBe(false);
  });

  it('should parse table-level layout attributes', () => {
    const xml = `<pivotTableDefinition name="PT1" cacheId="0" compact="0" outline="1" outlineData="1" compactData="0" gridDropZones="1" indent="2">
      <location ref="A1" firstHeaderRow="1" firstDataRow="1" firstDataCol="0"/>
      <pivotFields count="0"/>
      <rowFields count="0"/><colFields count="0"/>
      <dataFields count="0"/>
    </pivotTableDefinition>`;
    const pt = parse(xml)!;
    expect(pt.compact).toBe(false);
    expect(pt.outline).toBe(true);
    expect(pt.outlineData).toBe(true);
    expect(pt.compactData).toBe(false);
    expect(pt.gridDropZones).toBe(true);
    expect(pt.indent).toBe(2);
  });

  it('should parse data axis attributes', () => {
    const xml = `<pivotTableDefinition name="PT1" cacheId="0" dataOnRows="1" dataPosition="2">
      <location ref="A1" firstHeaderRow="1" firstDataRow="1" firstDataCol="0"/>
      <pivotFields count="0"/>
      <rowFields count="0"/><colFields count="0"/>
      <dataFields count="0"/>
    </pivotTableDefinition>`;
    const pt = parse(xml)!;
    expect(pt.dataOnRows).toBe(true);
    expect(pt.dataPosition).toBe(2);
  });

  it('should parse display options', () => {
    const xml = `<pivotTableDefinition name="PT1" cacheId="0" showHeaders="0" showEmptyRow="1" showEmptyCol="1" showDropZones="0">
      <location ref="A1" firstHeaderRow="1" firstDataRow="1" firstDataCol="0"/>
      <pivotFields count="0"/>
      <rowFields count="0"/><colFields count="0"/>
      <dataFields count="0"/>
    </pivotTableDefinition>`;
    const pt = parse(xml)!;
    expect(pt.showHeaders).toBe(false);
    expect(pt.showEmptyRow).toBe(true);
    expect(pt.showEmptyCol).toBe(true);
    expect(pt.showDropZones).toBe(false);
  });

  it('should parse captions', () => {
    const xml = `<pivotTableDefinition name="PT1" cacheId="0" dataCaption="Values" grandTotalCaption="Total" errorCaption="ERR" showError="1" missingCaption="N/A" showMissing="0" rowHeaderCaption="Rows" colHeaderCaption="Cols">
      <location ref="A1" firstHeaderRow="1" firstDataRow="1" firstDataCol="0"/>
      <pivotFields count="0"/>
      <rowFields count="0"/><colFields count="0"/>
      <dataFields count="0"/>
    </pivotTableDefinition>`;
    const pt = parse(xml)!;
    expect(pt.dataCaption).toBe('Values');
    expect(pt.grandTotalCaption).toBe('Total');
    expect(pt.errorCaption).toBe('ERR');
    expect(pt.showError).toBe(true);
    expect(pt.missingCaption).toBe('N/A');
    expect(pt.showMissing).toBe(false);
    expect(pt.rowHeaderCaption).toBe('Rows');
    expect(pt.colHeaderCaption).toBe('Cols');
  });

  it('should parse behavior attributes', () => {
    const xml = `<pivotTableDefinition name="PT1" cacheId="0" subtotalHiddenItems="1" fieldPrintTitles="1" itemPrintTitles="1" mergeItem="1" customListSort="0" multipleFieldFilters="0" preserveFormatting="0" pageWrap="3" pageOverThenDown="1">
      <location ref="A1" firstHeaderRow="1" firstDataRow="1" firstDataCol="0"/>
      <pivotFields count="0"/>
      <rowFields count="0"/><colFields count="0"/>
      <dataFields count="0"/>
    </pivotTableDefinition>`;
    const pt = parse(xml)!;
    expect(pt.subtotalHiddenItems).toBe(true);
    expect(pt.fieldPrintTitles).toBe(true);
    expect(pt.itemPrintTitles).toBe(true);
    expect(pt.mergeItem).toBe(true);
    expect(pt.customListSort).toBe(false);
    expect(pt.multipleFieldFilters).toBe(false);
    expect(pt.preserveFormatting).toBe(false);
    expect(pt.pageWrap).toBe(3);
    expect(pt.pageOverThenDown).toBe(true);
  });

  it('should parse uid', () => {
    const xml = `<pivotTableDefinition name="PT1" cacheId="0" xr:uid="{93AACE53-8F3A-A04A-893A-A439866B3165}">
      <location ref="A1" firstHeaderRow="1" firstDataRow="1" firstDataCol="0"/>
      <pivotFields count="0"/>
      <rowFields count="0"/><colFields count="0"/>
      <dataFields count="0"/>
    </pivotTableDefinition>`;
    const pt = parse(xml)!;
    expect(pt.uid).toBe('{93AACE53-8F3A-A04A-893A-A439866B3165}');
  });

  it('should parse location rowPageCount and colPageCount', () => {
    const xml = `<pivotTableDefinition name="PT1" cacheId="0">
      <location ref="A1" firstHeaderRow="1" firstDataRow="3" firstDataCol="0" rowPageCount="2" colPageCount="1"/>
      <pivotFields count="0"/>
      <rowFields count="0"/><colFields count="0"/>
      <dataFields count="0"/>
    </pivotTableDefinition>`;
    const pt = parse(xml)!;
    expect(pt.location.rowPageCount).toBe(2);
    expect(pt.location.colPageCount).toBe(1);
  });

  it('should parse page field caption and hierarchy', () => {
    const xml = `<pivotTableDefinition name="PT1" cacheId="0">
      <location ref="A1" firstHeaderRow="1" firstDataRow="1" firstDataCol="0"/>
      <pivotFields count="1"><pivotField axis="axisPage" showAll="1"/></pivotFields>
      <rowFields count="0"/><colFields count="0"/>
      <dataFields count="0"/>
      <pageFields count="1">
        <pageField fld="0" cap="My Filter" hier="3"/>
      </pageFields>
    </pivotTableDefinition>`;
    const pt = parse(xml)!;
    expect(pt.pageFields![0].caption).toBe('My Filter');
    expect(pt.pageFields![0].hierarchy).toBe(3);
  });

  it('should parse row/col item dataFieldIndex', () => {
    const xml = `<pivotTableDefinition name="PT1" cacheId="0">
      <location ref="A1" firstHeaderRow="1" firstDataRow="1" firstDataCol="0"/>
      <pivotFields count="0"/>
      <rowFields count="0"/><colFields count="0"/>
      <dataFields count="0"/>
      <rowItems count="3">
        <i><x v="0"/></i>
        <i i="0"><x v="0"/></i>
        <i i="1"><x v="0"/></i>
      </rowItems>
    </pivotTableDefinition>`;
    const pt = parse(xml)!;
    // absent i attribute and i="0" are both suppressed (0 is the OOXML default)
    expect(pt.rowItems![0].dataFieldIndex).toBeUndefined();
    expect(pt.rowItems![1].dataFieldIndex).toBeUndefined();
    expect(pt.rowItems![2].dataFieldIndex).toBe(1);
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
      { itemIndices: [ 0 ] },
      { itemType: 'grand', itemIndices: [ 0 ] },
    ]);
    expect(pt.colItems).toEqual([ { repeatedItemCount: 1, itemIndices: [ 2 ] } ]);
  });

  // formats and conditionalFormats are no longer on PivotTable (they depend on dxf which
  // doesn't exist in JSF yet). The parsing functions are kept but not called.

  it('should parse filters with autoFilter, top10, and customFilters', () => {
    const xml = `<pivotTableDefinition name="PT1" cacheId="0">
      <location ref="A1" firstHeaderRow="1" firstDataRow="1" firstDataCol="0"/>
      <pivotFields count="0"/>
      <rowFields count="0"/><colFields count="0"/>
      <dataFields count="0"/>
      <filters count="2">
        <filter fld="0" type="count" id="1" evalOrder="2" name="Top 5">
          <autoFilter ref="A1:A10">
            <filterColumn colId="0">
              <top10 val="5" top="0" percent="1" filterVal="42.5"/>
            </filterColumn>
          </autoFilter>
        </filter>
        <filter fld="1" type="captionGreaterThan" id="2" stringValue1="Foo" stringValue2="Bar" description="Caption filter">
          <autoFilter>
            <filterColumn colId="0">
              <customFilters and="1">
                <customFilter operator="greaterThan" val="100"/>
                <customFilter operator="lessThan" val="500"/>
              </customFilters>
            </filterColumn>
          </autoFilter>
        </filter>
      </filters>
    </pivotTableDefinition>`;
    const pt = parse(xml)!;
    expect(pt.filters).toHaveLength(2);
    expect(pt.filters![0]).toEqual({
      fieldIndex: 0,
      type: 'count',
      id: 1,
      evalOrder: 2,
      name: 'Top 5',
      autoFilter: {
        ref: 'A1:A10',
        filterColumns: [
          { colId: 0, top10: { val: 5, top: false, percent: true, filterVal: 42.5 } },
        ],
      },
    });
    expect(pt.filters![1]).toEqual({
      fieldIndex: 1,
      type: 'captionGreaterThan',
      id: 2,
      stringValue1: 'Foo',
      stringValue2: 'Bar',
      description: 'Caption filter',
      autoFilter: {
        filterColumns: [
          {
            colId: 0,
            customFilters: {
              and: true,
              filters: [
                { operator: 'greaterThan', val: '100' },
                { operator: 'lessThan', val: '500' },
              ],
            },
          },
        ],
      },
    });
  });

  it('should skip filters with invalid type', () => {
    const xml = `<pivotTableDefinition name="PT1" cacheId="0">
      <location ref="A1" firstHeaderRow="1" firstDataRow="1" firstDataCol="0"/>
      <pivotFields count="0"/>
      <rowFields count="0"/><colFields count="0"/>
      <dataFields count="0"/>
      <filters count="1">
        <filter fld="0" type="invalidType" id="1"/>
      </filters>
    </pivotTableDefinition>`;
    const pt = parse(xml)!;
    expect(pt.filters).toBeUndefined();
  });

  it('should parse calculatedFields', () => {
    const xml = `<pivotTableDefinition name="PT1" cacheId="0">
      <location ref="A1" firstHeaderRow="1" firstDataRow="1" firstDataCol="0"/>
      <pivotFields count="0"/>
      <rowFields count="0"/><colFields count="0"/>
      <dataFields count="0"/>
      <calculatedFields count="2">
        <calculatedField name="Profit" formula="Revenue - Cost"/>
        <calculatedField name="Margin" formula="Profit / Revenue"/>
      </calculatedFields>
    </pivotTableDefinition>`;
    const pt = parse(xml)!;
    expect(pt.calculatedFields).toEqual([
      { name: 'Profit', formula: 'Revenue - Cost' },
      { name: 'Margin', formula: 'Profit / Revenue' },
    ]);
  });

  // extensions are no longer on PivotTable; extLst parsing was removed.

  it('should omit calculatedFields when absent', () => {
    const pt = parse(MINIMAL_PT)!;
    expect(pt.calculatedFields).toBeUndefined();
  });
});
