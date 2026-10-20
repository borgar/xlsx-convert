import type { Element } from '@borgar/simple-xml';
import type { ConversionContext } from '../../ConversionContext.ts';
import { boolValElm } from './utils/valElm.ts';
import { addProp } from '../../utils/addProp.ts';
import { readShapeProperties } from '../drawings/readShapeProperties.ts';
import type { Title } from './types/Title.ts';
import { readText } from './readText.ts';
import { readTextProps } from './readTextProps.ts';
import { readLayout } from './readLayout.ts';
import { getFirstChild } from '../../utils/getFirstChild.ts';
import type { TextProps } from './types/TextProps.ts';

/**
 * What Excel shows for rich text whose paragraphs have no default run properties (`a:defRPr`): it
 * doesn't use the chart's text defaults or its chart-wide text properties, but plain DrawingML
 * text, 18pt, regular, black (not `tx1`), and Arial (confirmed in Excel with
 * `chart-title-paragraphs.xlsx`, for chart and axis titles). Run properties apply over these.
 */
const DRAWINGML_TEXT: TextProps = {
  size: 18,
  bold: false,
  italic: false,
  color: { type: 'srgb', value: '000000' },
  typeface: 'Arial',
};

/** Whether any paragraph of a rich text block has default run properties. */
function hasDefaultRunProps (rich: Element): boolean {
  return rich.children.some(p => p.tagName === 'p' && p.children
    .find(c => c.tagName === 'pPr')?.children.some(c => c.tagName === 'defRPr'));
}

/**
 * Read a title. In a legacy chart, a title with rich text takes its text properties from the rich
 * text, and Excel ignores a title-level `c:txPr` (confirmed in Excel).
 */
export function readTitle (element: Element, context: ConversionContext): Title | undefined {
  const out: Title = {};
  let hasRich = false;
  for (const child of element.children) {
    if (child.tagName === 'tx') {
      addProp(out, 'text', readText(child, context));
      // Title font styling usually lives on the rich text block rather than a title-level txPr.
      const rich = getFirstChild(child, 'rich');
      if (rich) {
        hasRich = true;
        const props = readTextProps(rich, context);
        if (!hasDefaultRunProps(rich)) {
          out.textProps = { ...DRAWINGML_TEXT, ...props };
        }
        else {
          addProp(out, 'textProps', props);
        }
      }
    }
    else if (child.tagName === 'txPr') {
      if (!hasRich) {
        addProp(out, 'textProps', readTextProps(child, context));
      }
    }
    else if (child.tagName === 'layout') {
      addProp(out, 'layout', readLayout(child));
    }
    else if (child.tagName === 'overlay') {
      addProp(out, 'overlay', boolValElm(child));
    }
    else if (child.tagName === 'spPr') {
      addProp(out, 'shape', readShapeProperties(child, context));
    }
  }

  // Excel overlays a title that has no c:overlay on the plot area, and saves it with
  // <c:overlay val="1"/> (confirmed in Excel). JSFChart's default is the opposite.
  if (out.overlay == null) {
    out.overlay = true;
  }

  return out;
}
