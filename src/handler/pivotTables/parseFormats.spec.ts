import { describe, it, expect } from 'vitest';
import { parseXML } from '@borgar/simple-xml';
import type { Style } from '@jsfkit/types';
import { ConversionContext } from '../../ConversionContext.ts';
import { handlerStyles } from '../styles.ts';
import { convertDxfs } from '../../utils/convertStyles.ts';
import { parseFormats } from './parseFormats.ts';

function parse (xml: string, dxfStyles?: readonly Style[]) {
  const root = parseXML(xml).querySelector('pivotTableDefinition')!;
  return parseFormats(root, dxfStyles);
}

// What Excel writes for user formatting on pivot output cells: bold + yellow
// fill on an item's data cells and on the grand total row.
const EXCEL_FORMATS = `<pivotTableDefinition name="PT1">
  <formats count="3">
    <format dxfId="2"><pivotArea collapsedLevelsAreSubtotals="1" fieldPosition="0">
      <references count="1"><reference field="0" count="1"><x v="1"/></reference></references>
    </pivotArea></format>
    <format dxfId="1"><pivotArea grandRow="1" outline="0" collapsedLevelsAreSubtotals="1" fieldPosition="0"/></format>
    <format dxfId="0"><pivotArea dataOnly="0" labelOnly="1" grandRow="1" outline="0" fieldPosition="0"/></format>
  </formats>
</pivotTableDefinition>`;

describe('parseFormats', () => {
  it('parses Excel-authored item-reference and grand-row records, resolving dxf styles', () => {
    const dxfStyles: Style[] = [
      { bold: true },
      { fillColor: { type: 'srgb', value: 'FFFF00' } },
      { bold: true, fillColor: { type: 'srgb', value: 'FFFF00' } },
    ];
    expect(parse(EXCEL_FORMATS, dxfStyles)).toEqual([
      {
        pivotArea: {
          collapsedLevelsAreSubtotals: true,
          fieldPosition: 0,
          references: [ { field: 0, itemIndices: [ 1 ] } ],
        },
        style: { bold: true, fillColor: { type: 'srgb', value: 'FFFF00' } },
      },
      {
        pivotArea: { grandRow: true, outline: false, collapsedLevelsAreSubtotals: true, fieldPosition: 0 },
        style: { fillColor: { type: 'srgb', value: 'FFFF00' } },
      },
      {
        pivotArea: { dataOnly: false, labelOnly: true, grandRow: true, outline: false, fieldPosition: 0 },
        style: { bold: true },
      },
    ]);
  });

  it('omits the style for blank-action records and for missing or empty dxfs', () => {
    const formats = parse(
      `<pivotTableDefinition name="PT1"><formats count="3">
        <format dxfId="0" action="blank"><pivotArea grandRow="1"/></format>
        <format><pivotArea grandCol="1"/></format>
        <format dxfId="1"><pivotArea type="all"/></format>
      </formats></pivotTableDefinition>`,
      [ { bold: true }, {} ],
    );
    expect(formats).toEqual([
      { action: 'blank', pivotArea: { grandRow: true } },
      { pivotArea: { grandCol: true } },
      { pivotArea: { type: 'all' } },
    ]);
  });

  it('returns an empty array when there is no formats element', () => {
    expect(parse('<pivotTableDefinition name="PT1"/>')).toEqual([]);
  });
});

describe('dxf parsing end to end (handlerStyles + convertDxfs)', () => {
  it('converts Excel-authored font and solid-fill dxfs, reading the fill from bgColor', () => {
    const dom = parseXML(`<styleSheet>
      <dxfs count="2">
        <dxf><font><b/></font></dxf>
        <dxf><fill><patternFill patternType="solid"><bgColor rgb="FFFFFF00"/></patternFill></fill></dxf>
      </dxfs>
    </styleSheet>`);
    const styleDefs = handlerStyles(dom, new ConversionContext());
    expect(convertDxfs(styleDefs)).toEqual([
      { bold: true },
      { fillColor: { type: 'srgb', value: 'FFFF00' } },
    ]);
  });

  it('reads explicit un-bold, inline number formats, borders, and alignment', () => {
    const dom = parseXML(`<styleSheet>
      <dxfs count="1">
        <dxf>
          <font><b val="0"/><i/><sz val="9"/></font>
          <numFmt numFmtId="164" formatCode="0.00%"/>
          <border><top style="thin"><color rgb="FFABABAB"/></top></border>
          <alignment horizontal="center" wrapText="1"/>
        </dxf>
      </dxfs>
    </styleSheet>`);
    const styleDefs = handlerStyles(dom, new ConversionContext());
    expect(convertDxfs(styleDefs)).toEqual([
      {
        numberFormat: '0.00%',
        horizontalAlignment: 'center',
        wrapText: true,
        fontSize: 9,
        bold: false,
        italic: true,
        borderTopStyle: 'thin',
        borderTopColor: { type: 'srgb', value: 'ABABAB' },
      },
    ]);
  });
});
