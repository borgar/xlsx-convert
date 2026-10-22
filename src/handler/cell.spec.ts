import { describe, it, expect } from 'vitest';
import { parseXML } from '@borgar/simple-xml';
import { handlerCell } from './cell.ts';
import { ConversionContext } from '../ConversionContext.ts';
import type { Style } from '@jsfkit/types';

function parseCell (xml: string, address: string, ctx: ConversionContext) {
  const dom = parseXML(xml);
  return handlerCell(dom.root!, address, ctx);
}

function contextWithStyles (styles: Style[]): ConversionContext {
  const ctx = new ConversionContext();
  ctx.workbook = { name: 'test.xlsx', sheets: [], styles };
  return ctx;
}

describe('handlerCell style-only cells', () => {
  // Style-only cell: <c r="C2" s="1"/> -- a style index, no <v>/<f>/<is>.

  it('retains a style-only cell with a non-visible style (e.g. a number format) by default', () => {
    const ctx = contextWithStyles([ {}, { numberFormat: 'mm-dd-yy' } ]);

    const cell = parseCell('<c r="C2" s="1"/>', 'C2', ctx);

    expect(cell).toEqual({ s: 1 });
  });

  it('drops a style-only cell with a non-visible style when skipStyledEmptyCells is enabled', () => {
    const ctx = contextWithStyles([ {}, { numberFormat: 'mm-dd-yy' } ]);
    ctx.options.skipStyledEmptyCells = true;

    const cell = parseCell('<c r="C2" s="1"/>', 'C2', ctx);

    expect(cell).toBeUndefined();
  });

  it('drops a fully blank cell (no style)', () => {
    const ctx = contextWithStyles([ {} ]);

    const cell = parseCell('<c r="C2"/>', 'C2', ctx);

    expect(cell).toBeUndefined();
  });

  it('keeps a style-only cell with a "visible" style (e.g. fill color) regardless of the option', () => {
    const ctx = contextWithStyles([ {}, { fillColor: { type: 'srgb', value: 'FF0000' } } ]);

    const cell = parseCell('<c r="C2" s="1"/>', 'C2', ctx);

    expect(cell).toEqual({ s: 1 });
  });

  it('does not affect cells that already carry a value', () => {
    const ctx = contextWithStyles([ {}, { numberFormat: 'mm-dd-yy' } ]);

    const cell = parseCell('<c r="C2" s="1"><v>44197</v></c>', 'C2', ctx);

    expect(cell).toEqual({ s: 1, v: 44197 });
  });
});

describe('handlerCell formula escapes', () => {
  function formulaContext (): ConversionContext {
    const ctx = contextWithStyles([ {} ]);
    ctx.options.cellFormulas = true;
    ctx._shared = new Map();
    ctx._arrayFormula = [];
    return ctx;
  }

  it('decodes _xHHHH_ escapes in a formula', () => {
    const cell = parseCell(
      '<c r="C1"><f>SUM(My_x005F_x0041_Table[Col])&amp;"_x0041_"</f><v>3</v></c>',
      'C1', formulaContext(),
    );
    expect(cell?.f).toBe('SUM(My_x0041_Table[Col])&"A"');
  });

  it('decodes _xHHHH_ escapes in an array formula', () => {
    const cell = parseCell('<c r="C1"><f t="array" ref="C1">LEN("_x0041_")</f><v>1</v></c>', 'C1', formulaContext());
    expect(cell?.f).toBe('LEN("A")');
  });

  it('decodes _xHHHH_ escapes in a shared formula and the cells that share it', () => {
    const ctx = formulaContext();
    const first = parseCell('<c r="C1"><f t="shared" ref="C1:C2" si="0">A1&amp;"_x0041_"</f></c>', 'C1', ctx);
    const second = parseCell('<c r="C2"><f t="shared" si="0"/></c>', 'C2', ctx);
    expect(first?.f).toBe('A1&"A"');
    expect(second?.f).toBe('A2&"A"');
  });
});
