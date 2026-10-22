import { describe, it, expect } from 'vitest';
import { parseXML } from '@borgar/simple-xml';
import { handlerTable } from './table.ts';
import { ConversionContext } from '../ConversionContext.ts';

describe('handlerTable', () => {
  it('decodes _xHHHH_ escapes in the table name, column names and calculated-column formulas', () => {
    const table = handlerTable(parseXML(
      '<table name="My_x005f_x0041_Table" displayName="My_x005f_x0041_Table" ref="A1:B3">' +
        '<tableColumns count="2">' +
          '<tableColumn id="1" name="Adults_x000a_/day"/>' +
          '<tableColumn id="2" name="B">' +
            '<calculatedColumnFormula>[@[Adults_x000a_/day]]&amp;"_x0041_"</calculatedColumnFormula>' +
          '</tableColumn>' +
        '</tableColumns>' +
      '</table>',
    ), new ConversionContext());

    expect(table?.name).toBe('My_x0041_Table');
    expect(table?.columns.map(c => c.name)).toEqual([ 'Adults\n/day', 'B' ]);
    expect(table?.columns[1].formula).toBe('[@[Adults\n/day]]&"A"');
  });

  it('falls back to the decoded name when displayName is missing', () => {
    const table = handlerTable(parseXML('<table name="T_x0041_" ref="A1:A2"><tableColumns/></table>'), new ConversionContext());

    expect(table?.name).toBe('TA');
  });
});
