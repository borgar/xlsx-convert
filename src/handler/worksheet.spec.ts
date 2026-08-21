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

describe('handlerWorksheet selection', () => {
  it('can have a single cell selection', () => {
    const sheet = parseSheet(
      SHEET_OPEN +
      `<sheetViews>
        <sheetView tabSelected="1" workbookViewId="0">
          <selection activeCell="I20" sqref="I20"/>
        </sheetView>
      </sheetViews>` +
      SHEET_CLOSE,
    );
    expect(sheet.views![0]?.activeCell).toBe('I20');
    expect(sheet.views![0]?.activeRanges).toBeUndefined();
  });

  it('can have a single range selection', () => {
    const sheet = parseSheet(
      SHEET_OPEN +
      `<sheetViews>
        <sheetView tabSelected="1" workbookViewId="0">
          <selection activeCell="D11" sqref="C9:F17"/>
        </sheetView>
      </sheetViews>` +
      SHEET_CLOSE,
    );
    expect(sheet.views![0]?.activeCell).toBe('D11');
    expect(sheet.views![0]?.activeRanges).toEqual([ 'C9:F17' ]);
  });

  it('can have a multi-range selection', () => {
    const sheet = parseSheet(
      SHEET_OPEN +
      `<sheetViews>
        <sheetView tabSelected="1" workbookViewId="0">
          <selection activeCell="D3" sqref="A1:D4 C3:G8"/>
        </sheetView>
      </sheetViews>` +
      SHEET_CLOSE,
    );
    expect(sheet.views![0]?.activeCell).toBe('D3');
    expect(sheet.views![0]?.activeRanges).toEqual([ 'A1:D4', 'C3:G8' ]);
  });
});

describe('handlerWorksheet sheetViews', () => {
  it('defaults to no frozen panes', () => {
    const sheet = parseSheet(
      SHEET_OPEN +
        `<sheetViews>
          <sheetView tabSelected = "1" workbookViewId="0" />
        </sheetViews>` +
        SHEET_CLOSE,
    );
    expect(sheet.views).toBeUndefined();
  });

  it('includes two frozen panes vertically split ', () => {
    const sheetViews = `
      <sheetViews>
        <sheetView tabSelected="1" workbookViewId="0">
          <pane xSplit="1" topLeftCell="C1" activePane="topRight" state="frozen"/>
        </sheetView>
      </sheetViews>`;
    const sheet = parseSheet(SHEET_OPEN + sheetViews + SHEET_CLOSE);
    expect(sheet.views).toHaveLength(1);
    const view = sheet.views![0];
    expect(view.panes).toEqual({
      type: 'frozen',
      columns: 1,
      firstVisibleCell: 'C1',
      activePane: 'topEnd',
    });
  });

  it('includes two frozen panes horizontally split ', () => {
    const sheetViews = `
      <sheetViews>
        <sheetView tabSelected="1" workbookViewId="0">
          <pane ySplit="2" topLeftCell="A3" activePane="bottomLeft" state="frozen"/>
        </sheetView>
      </sheetViews>`;
    const sheet = parseSheet(SHEET_OPEN + sheetViews + SHEET_CLOSE);
    expect(sheet.views).toHaveLength(1);
    const view = sheet.views![0];
    expect(view.panes).toEqual({
      type: 'frozen',
      rows: 2,
      firstVisibleCell: 'A3',
      activePane: 'bottomStart',
    });
  });

  it('includes four frozen panes', () => {
    const sheetViews = `
      <sheetViews>
        <sheetView tabSelected="1" topLeftCell="A2" zoomScaleNormal="100" workbookViewId="42">
          <pane xSplit="1" ySplit="2" topLeftCell="B9" activePane="bottomRight" state="frozen"/>
        </sheetView>
      </sheetViews>`;
    const sheet = parseSheet(SHEET_OPEN + sheetViews + SHEET_CLOSE);
    expect(sheet.views).toHaveLength(1);
    const view = sheet.views![0];
    expect(view.workbookView).toEqual(42);
    expect(view.panes).toEqual({
      type: 'frozen',
      columns: 1,
      rows: 2,
      firstVisibleCell: 'B9',
      activePane: 'bottomEnd',
    });
  });

  it('parses "frozenSplit" panes', () => {
    const sheetViews = `
      <sheetViews>
        <sheetView tabSelected="1" workbookViewId="0">
          <pane xSplit="10" ySplit="19" topLeftCell="K20" activePane="bottomRight" state="frozenSplit"/>
          <selection pane="topRight" activeCell="K1" sqref="K1"/>
          <selection pane="bottomLeft" activeCell="A20" sqref="A20"/>
          <selection pane="bottomRight"/>
        </sheetView>
      </sheetViews>`;
    const sheet = parseSheet(SHEET_OPEN + sheetViews + SHEET_CLOSE);
    expect(sheet.views).toHaveLength(1);
    const view = sheet.views![0];
    expect(view.workbookView).toEqual(0);
    expect(view.panes).toEqual({
      type: 'frozen',
      columns: 10,
      rows: 19,
      firstVisibleCell: 'K20',
      activePane: 'bottomEnd',
    });
  });

  it('ignores default frozen panes', () => {
    const sheetViews = `
      <sheetViews>
        <sheetView workbookViewId="0">
          <pane xSplit="0" ySplit="0" topLeftCell="" activePane="topLeft" state="frozen"/>
        </sheetView>
      </sheetViews>`;
    const sheet = parseSheet(SHEET_OPEN + sheetViews + SHEET_CLOSE);
    expect(sheet.views).toBeUndefined();
  });

  it('ignores frozen panes with a zero split but valid topLeftCell and activePane attributes', () => {
    const sheetViews = `
      <sheetViews>
        <sheetView workbookViewId="0">
          <pane xSplit="0" ySplit="0" topLeftCell="C3" activePane="bottomLeft" state="frozen"/>
        </sheetView>
      </sheetViews>`;
    const sheet = parseSheet(SHEET_OPEN + sheetViews + SHEET_CLOSE);
    expect(sheet.views).toBeUndefined();
  });

  it('handles default selection in frozen panes', () => {
    const sheetViews = `
      <sheetViews>
        <sheetView tabSelected="1" workbookViewId="0">
          <pane xSplit="2" ySplit="2" topLeftCell="C3" state="frozen"/>
          <selection pane="topLeft" activeCell="C1" sqref="C1"/>
        </sheetView>
      </sheetViews>
    `;
    const sheet = parseSheet(SHEET_OPEN + sheetViews + SHEET_CLOSE);
    expect(sheet.views![0].activeCell).toEqual('C1');
  });

  it('handles selection in frozen panes', () => {
    const sheetViews = `
      <sheetViews>
        <sheetView tabSelected="1" workbookViewId="0">
          <pane xSplit="2" ySplit="2" topLeftCell="C3" activePane="bottomLeft" state="frozen"/>
          <selection pane="topRight" activeCell="C1" sqref="C1"/>
          <selection pane="bottomLeft" activeCell="A3" sqref="A3"/>
          <selection pane="bottomRight" activeCell="C4" sqref="C4"/>
        </sheetView>
      </sheetViews>
    `;
    const sheet = parseSheet(SHEET_OPEN + sheetViews + SHEET_CLOSE);
    expect(sheet.views![0].activeCell).toEqual('A3');
  });

  it('omits firstVisibleCell when a frozen pane has no topLeftCell', () => {
    const sheetViews = `
      <sheetViews>
        <sheetView tabSelected="1" workbookViewId="0">
          <pane xSplit="2" ySplit="2" activePane="bottomLeft" state="frozen"/>
        </sheetView>
      </sheetViews>
    `;
    const sheet = parseSheet(SHEET_OPEN + sheetViews + SHEET_CLOSE);
    expect(sheet.views).toHaveLength(1);
    expect(sheet.views![0].panes).toBeDefined();
    expect(sheet.views![0].panes!.firstVisibleCell).toBeUndefined();
  });

  it('omits activePane when a frozen pane uses default activePane="topLeft"', () => {
    const sheetViews = `
      <sheetViews>
        <sheetView tabSelected="1" workbookViewId="0">
          <pane xSplit="2" ySplit="2" activePane="topLeft" state="frozen"/>
        </sheetView>
      </sheetViews>
    `;
    const sheet = parseSheet(SHEET_OPEN + sheetViews + SHEET_CLOSE);
    expect(sheet.views).toHaveLength(1);
    expect(sheet.views![0].panes).toBeDefined();
    expect(sheet.views![0].panes!.activePane).toBeUndefined();
  });

  it('discards implicitly split panes (<pane> has no state attribute)', () => {
    const sheetViews = `
      <sheetViews>
        <sheetView tabSelected="1" workbookViewId="0">
          <pane xSplit="6960" ySplit="3000" topLeftCell="F9" activePane="bottomRight"/>
          <selection pane="topRight" activeCell="F1" sqref="F1"/>
          <selection pane="bottomLeft" activeCell="A9" sqref="A9"/>
          <selection pane="bottomRight" activeCell="F9" sqref="F9"/>
        </sheetView>
      </sheetViews>
    `;
    const sheet = parseSheet(SHEET_OPEN + sheetViews + SHEET_CLOSE);
    expect(sheet.views).toHaveLength(1);
    expect(sheet.views![0]).toEqual({
      activeCell: 'F9',
      workbookView: 0,
    });
  });

  it('discards explicitly split panes (<pane state="split">)', () => {
    const sheetViews = `
      <sheetViews>
        <sheetView tabSelected="1" workbookViewId="0">
          <pane state="split" xSplit="6960" ySplit="3000" topLeftCell="F9" activePane="bottomRight"/>
          <selection pane="topRight" activeCell="F1" sqref="F1"/>
          <selection pane="bottomLeft" activeCell="A9" sqref="A9"/>
          <selection pane="bottomRight" activeCell="F9" sqref="F9"/>
        </sheetView>
      </sheetViews>
    `;
    const sheet = parseSheet(SHEET_OPEN + sheetViews + SHEET_CLOSE);
    expect(sheet.views).toHaveLength(1);
    expect(sheet.views![0]).toEqual({
      activeCell: 'F9',
      workbookView: 0,
    });
  });
});
