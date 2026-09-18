import type { Element } from '@borgar/simple-xml';
import type { ConversionContext } from '../../ConversionContext.ts';
import { boolValElm, numValElm, strValElm } from './utils/valElm.ts';
import { addProp } from '../../utils/addProp.ts';
import { attr, boolAttr } from '../../utils/attr.ts';
import { readShapeProperties } from '../drawings/readShapeProperties.ts';
import type { Legend } from './types/legend/Legend.ts';
import type { LegendEntry } from './types/legend/LegendEntry.ts';
import type { LegendPos } from './types/legend/LegendPos.ts';
import { readTextProps } from './readTextProps.ts';
import { readLayout } from './readLayout.ts';

export function readLegend (element: Element, context: ConversionContext): Legend | undefined {
  const out: Legend = {};

  // ChartEx: position and overlay are attributes on the element itself
  const posAttr = attr(element, 'pos');
  if (posAttr != null) {
    addProp(out, 'pos', posAttr as LegendPos, 'r' as LegendPos);
  }

  // Only set from the attribute when it is actually present (ChartEx); classic charts carry
  // overlay as a child element, handled below.
  addProp(out, 'overlay', boolAttr(element, 'overlay') ?? undefined, false);

  for (const child of element.children) {
    if (child.tagName === 'legendPos') {
      // Always emit pos, even at the schema default 'r': the PRESENCE of legendPos means the
      // legend is docked (the plot area reserves space for it); a manual layout without
      // legendPos is an undocked, free-floating legend that overlays the plot.
      addProp(out, 'pos', strValElm(child, 'r'));
    }
    else if (child.tagName === 'legendEntry') {
      const entry: LegendEntry = { idx: 0 };
      for (const sub of child.children) {
        if (sub.tagName === 'idx') {
          entry.idx = numValElm(sub) ?? 0;
        }
        else if (sub.tagName === 'delete') {
          addProp(entry, 'delete', boolValElm(sub), false);
        }
        else if (sub.tagName === 'txPr') {
          addProp(entry, 'textProps', readTextProps(sub, context));
        }
      }
      (out.legendEntry ??= []).push(entry);
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

  // Excel treats an omitted c:overlay as "do not overlap the chart" (it reserves plot-area
  // space for the legend), and writes the element explicitly when overlap is on.
  if (out.overlay == null) {
    out.overlay = false;
  }

  return out;
}
