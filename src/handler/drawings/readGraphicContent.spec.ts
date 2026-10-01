import { describe, it, expect } from 'vitest';
import { parseXML } from '@borgar/simple-xml';
import { readGraphicContent, seekXmlNs } from './readGraphicContent.ts';
import { ConversionContext } from '../../ConversionContext.ts';
import { MISSING_TABLE_SLICER } from '../../constants.ts';

const SLICER_NS = 'http://schemas.microsoft.com/office/drawing/2012/slicer';

function grandchild (xml: string) {
  return parseXML(xml).root!.children[0].children[0];
}

describe('seekXmlNs', () => {
  it('walks every ancestor to find the prefix declaration', () => {
    // Arrange
    const child = grandchild(`
      <root xmlns:sle15="${SLICER_NS}">
        <parent>
          <child/>
        </parent>
      </root>`);
    const expected = SLICER_NS;

    // Act
    const uri = seekXmlNs(child, 'sle15');

    // Assert
    expect(uri).toBe(expected);
  });

  it('returns null when no ancestor declares the prefix', () => {
    // Arrange
    const child = grandchild('<root><parent><child/></parent></root>');

    // Act
    const uri = seekXmlNs(child, 'sle15');

    // Assert
    expect(uri).toBeNull();
  });
});

describe('readGraphicContent', () => {
  it('resolves a Choice namespace prefix declared above the parent element', () => {
    // Arrange
    const xml = `
      <xdr:wsDr
        xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing"
        xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
        xmlns:sle15="http://schemas.microsoft.com/office/drawing/2012/slicer">
        <xdr:twoCellAnchor>
          <mc:AlternateContent>
            <mc:Choice Requires="sle15"><xdr:sp/></mc:Choice>
            <mc:Fallback><xdr:sp/></mc:Fallback>
          </mc:AlternateContent>
        </xdr:twoCellAnchor>
      </xdr:wsDr>`;
    const context = new ConversionContext();
    const anchor = parseXML(xml).root!.children[0];

    // Act
    readGraphicContent(anchor, context);

    // Assert
    expect(context.unsupported.has(MISSING_TABLE_SLICER)).toBe(true);
  }, 2000);
});
