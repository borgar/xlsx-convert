import { describe, it, expect } from 'vitest';
import { parseXML } from '@borgar/simple-xml';
import { handlerWorkbook } from './workbook.ts';
import { ConversionContext } from '../ConversionContext.ts';

describe('handlerWorkbook', () => {
  it('decodes _xHHHH_ escapes in sheet names, defined names and their formulas', () => {
    const context = new ConversionContext();
    context.options.cellFormulas = true;
    const wb = handlerWorkbook(parseXML(
      '<workbook>' +
        '<sheets>' +
          '<sheet name="S_x0041_" sheetId="1" r:id="rId1"/>' +
        '</sheets>' +
        '<definedNames>' +
          '<definedName name="N_x0041_">"Q_x005F_x0041_"</definedName>' +
          '<definedName name="Local" localSheetId="0">\'S_x0041_\'!$A$1</definedName>' +
        '</definedNames>' +
      '</workbook>',
    ), context);

    expect(context.sheetLinks.map(d => d.name)).toEqual([ 'SA' ]);
    expect(wb.names).toEqual([
      { name: 'NA', value: '"Q_x0041_"' },
      { name: 'Local', value: "'SA'!$A$1", scope: 'SA' },
    ]);
    expect(context.nameDefs.get('NA')?.value).toBe('"Q_x0041_"');
  });
});
