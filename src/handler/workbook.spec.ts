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
    expect(context.definedNames).toEqual(wb.names);
  });

  function convertNames (names: string) {
    const context = new ConversionContext();
    const wb = handlerWorkbook(parseXML(
      '<workbook>' +
        '<sheets>' +
          '<sheet name="Alpha" sheetId="1" r:id="rId1"/>' +
          '<sheet name="Beta" sheetId="2" r:id="rId2"/>' +
        '</sheets>' +
        '<definedNames>' + names + '</definedNames>' +
      '</workbook>',
    ), context);
    return { wb, context };
  }

  it('keeps names with the same name in different scopes', () => {
    const { wb, context } = convertNames(
      '<definedName name="x">1</definedName>' +
      '<definedName name="x" localSheetId="0">2</definedName>' +
      '<definedName name="x" localSheetId="1">3</definedName>',
    );
    const expected = [
      { name: 'x', value: '1' },
      { name: 'x', value: '2', scope: 'Alpha' },
      { name: 'x', value: '3', scope: 'Beta' },
    ];
    expect(wb.names).toEqual(expected);
    expect(context.definedNames).toEqual(expected);
  });

  it('keeps the first of two names in the same scope, ignoring case', () => {
    const { wb } = convertNames(
      '<definedName name="x">1</definedName>' +
      '<definedName name="X">2</definedName>' +
      '<definedName name="y" localSheetId="0">3</definedName>' +
      '<definedName name="Y" localSheetId="0">4</definedName>',
    );
    expect(wb.names).toEqual([
      { name: 'x', value: '1' },
      { name: 'y', value: '3', scope: 'Alpha' },
    ]);
  });

  it('keeps hidden names on the context but not in the workbook', () => {
    const { wb, context } = convertNames(
      '<definedName name="_xlchart.v1.0" hidden="1">Alpha!$A$1:$A$5</definedName>' +
      '<definedName name="shown">1</definedName>',
    );
    expect(wb.names).toEqual([ { name: 'shown', value: '1' } ]);
    expect(context.definedNames).toEqual([
      { name: '_xlchart.v1.0', value: 'Alpha!$A$1:$A$5' },
      { name: 'shown', value: '1' },
    ]);
  });

  it('knows every name when converting name formulas', () => {
    // [0]!x resolves to a sheet-scoped x when there's no workbook-scoped one, so all names must be
    // collected before any name formula is converted, including names defined later.
    const { wb } = convertNames(
      '<definedName name="n">[0]!x</definedName>' +
      '<definedName name="x" localSheetId="1">5</definedName>',
    );
    expect(wb.names?.find(d => d.name === 'n')?.value).toBe('Beta!x');
  });
});
