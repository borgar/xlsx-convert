import type { Element } from '@borgar/simple-xml';
import type { CFRule } from '@jsfkit/types';

import { getFirstChild } from '../../utils/getFirstChild.ts';
import { readDataBar } from './readDataBar.ts';
import { readIconSet } from './readIconSet.ts';
import type { RuleContext } from './RuleContext.ts';

/**
 * Applies an x14 extension rule to the standard OOXML rule that it extends.
 *
 * Only data bars and icon sets have x14 forms. The extended data bar adds properties to the main
 * one, while the extended icon set replaces it (the main part holds only a fallback for older
 * applications).
 */
export function extendRule (rule: CFRule, ext: Element, rc: RuleContext): void {
  if (rule.type === 'dataBar') {
    const barNode = getFirstChild(ext, 'dataBar');
    if (barNode) {
      Object.assign(rule.dataBar, readDataBar(barNode, rc.context));
    }
  }
  else if (rule.type === 'iconSet') {
    const setNode = getFirstChild(ext, 'iconSet');
    const iconSet = setNode ? readIconSet(setNode, rc.context) : null;
    if (iconSet) {
      rule.iconSet = iconSet;
    }
  }
}
