import { describe, it, expect } from 'vitest';
import { parseXML } from '@borgar/simple-xml';
import { handlerMetaData } from './metadata.ts';
import { handlerCell } from './cell.ts';
import { ConversionContext } from '../ConversionContext.ts';

const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const XDA = 'http://schemas.microsoft.com/office/spreadsheetml/2017/dynamicarray';

const mdxOnlyXml = `<metadata xmlns="${NS}">
  <metadataTypes count="1"><metadataType name="XLMDX"/></metadataTypes>
  <metadataStrings count="1"><s v="[Measures].[Amount]"/></metadataStrings>
  <mdxMetadata count="2">
    <mdx n="0" f="v"><t c="1"><n x="0"/></t></mdx>
    <mdx n="0" f="v"><t c="1"><n x="0"/></t></mdx>
  </mdxMetadata>
  <valueMetadata count="2">
    <bk><rc t="1" v="0"/></bk>
    <bk><rc t="1" v="1"/></bk>
  </valueMetadata>
</metadata>`;

describe('handlerMetaData', () => {
  it('reads XLMDX metadata as entries tagged with their type', () => {
    // Arrange
    const ctx = new ConversionContext();
    const expected = { cells: [], values: [ { _type: 'XLMDX' }, { _type: 'XLMDX' } ] };

    // Act
    const metadata = handlerMetaData(parseXML(mdxOnlyXml), ctx);

    // Assert
    expect(metadata).toEqual(expected);
  });

  it('reports XLMDX metadata as unsupported', () => {
    // Arrange
    const ctx = new ConversionContext();
    const expected = [ 'cell-mdx' ];

    // Act
    handlerMetaData(parseXML(mdxOnlyXml), ctx);

    // Assert
    expect([ ...ctx.unsupported ]).toEqual(expected);
  });

  it('resolves rc/@t against metadataTypes, not futureMetadata order', () => {
    // Arrange
    const xml = `<metadata xmlns="${NS}" xmlns:xda="${XDA}">
      <metadataTypes count="2"><metadataType name="XLMDX"/><metadataType name="XLDAPR"/></metadataTypes>
      <futureMetadata name="XLDAPR" count="1">
        <bk><extLst><ext uri="{bdbb8cdc-fa1e-496e-a857-3c3f30c029c3}">
          <xda:dynamicArrayProperties fDynamic="1" fCollapsed="0"/>
        </ext></extLst></bk>
      </futureMetadata>
      <cellMetadata count="1"><bk><rc t="2" v="0"/></bk></cellMetadata>
    </metadata>`;
    const ctx = new ConversionContext();
    const expected = { _type: '_dynamicArray', fCollapsed: 0, fDynamic: 1 };

    // Act
    const metadata = handlerMetaData(parseXML(xml), ctx);

    // Assert
    expect(metadata.cells).toEqual([ expected ]);
  });

  it('converts a cell whose vm points at XLMDX metadata', () => {
    // Arrange
    const ctx = new ConversionContext();
    ctx.workbook = { name: 'test.xlsx', sheets: [], styles: [ {} ] };
    ctx.metadata = handlerMetaData(parseXML(mdxOnlyXml), ctx);
    const expected = { v: -1114930 };

    // Act
    const cell = handlerCell(parseXML('<c r="E14" vm="1"><v>-1114930</v></c>').root!, 'E14', ctx);

    // Assert
    expect(cell).toEqual(expected);
  });
});
