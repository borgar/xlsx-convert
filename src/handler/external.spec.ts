import { describe, it, expect } from 'vitest';
import { parseXML } from '@borgar/simple-xml';
import { handlerExternal } from './external.ts';

const EXTERNAL_NS = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"';
const R_NS = 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';

function parseExternal (xml: string) {
  return parseXML(`<?xml version="1.0"?>\n${xml}`);
}

describe('handlerExternal', () => {
  describe('empty external cells', () => {
    it('preserves <cell r="X"/> markers without values as empty objects', () => {
      // External sheetData records which cells the host workbook depended on,
      // even when the captured value was empty. These presence markers must
      // survive the round-trip; host worksheets drop empty cells but
      // externals should not.
      const xml = `<externalLink ${EXTERNAL_NS}>
        <externalBook ${R_NS} r:id="rId1">
          <sheetNames><sheetName val="Data"/></sheetNames>
          <sheetDataSet>
            <sheetData sheetId="0">
              <row r="3"><cell r="F3"/></row>
              <row r="4"><cell r="F4"/></row>
              <row r="5"><cell r="F5"><v>42</v></cell></row>
            </sheetData>
          </sheetDataSet>
        </externalBook>
      </externalLink>`;

      const ext = handlerExternal(parseExternal(xml), 'Book.xlsx');

      expect(ext.sheets[0].cells).toEqual({
        F3: {},
        F4: {},
        F5: { v: 42 },
      });
    });

    it('preserves refreshError with empty cells intact', () => {
      const xml = `<externalLink ${EXTERNAL_NS}>
        <externalBook ${R_NS} r:id="rId1">
          <sheetNames><sheetName val="Data"/></sheetNames>
          <sheetDataSet>
            <sheetData sheetId="0" refreshError="1">
              <row r="1"><cell r="A1"/></row>
            </sheetData>
          </sheetDataSet>
        </externalBook>
      </externalLink>`;

      const ext = handlerExternal(parseExternal(xml), 'Book.xlsx');

      expect(ext.sheets[0].refreshError).toBe(true);
      expect(ext.sheets[0].cells).toEqual({ A1: {} });
    });
  });

  describe('noSheetData marker', () => {
    it('marks sheets named in sheetNames but absent from sheetDataSet', () => {
      // Input has 3 sheetNames but only 2 sheetData entries (skipping sheetId=1).
      // The skipped sheet should be marked noSheetData=true so the emitter
      // can preserve the distinction between "sheetData absent" and
      // "empty <sheetData sheetId=N/>".
      const xml = `<externalLink ${EXTERNAL_NS}>
        <externalBook ${R_NS} r:id="rId1">
          <sheetNames>
            <sheetName val="A"/>
            <sheetName val="B"/>
            <sheetName val="C"/>
          </sheetNames>
          <sheetDataSet>
            <sheetData sheetId="0"/>
            <sheetData sheetId="2"/>
          </sheetDataSet>
        </externalBook>
      </externalLink>`;

      const ext = handlerExternal(parseExternal(xml), 'Book.xlsx');

      expect(ext.sheets[0].noSheetData).toBeUndefined();
      expect(ext.sheets[1].noSheetData).toBe(true);
      expect(ext.sheets[2].noSheetData).toBeUndefined();
      // Invariant (per @jsfkit/types): when noSheetData is true, cells is
      // empty and refreshError is unset. Pin it on the produced object so a
      // future regression that starts leaving stale state on the "absent"
      // sheet gets caught here rather than silently trashed on emit.
      expect(ext.sheets[1].cells).toEqual({});
      expect(ext.sheets[1].refreshError).toBeUndefined();
    });

    it('does not mark sheets whose sheetData is empty but present', () => {
      const xml = `<externalLink ${EXTERNAL_NS}>
        <externalBook ${R_NS} r:id="rId1">
          <sheetNames>
            <sheetName val="A"/>
          </sheetNames>
          <sheetDataSet>
            <sheetData sheetId="0"/>
          </sheetDataSet>
        </externalBook>
      </externalLink>`;

      const ext = handlerExternal(parseExternal(xml), 'Book.xlsx');

      expect(ext.sheets[0].noSheetData).toBeUndefined();
    });
  });
});
