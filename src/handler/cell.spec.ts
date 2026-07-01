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
  // <c r="C2" s="1"/> -- a cell with a style index but no <v>/<f>/<is>, e.g. a
  // blank cell pre-formatted with a date number format.

  it('drops a style-only cell with a non-visible style (e.g. a number format) by default', () => {
    const ctx = contextWithStyles([ {}, { numberFormat: 'mm-dd-yy' } ]);

    const cell = parseCell('<c r="C2" s="1"/>', 'C2', ctx);

    expect(cell).toBeUndefined();
  });

  it('retains a style-only cell and its style when keepStyledEmptyCells is enabled', () => {
    const ctx = contextWithStyles([ {}, { numberFormat: 'mm-dd-yy' } ]);
    ctx.options.keepStyledEmptyCells = true;

    const cell = parseCell('<c r="C2" s="1"/>', 'C2', ctx);

    expect(cell).toEqual({ s: 1 });
  });

  it('still drops a fully blank cell (no style) when keepStyledEmptyCells is enabled', () => {
    const ctx = contextWithStyles([ {} ]);
    ctx.options.keepStyledEmptyCells = true;

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
