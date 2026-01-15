import { describe, it, expect } from 'vitest';
import { handlerRels } from './rels.ts';
import { parseXML } from '@borgar/simple-xml';

describe('handlerRels', () => {
  describe('target path resolution', () => {
    it('should resolve relative paths from basepath', () => {
      // Arrange
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
          <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/table" Target="../tables/table1.xml"/>
        </Relationships>`;
      const dom = parseXML(xml);

      // Act
      const rels = handlerRels(dom, 'xl/worksheets/sheet1.xml');

      // Assert
      expect(rels[0].target).toBe('xl/tables/table1.xml');
    });

    it('should resolve absolute paths from package root', () => {
      // Arrange
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
          <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/table" Target="/xl/tables/table1.xml"/>
        </Relationships>`;
      const dom = parseXML(xml);

      // Act
      const rels = handlerRels(dom, 'xl/worksheets/sheet1.xml');

      // Assert
      expect(rels[0].target).toBe('xl/tables/table1.xml');
    });
  });
});
