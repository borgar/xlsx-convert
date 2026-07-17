import type { Element } from '@borgar/simple-xml';
import { attr, dmlPercentAttr, numAttr } from '../../utils/attr.ts';
import { readFill } from './readFill.ts';
import { addProp } from '../../utils/addProp.ts';
import type { DashStop, LineEnd, LineEndType, Line, LineStyle, LineEndSize, LineAlignment, LineCapType, LineCompoundType, LineJoinType } from '@jsfkit/types';
import type { ConversionContext } from '../../ConversionContext.ts';

const HEADSIZE: Record<string, LineEndSize> = { lg: 'lg', med: 'med', sm: 'sm' };
const LINEALIGN: Record<string, LineAlignment> = { ctr: 'center', in: 'inside' }; // "outer" does not exist in DML
const LINECAP: Record<string, LineCapType> = { flat: 'butt', rnd: 'round', sq: 'square' };
const LINECMPD: Record<string, LineCompoundType> = { dbl: 'dbl', sng: 'sng', thickThin: 'thickThin', thinThick: 'thinThick', tri: 'tri' };
const LINEJOIN: Record<string, LineJoinType> = { bevel: 'bevel', round: 'round', square: 'miter' };

export function readLineProps (elm: Element, context: ConversionContext): Line | undefined {
  // If we're here, that means a line should be drawn.
  // - When <a:ln> is absent → no line is rendered
  // When w is omitted the width is left UNSET: the effective default depends on where the
  // line is used (drawing shapes render at 0.75pt, chart SERIES lines resolve through the
  // chart style to 2.25pt), so consumers apply their own context's default.
  const line: Line = {};
  addProp(line, 'width', numAttr(elm, 'w'));
  addProp(line, 'cmpd', LINECMPD[attr(elm, 'cmpd', 'sng')], 'sng');
  // ECMA-376: when cap is omitted, a value of square is assumed.
  addProp(line, 'cap', LINECAP[attr(elm, 'cap', 'sq')], 'butt');
  addProp(line, 'align', LINEALIGN[attr(elm, 'algn', 'ctr')], 'center');

  elm.children.forEach(child => {
    if (
      child.tagName === 'noFill' ||
      child.tagName === 'gradFill' ||
      child.tagName === 'solidFill' ||
      child.tagName === 'pattFill'
    ) {
      const fill = readFill(child, context);
      if (fill && fill.type !== 'blip' && fill.type !== 'group') {
        addProp(line, 'fill', fill);
      }
    }
    else if (child.tagName === 'prstDash') {
      // Preset Dash) §5.1.10.48
      addProp(line, 'style', attr(child, 'val', 'solid') as LineStyle, 'solid');
    }
    else if (child.tagName === 'custDash') {
      // Custom Dash: §5.1.10.21
      // List of elements that specify two attributes:
      // - d for the length of the dash relative to line width, and
      // - sp for length of the space relative to line width.
      const stops: DashStop[] = [];
      for (const ds of child.children) {
        if (ds.tagName !== 'ds') continue;
        const d = dmlPercentAttr(ds, 'd', 0);
        const sp = dmlPercentAttr(ds, 'sp', 0);
        stops.push({ d, sp });
      }
      if (stops.length) {
        line.style = stops;
      }
    }
    else if (child.tagName === 'headEnd') {
      const head: LineEnd = { type: attr(child, 'type', 'none') as LineEndType };
      if (head.type !== 'none') {
        addProp(head, 'width', HEADSIZE[attr(child, 'w') ?? ''], 'med');
        addProp(head, 'len', HEADSIZE[attr(child, 'len') ?? ''], 'med');
        line.head = head;
      }
    }
    else if (child.tagName === 'tailEnd') {
      const tail: LineEnd = { type: attr(child, 'type', 'none') as LineEndType };
      if (tail.type !== 'none') {
        addProp(tail, 'width', HEADSIZE[attr(child, 'w') ?? ''], 'med');
        addProp(tail, 'len', HEADSIZE[attr(child, 'len') ?? ''], 'med');
        line.tail = tail;
      }
    }
    else if (child.tagName in LINEJOIN) {
      line.join = LINEJOIN[child.tagName];
    }
  });

  if (line.fill?.type === 'none') {
    return undefined;
  }

  return line;
}
