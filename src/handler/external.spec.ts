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
  });
});
