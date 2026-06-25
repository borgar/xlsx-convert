import type { Element } from '@borgar/simple-xml';
import type { ConversionContext } from '../../ConversionContext.ts';
import { boolValElm } from './utils/valElm.ts';
import { addProp } from '../../utils/addProp.ts';
import { readShapeProperties } from '../drawings/readShapeProperties.ts';
import type { Title } from './types/Title.ts';
import { readText } from './readText.ts';
import { readTextProps } from './readTextProps.ts';
import { readLayout } from './readLayout.ts';

export function readTitle (element: Element, context: ConversionContext): Title | undefined {
  const out: Title = {};
  for (const child of element.children) {
    if (child.tagName === 'tx') {
      addProp(out, 'text', readText(child));
    }
    else if (child.tagName === 'txPr') {
      addProp(out, 'textProps', readTextProps(child, context));
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

  // overlay is true when omitted but we're flipping the default to false in JSF
  if (out.overlay == null) {
    out.overlay = true;
  }

  return out;
}
