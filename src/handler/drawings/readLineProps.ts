import type { Element } from '@borgar/simple-xml';
import { attr, numAttr } from '../../utils/attr.ts';
import { readFill } from './readFill.ts';
import { addProp } from '../../utils/addProp.ts';
import type { LineEnd, LineEndType, Line, LineStyle } from '@jsfkit/types';
import type { ConversionContext } from '../../ConversionContext.ts';

const HEADSIZE = { lg: 'lg', med: 'med', sm: 'sm' };
const LINEALIGN = { ctr: 'center', in: 'inner' }; // "outer" does not exist in DML
const LINECAP = { flat: 'butt', rnd: 'round', square: 'square' };
const LINECMPD = { dbl: 'dbl', sng: 'sng', thickThin: 'thickThin', thinThick: 'thinThick', tri: 'tri' };
const LINEJOIN = { bevel: 'bevel', round: 'round', square: 'miter' };

export function readLineProps (elm: Element, context: ConversionContext): Line | undefined {
  // If we're here, that means a line should be drawn.
  // - When <a:ln> is absent → no line is rendered
  // - When <a:ln> is present but w is omitted → line should be (0.75 pt = 9525 EMUs)
  const line: Line = { width: numAttr(elm, 'w', 9525) };
  addProp(line, 'cmpd', LINECMPD[attr(elm, 'cmpd', 'sng')], 'sng');
  addProp(line, 'cap', LINECAP[attr(elm, 'cap', 'square')], 'butt');
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
    }
    else if (child.tagName === 'headEnd') {
      const head: LineEnd = { type: attr(child, 'type', 'none') as LineEndType };
      if (head.type !== 'none') {
        addProp(head, 'width', HEADSIZE[attr(child, 'w')], 'med');
        addProp(head, 'len', HEADSIZE[attr(child, 'len')], 'med');
        line.head = head;
      }
    }
    else if (child.tagName === 'tailEnd') {
      const tail: LineEnd = { type: attr(child, 'type', 'none') as LineEndType };
      if (tail.type !== 'none') {
        addProp(tail, 'width', HEADSIZE[attr(child, 'w')], 'med');
        addProp(tail, 'len', HEADSIZE[attr(child, 'len')], 'med');
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
