import { describe, it, expect } from 'vitest';
import { parseXML } from '@borgar/simple-xml';
import { handlerExternal } from './external.ts';
import type { Rel } from './rels.ts';

const EXTERNAL_NS = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"';
const MC_NS = 'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"';
const R_NS = 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
const XXL21_NS = 'xmlns:xxl21="http://schemas.microsoft.com/office/spreadsheetml/2021/extlinks2021"';

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

  describe('alternateUrls', () => {
    it('captures absolute URL from xxl21:alternateUrls referencing a rel', () => {
      const xml = `<externalLink ${EXTERNAL_NS} ${MC_NS} mc:Ignorable="xxl21" ${XXL21_NS}>
        <externalBook ${R_NS} r:id="rId1">
          <xxl21:alternateUrls>
            <xxl21:absoluteUrl r:id="rId2"/>
          </xxl21:alternateUrls>
          <sheetNames><sheetName val="Data"/></sheetNames>
          <sheetDataSet><sheetData sheetId="0"/></sheetDataSet>
        </externalBook>
      </externalLink>`;
      const rels: Rel[] = [
        { id: 'rId1', type: 'externalLinkPath', target: 'Book.xlsx' },
        { id: 'rId2', type: 'externalLinkPath', target: 'https://d.docs.live.net/abc/Book.xlsx' },
      ];

      const ext = handlerExternal(parseExternal(xml), 'Book.xlsx', rels);

      expect(ext.alternateUrls).toEqual({ absoluteUrl: 'https://d.docs.live.net/abc/Book.xlsx' });
    });

    it('captures relative URL from xxl21:alternateUrls', () => {
      const xml = `<externalLink ${EXTERNAL_NS} ${XXL21_NS}>
        <externalBook ${R_NS} r:id="rId1">
          <xxl21:alternateUrls>
            <xxl21:relativeUrl r:id="rId3"/>
          </xxl21:alternateUrls>
          <sheetNames><sheetName val="A"/></sheetNames>
          <sheetDataSet><sheetData sheetId="0"/></sheetDataSet>
        </externalBook>
      </externalLink>`;
      const rels: Rel[] = [
        { id: 'rId1', type: 'externalLinkPath', target: 'Book.xlsx' },
        { id: 'rId3', type: 'externalLinkPath', target: '../other/Book.xlsx' },
      ];

      const ext = handlerExternal(parseExternal(xml), 'Book.xlsx', rels);

      expect(ext.alternateUrls).toEqual({ relativeUrl: '../other/Book.xlsx' });
    });

    it('captures driveId and itemId attributes on alternateUrls', () => {
      const xml = `<externalLink ${EXTERNAL_NS} ${XXL21_NS}>
        <externalBook ${R_NS} r:id="rId1">
          <xxl21:alternateUrls driveId="b!abc123" itemId="01HQNG26IC24RLEL3JMZCZIIVZUA3LYP2H">
            <xxl21:absoluteUrl r:id="rId2"/>
          </xxl21:alternateUrls>
          <sheetNames><sheetName val="A"/></sheetNames>
          <sheetDataSet><sheetData sheetId="0"/></sheetDataSet>
        </externalBook>
      </externalLink>`;
      const rels: Rel[] = [
        { id: 'rId1', type: 'externalLinkPath', target: 'Book.xlsx' },
        { id: 'rId2', type: 'externalLinkPath', target: 'https://d.docs.live.net/abc/Book.xlsx' },
      ];

      const ext = handlerExternal(parseExternal(xml), 'Book.xlsx', rels);

      expect(ext.alternateUrls).toEqual({
        absoluteUrl: 'https://d.docs.live.net/abc/Book.xlsx',
        driveId: 'b!abc123',
        itemId: '01HQNG26IC24RLEL3JMZCZIIVZUA3LYP2H',
      });
    });

    it('captures driveId and itemId even when no child URL element is present', () => {
      const xml = `<externalLink ${EXTERNAL_NS} ${XXL21_NS}>
        <externalBook ${R_NS} r:id="rId1">
          <xxl21:alternateUrls driveId="b!xyz" itemId="ITEMID"/>
          <sheetNames><sheetName val="A"/></sheetNames>
          <sheetDataSet><sheetData sheetId="0"/></sheetDataSet>
        </externalBook>
      </externalLink>`;

      const ext = handlerExternal(parseExternal(xml), 'Book.xlsx', []);

      expect(ext.alternateUrls).toEqual({ driveId: 'b!xyz', itemId: 'ITEMID' });
    });

    it('captures both absoluteUrl and relativeUrl when both present', () => {
      const xml = `<externalLink ${EXTERNAL_NS} ${XXL21_NS}>
        <externalBook ${R_NS} r:id="rId1">
          <xxl21:alternateUrls>
            <xxl21:absoluteUrl r:id="rId2"/>
            <xxl21:relativeUrl r:id="rId3"/>
          </xxl21:alternateUrls>
          <sheetNames><sheetName val="A"/></sheetNames>
          <sheetDataSet><sheetData sheetId="0"/></sheetDataSet>
        </externalBook>
      </externalLink>`;
      const rels: Rel[] = [
        { id: 'rId1', type: 'externalLinkPath', target: 'Book.xlsx' },
        { id: 'rId2', type: 'externalLinkPath', target: 'https://example/Book.xlsx' },
        { id: 'rId3', type: 'externalLinkPath', target: 'local/Book.xlsx' },
      ];

      const ext = handlerExternal(parseExternal(xml), 'Book.xlsx', rels);

      expect(ext.alternateUrls).toEqual({
        absoluteUrl: 'https://example/Book.xlsx',
        relativeUrl: 'local/Book.xlsx',
      });
    });

    it('omits alternateUrls when xxl21:alternateUrls is absent', () => {
      const xml = `<externalLink ${EXTERNAL_NS}>
        <externalBook ${R_NS} r:id="rId1">
          <sheetNames><sheetName val="A"/></sheetNames>
          <sheetDataSet><sheetData sheetId="0"/></sheetDataSet>
        </externalBook>
      </externalLink>`;

      const ext = handlerExternal(parseExternal(xml), 'Book.xlsx', []);

      expect(ext.alternateUrls).toBeUndefined();
    });

    it('omits alternateUrls when the referenced rel is missing', () => {
      // An `<absoluteUrl r:id="rId2"/>` pointing at a rel that doesn't exist
      // shouldn't populate alternateUrls --- we have no URL to record.
      const xml = `<externalLink ${EXTERNAL_NS} ${XXL21_NS}>
        <externalBook ${R_NS} r:id="rId1">
          <xxl21:alternateUrls>
            <xxl21:absoluteUrl r:id="rId99"/>
          </xxl21:alternateUrls>
          <sheetNames><sheetName val="A"/></sheetNames>
          <sheetDataSet><sheetData sheetId="0"/></sheetDataSet>
        </externalBook>
      </externalLink>`;
      const rels: Rel[] = [
        { id: 'rId1', type: 'externalLinkPath', target: 'Book.xlsx' },
      ];

      const ext = handlerExternal(parseExternal(xml), 'Book.xlsx', rels);

      expect(ext.alternateUrls).toBeUndefined();
    });

    it('omits alternateUrls when the element is empty (no children, no attrs)', () => {
      // A bare `<xxl21:alternateUrls/>` carries no URLs and no driveId/itemId;
      // it shouldn't produce a semantics-free `alternateUrls: {}` on the output.
      const xml = `<externalLink ${EXTERNAL_NS} ${XXL21_NS}>
        <externalBook ${R_NS} r:id="rId1">
          <xxl21:alternateUrls/>
          <sheetNames><sheetName val="A"/></sheetNames>
          <sheetDataSet><sheetData sheetId="0"/></sheetDataSet>
        </externalBook>
      </externalLink>`;

      const ext = handlerExternal(parseExternal(xml), 'Book.xlsx', []);

      expect(ext.alternateUrls).toBeUndefined();
    });

    it('omits alternateUrls when a child URL element has no r:id attribute', () => {
      // A malformed `<absoluteUrl/>` with no r:id has nothing to resolve
      // against rels --- skip it rather than record an invalid reference.
      const xml = `<externalLink ${EXTERNAL_NS} ${XXL21_NS}>
        <externalBook ${R_NS} r:id="rId1">
          <xxl21:alternateUrls>
            <xxl21:absoluteUrl/>
          </xxl21:alternateUrls>
          <sheetNames><sheetName val="A"/></sheetNames>
          <sheetDataSet><sheetData sheetId="0"/></sheetDataSet>
        </externalBook>
      </externalLink>`;

      const ext = handlerExternal(parseExternal(xml), 'Book.xlsx', []);

      expect(ext.alternateUrls).toBeUndefined();
    });
  });
});
