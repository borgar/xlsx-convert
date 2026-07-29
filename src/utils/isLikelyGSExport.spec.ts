import { ZipArchive } from '@borgar/zip';
import { describe, expect, test } from 'vitest';
import { isLikelyGSExport } from './isLikelyGSExport.ts';

/** An archive holding each of `paths`, with content that no signal looks at. */
async function archiveOf (...paths: string[]) {
  const zip = new ZipArchive();
  for (const path of paths) {
    await zip.write(path, '<x/>');
  }
  return zip;
}

describe('isLikelyGSExport', () => {
  test('an archive with neither docProps part looks like a Google Sheets export', async () => {
    expect(isLikelyGSExport(await archiveOf('xl/workbook.xml'))).toBe(true);
  });

  test('docProps/app.xml rules it out', async () => {
    expect(isLikelyGSExport(await archiveOf('xl/workbook.xml', 'docProps/app.xml'))).toBe(false);
  });

  test('docProps/core.xml alone rules it out', async () => {
    expect(isLikelyGSExport(await archiveOf('xl/workbook.xml', 'docProps/core.xml'))).toBe(false);
  });

  describe('external link parts', () => {
    test('an external link part rules it out', async () => {
      const zip = await archiveOf('xl/workbook.xml', 'xl/externalLinks/externalLink1.xml');
      expect(isLikelyGSExport(zip)).toBe(false);
    });

    test('its relationship part alone rules it out', async () => {
      // A malformed archive could carry the _rels entry without the part it describes; the
      // directory's presence is the signal either way.
      const zip = await archiveOf('xl/workbook.xml', 'xl/externalLinks/_rels/externalLink1.xml.rels');
      expect(isLikelyGSExport(zip)).toBe(false);
    });

    test('the path is matched case-insensitively', async () => {
      const zip = await archiveOf('xl/workbook.xml', 'xl/ExternalLinks/ExternalLink1.xml');
      expect(isLikelyGSExport(zip)).toBe(false);
    });

    test('a similarly named part elsewhere does not rule it out', async () => {
      const zip = await archiveOf('xl/workbook.xml', 'xl/worksheets/externalLinksNotes.xml');
      expect(isLikelyGSExport(zip)).toBe(true);
    });
  });
});
