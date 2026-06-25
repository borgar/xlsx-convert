import { describe, it, expect } from 'vitest';
import { parseXML } from '@borgar/simple-xml';
import { handlerWorksheet } from './worksheet.ts';
import { ConversionContext } from '../ConversionContext.ts';

function parseSheet (xml: string) {
  const dom = parseXML(xml);
  const ctx = new ConversionContext();
  return handlerWorksheet(dom, ctx, [], 'Sheet1');
}

const SHEET_OPEN =
  '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<sheetData/>';
const SHEET_CLOSE = '</worksheet>';

describe('handlerWorksheet pageMargins', () => {
  it('parses non-default <pageMargins> into the sheet', () => {
    const sheet = parseSheet(
      SHEET_OPEN +
        '<pageMargins left="0.5" right="0.5" top="1" bottom="1" header="0.25" footer="0.25"/>' +
        SHEET_CLOSE,
    );
    expect(sheet.pageMargins).toEqual({
      left: 0.5, right: 0.5, top: 1, bottom: 1, header: 0.25, footer: 0.25,
    });
  });

  it('omits pageMargins when the element is absent', () => {
    const sheet = parseSheet(SHEET_OPEN + SHEET_CLOSE);
    expect(sheet.pageMargins).toBeUndefined();
  });

  it('omits pageMargins when the element matches the canonical defaults', () => {
    // Per @jsfkit/types Worksheet.pageMargins @default, absent and default-valued are
    // equivalent in JSF. Normalise to absent so common cases keep the JSF compact.
    const sheet = parseSheet(
      SHEET_OPEN +
        '<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>' +
        SHEET_CLOSE,
    );
    expect(sheet.pageMargins).toBeUndefined();
  });

  it('omits pageMargins when any required attribute is missing', () => {
    // OOXML requires every attribute; treat malformed as absent rather than fill in defaults
    const sheet = parseSheet(
      SHEET_OPEN +
        '<pageMargins left="0.5" right="0.5" top="1" bottom="1" header="0.25"/>' +
        SHEET_CLOSE,
    );
    expect(sheet.pageMargins).toBeUndefined();
  });
});
