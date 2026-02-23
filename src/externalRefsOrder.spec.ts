import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { convertBinary } from './index.ts';

describe('external references ordering', () => {
  it('should order externals by externalReferences, not by rels document order', async () => {
    // Arrange
    //
    // We create a minimal xlsx where:
    // - workbook.xml has <externalReferences> listing rId2 first, then rId3
    //   meaning [1] = rId2, [2] = rId3
    // - workbook.xml.rels has rId3 BEFORE rId2 in document order
    //   (this is the bug trigger - rels order differs from externalReferences order)
    // - externalLink1.xml (rId2) points to "first.xlsx"
    // - externalLink2.xml (rId3) points to "second.xlsx"
    //
    // Expected: externals[0].name = "first.xlsx", externals[1].name = "second.xlsx"
    // Buggy:    externals[0].name = "second.xlsx", externals[1].name = "first.xlsx"

    const zip = new JSZip();

    // Content types (minimal)
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/externalLinks/externalLink1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.externalLink+xml"/>
  <Override PartName="/xl/externalLinks/externalLink2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.externalLink+xml"/>
</Types>`);

    // Root rels
    zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`);

    // Workbook with externalReferences in order: rId2, rId3
    // This means [1] = rId2, [2] = rId3
    zip.file('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Sheet1" sheetId="1" r:id="rId1"/>
  </sheets>
  <externalReferences>
    <externalReference r:id="rId2"/>
    <externalReference r:id="rId3"/>
  </externalReferences>
</workbook>`);

    // Workbook rels with rId3 BEFORE rId2 in document order (the bug trigger)
    zip.file('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/externalLink" Target="externalLinks/externalLink2.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/externalLink" Target="externalLinks/externalLink1.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);

    // Minimal styles
    zip.file('xl/styles.xml', `<?xml version="1.0" encoding="UTF-8"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font/></fonts>
  <fills count="1"><fill/></fills>
  <borders count="1"><border/></borders>
  <cellXfs count="1"><xf/></cellXfs>
</styleSheet>`);

    // Minimal worksheet
    zip.file('xl/worksheets/sheet1.xml', `<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData/>
</worksheet>`);

    // External link 1 (rId2) - should be [1] - points to first.xlsx
    zip.file('xl/externalLinks/externalLink1.xml', `<?xml version="1.0" encoding="UTF-8"?>
<externalLink xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
              xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <externalBook r:id="rId1">
    <sheetNames>
      <sheetName val="Sheet1"/>
    </sheetNames>
  </externalBook>
</externalLink>`);

    zip.file('xl/externalLinks/_rels/externalLink1.xml.rels', `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/externalLinkPath" Target="first.xlsx" TargetMode="External"/>
</Relationships>`);

    // External link 2 (rId3) - should be [2] - points to second.xlsx
    zip.file('xl/externalLinks/externalLink2.xml', `<?xml version="1.0" encoding="UTF-8"?>
<externalLink xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
              xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <externalBook r:id="rId1">
    <sheetNames>
      <sheetName val="Data"/>
    </sheetNames>
  </externalBook>
</externalLink>`);

    zip.file('xl/externalLinks/_rels/externalLink2.xml.rels', `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/externalLinkPath" Target="second.xlsx" TargetMode="External"/>
</Relationships>`);

    const buffer = await zip.generateAsync({ type: 'arraybuffer' });

    // Act
    const workbook = await convertBinary(Buffer.from(buffer), 'test.xlsx');

    // Assert
    // [1] should be first.xlsx (rId2 -> externalLink1.xml)
    // [2] should be second.xlsx (rId3 -> externalLink2.xml)
    expect(workbook.externals).toHaveLength(2);
    expect(workbook.externals[0].name).toBe('first.xlsx');
    expect(workbook.externals[1].name).toBe('second.xlsx');
  });
});
