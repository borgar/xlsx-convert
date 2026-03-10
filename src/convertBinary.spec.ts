import { describe, expect, test } from 'vitest';
import { convertBinary } from './convertBinary.ts';
import { readFile } from 'node:fs/promises';

describe('convertBinary', () => {
  test('convertBinary should be exported', () => {
    expect(typeof convertBinary).toBe('function');
  });

  test('convert "numbers.xlsx"', async () => {
    const bin = await readFile('./tests/excel/numbers.xlsx');
    expect(await convertBinary(bin, 'numbers.xlsx')).toEqual({
      name: 'numbers.xlsx',
      sheets: [
        {
          cells: {
            A1: { v: 0 },
            A2: { v: 1 },
            A3: { v: 2 },
            A4: { v: 10000000 },
            A5: { v: 1e-9 },
            A6: { s: 1, v: 1e-90 },
            A7: { v: 1234.567879 },
            A8: { s: 2, v: 0.123 },
          },
          columns: [ { end: 1, size: 73, start: 1 } ],
          defaults: { colWidth: 65, rowHeight: 16 },
          hidden: 0,
          merges: [],
          name: 'Sheet1',
          rows: [],
          views: [ { activeCell: 'A9', workbookView: 0 } ],
        },
      ],
      calculationProperties: {
        epoch: 1900,
        iterate: false,
        iterateCount: 100,
        iterateDelta: 0.001,
      },
      formulas: [],
      meta: { app: 'Microsoft Excel', appVariant: 'Macintosh', appVersion: '16.0300' },
      names: [],
      tables: [],
      views: [ {} ],
      styles: [
        { fontFamily: 'Calibri', fontSize: 12 },
        { fontFamily: 'Calibri', fontSize: 12, numberFormat: '0.00E+00' },
        { fontFamily: 'Calibri', fontSize: 12, numberFormat: '0.0%' },
      ],
    });
  });

  describe('convert "image-backgrounds-dimensions.xlsx"', async () => {
    const bin = await readFile('./tests/excel/image-backgrounds-dimensions.xlsx');
    const imgName = 'xl/media/image1.png';

    test('convert normally', async () => {
      const jsf = await convertBinary(bin, 'image-backgrounds-dimensions.xlsx');
      expect(Object.keys(jsf.images)).toStrictEqual([ imgName ]);
      expect(jsf.images[imgName].length).toBe(462658);
      expect(jsf.images[imgName].slice(0, 32)).toBe('data:image/png;base64,iVBORw0KGg');
    });

    test('convert with altering image callback', async () => {
      const jsf = await convertBinary(bin, 'image-backgrounds-dimensions.xlsx', {
        imageCallback: (_, name: string) => name,
      });
      expect(Object.keys(jsf.images)).toStrictEqual([ imgName ]);
      expect(jsf.images[imgName].length).toBe(19);
      expect(jsf.images[imgName]).toBe(imgName);
    });

    test('convert with void image callback', async () => {
      const jsf = await convertBinary(bin, 'image-backgrounds-dimensions.xlsx', {
        imageCallback: () => {},
      });
      expect(Object.keys(jsf.images)).toStrictEqual([ imgName ]);
      expect(jsf.images[imgName].length).toBe(462658);
      expect(jsf.images[imgName].slice(0, 32)).toBe('data:image/png;base64,iVBORw0KGg');
    });
  });

  test('images from all sheets are collected (not lost to concurrent processing)', async () => {
    // charts-and-images.xlsx has two sheets:
    //   Sheet1: background picture (image5.png) + drawing with 3 charts
    //   Sheet2: drawing containing image6.png
    // Both images should appear in wb.images. A race condition in the
    // Promise.all sheet processing loop can cause one sheet's images to
    // overwrite another's because context.images is shared mutable state.
    const bin = await readFile('./tests/excel/charts-and-images.xlsx');
    const jsf = await convertBinary(bin, 'charts-and-images.xlsx');
    const imageKeys = Object.keys(jsf.images ?? {}).sort();
    expect(imageKeys).toStrictEqual([
      'xl/media/image5.png',
      'xl/media/image6.png',
    ]);
  });
});
