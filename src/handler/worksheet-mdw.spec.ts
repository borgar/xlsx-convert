import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { convertBinary } from '../convertBinary.ts';

describe('column widths use the workbook Normal-font MDW', () => {
  it('reads an Arial 12 (MDW 7) workbook against MDW 7, not 6', async () => {
    // Arrange — fixture Normal font is Arial 12 (MDW 7); column A is width="10" char units.
    const bin = await readFile('./tests/excel/arial-normal.xlsx');

    // Act
    const wb = await convertBinary(bin, 'arial-normal.xlsx');

    // Assert — 10 char units * MDW 7 = 70px; the old MDW=6 path yielded 60px.
    expect(wb.sheets[0].columns).toEqual([ { start: 1, end: 1, size: 70 } ]);
  });
});
