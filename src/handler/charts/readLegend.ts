import type { Element } from '@borgar/simple-xml';
import type { ConversionContext } from '../../ConversionContext.ts';
import { boolValElm, numValElm, strValElm } from './utils/valElm.ts';
import { addProp } from '../../utils/addProp.ts';
import { readShapeProperties } from '../drawings/readShapeProperties.ts';
import type { Legend } from './types/legend/Legend.ts';
import type { LegendEntry } from './types/legend/LegendEntry.ts';
import { readTextProps } from './readTextProps.ts';
import { readLayout } from './readLayout.ts';

export function readLegend (element: Element, context: ConversionContext): Legend | undefined {
  const out: Legend = {};
  for (const child of element.children) {
    if (child.tagName === 'legendPos') {
      // Always emit pos, even at the schema default 'r'.
      addProp(out, 'pos', strValElm(child, 'r'));
    }
    else if (child.tagName === 'legendEntry') {
      const entry: Partial<LegendEntry> = {};
      for (const sub of child.children) {
        if (sub.tagName === 'idx') {
          addProp(entry, 'idx', numValElm(sub));
        }
        else if (sub.tagName === 'delete') {
          addProp(entry, 'delete', boolValElm(sub), false);
        }
      }
      // an entry without an idx can't be matched to anything, so it's left out
      if (entry.idx != null) {
        (out.legendEntry ??= []).push(entry as LegendEntry);
      }
    }
    else if (child.tagName === 'layout') {
      addProp(out, 'layout', readLayout(child));
    }
    else if (child.tagName === 'overlay') {
      // true when omitted: false means that this may not overlap the chart
      addProp(out, 'overlay', boolValElm(child));
    }
    else if (child.tagName === 'spPr') {
      addProp(out, 'shape', readShapeProperties(child, context));
    }
    else if (child.tagName === 'txPr') {
      addProp(out, 'textProps', readTextProps(child, context));
    }
  }

  // Excel overlays a legend that has no c:overlay on the plot area, and saves it with
  // <c:overlay val="1"/> (confirmed in Excel). JSFChart's default is the opposite.
  if (out.overlay == null) {
    out.overlay = true;
  }

  return out;
}
