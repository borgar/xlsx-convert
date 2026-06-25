import type { Element } from '@borgar/simple-xml';
import type { ManualLayout } from './types/ManualLayout.ts';
import { hasKeys } from '../../utils/hasKeys.ts';
import { getFirstChild } from '../../utils/getFirstChild.ts';
import { numValElm, strValElm } from './utils/valElm.ts';
import { addProp } from '../../utils/addProp.ts';

export function readLayout (elm: Element): ManualLayout | undefined {
  const layout: ManualLayout = {};

  const mlElm = getFirstChild(elm, 'manualLayout');
  if (mlElm) {
    for (const child of mlElm.children) {
      if (child.tagName === 'xMode') {
        addProp(layout, 'xMode', strValElm<'edge' | 'factor'>(child));
      }
      else if (child.tagName === 'yMode') {
        addProp(layout, 'yMode', strValElm<'edge' | 'factor'>(child));
      }
      else if (child.tagName === 'wMode') {
        addProp(layout, 'wMode', strValElm<'edge' | 'factor'>(child));
      }
      else if (child.tagName === 'hMode') {
        addProp(layout, 'hMode', strValElm<'edge' | 'factor'>(child));
      }
      else if (child.tagName === 'layoutTarget') {
        addProp(layout, 'layoutTarget', strValElm<'inner' | 'outer'>(child));
      }
      else if (child.tagName === 'x') {
        addProp(layout, 'x', numValElm(child));
      }
      else if (child.tagName === 'y') {
        addProp(layout, 'y', numValElm(child));
      }
      else if (child.tagName === 'w') {
        addProp(layout, 'w', numValElm(child));
      }
      else if (child.tagName === 'h') {
        addProp(layout, 'h', numValElm(child));
      }
    }
  }

  return hasKeys(layout) ? layout : undefined;
}
