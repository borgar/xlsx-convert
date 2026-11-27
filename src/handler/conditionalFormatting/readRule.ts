import type { Element } from '@borgar/simple-xml';
import type {
  CFAverageRule,
  CFColorScaleRule,
  CFCompareRule,
  CFDataBar,
  CFDataBarRule,
  CFDateRule,
  CFIconSetRule,
  CFRankRule,
  CFRule,
  CFTextRule,
} from '@jsfkit/types';

import { addProp } from '../../utils/addProp.ts';
import { attr, boolAttr, numAttr } from '../../utils/attr.ts';
import { getFirstChild } from '../../utils/getFirstChild.ts';
import { readColorScale } from './readColorScale.ts';
import { readDataBar } from './readDataBar.ts';
import { readFormulas } from './readFormulas.ts';
import { readIconSet } from './readIconSet.ts';
import type { RuleContext } from './RuleContext.ts';

/**
 * Maps the four XLSX text rule types to the operator of a JSF `text` rule. Membership doubles as
 * the test for whether a `<cfRule>` type is a text rule.
 */
const TEXT_OPERATORS: Record<string, CFTextRule['operator']> = {
  containsText: 'contains',
  notContainsText: 'notContains',
  beginsWith: 'beginsWith',
  endsWith: 'endsWith',
};

/**
 * Reads a `<cfRule>` element (either the standard OOXML spec or the x14 extension) into a JSF rule.
 * Returns null for rules that can't be represented.
 */
export function readRule (node: Element, rc: RuleContext, dxf: number | null): CFRule | null {
  const { context, ref, pivot } = rc;
  const type = attr(node, 'type');
  const priority = numAttr(node, 'priority', 0);
  const base = { ref, priority };
  const formulas = readFormulas(node, context);

  // Visual rules
  if (type === 'colorScale' || type === 'dataBar' || type === 'iconSet') {
    let rule: CFColorScaleRule | CFDataBarRule | CFIconSetRule;
    if (type === 'colorScale') {
      const scale = getFirstChild(node, 'colorScale');
      const colorScale = scale ? readColorScale(scale, context) : [];
      if (colorScale.length < 2) {
        return null;
      }
      rule = { type, ...base, colorScale };
    }
    else if (type === 'dataBar') {
      const barNode = getFirstChild(node, 'dataBar');
      const bar = barNode ? readDataBar(barNode, context) : {};
      if (!bar.min || !bar.max || !bar.fillColor) {
        return null;
      }
      rule = { type, ...base, dataBar: bar as CFDataBar };
    }
    else {
      const setNode = getFirstChild(node, 'iconSet');
      const iconSet = setNode ? readIconSet(setNode, context) : null;
      if (!iconSet) {
        return null;
      }
      rule = { type, ...base, iconSet };
    }
    addProp(rule, 'pivot', pivot, false);
    addProp(rule, 'formula', formulas[0]);
    return rule;
  }

  // Style rules
  let rule: Exclude<CFRule, CFColorScaleRule | CFDataBarRule | CFIconSetRule>;
  if (type === 'cellIs') {
    const operator = attr(node, 'operator') as CFCompareRule['operator'];
    const formulasNeeded = operator === 'between' || operator === 'notBetween' ? 2 : 1;
    if (formulas.length < formulasNeeded) {
      return null;
    }
    rule = {
      type: 'compare',
      ...base,
      operator,
      formulas: formulasNeeded === 2 ? [ formulas[0], formulas[1] ] : [ formulas[0] ],
    };
  }
  else if (type && type in TEXT_OPERATORS) {
    const operator = TEXT_OPERATORS[type];
    const text = attr(node, 'text');
    if (formulas.length >= 2) {
      // When a text match uses a formula, it can only be stored in the x14 extension elements.
      // There, Excel writes two `<xm:f>` elements, and it's the second of those that contains the
      // formula the user entered. (The first is the fallback formula Excel always writes.)
      rule = { type: 'text', ...base, operator, match: formulas[1], matchIsFormula: true };
    }
    else if (text != null) {
      rule = { type: 'text', ...base, operator, match: text };
    }
    else {
      return null;
    }
  }
  else if (type === 'timePeriod') {
    const period = attr(node, 'timePeriod') as CFDateRule['period'];
    rule = { type: 'date', ...base, period };
  }
  else if (type === 'containsBlanks' || type === 'notContainsBlanks') {
    rule = { type: 'blank', ...base };
    addProp(rule, 'negate', type === 'notContainsBlanks', false);
  }
  else if (type === 'containsErrors' || type === 'notContainsErrors') {
    rule = { type: 'error', ...base };
    addProp(rule, 'negate', type === 'notContainsErrors', false);
  }
  else if (type === 'duplicateValues' || type === 'uniqueValues') {
    rule = { type: 'duplicate', ...base };
    addProp(rule, 'negate', type === 'uniqueValues', false);
  }
  else if (type === 'top10') {
    const rankRule: CFRankRule = { type: 'rank', ...base, count: numAttr(node, 'rank', 10) };
    if (boolAttr(node, 'percent')) {
      rankRule.unit = 'percent';
    }
    if (boolAttr(node, 'bottom')) {
      rankRule.direction = 'bottom';
    }
    rule = rankRule;
  }
  else if (type === 'aboveAverage') {
    const avgRule: CFAverageRule = { type: 'average', ...base };
    if (!boolAttr(node, 'aboveAverage', true)) {
      avgRule.direction = 'below';
    }
    const stdDev = numAttr(node, 'stdDev');
    if (stdDev) {
      avgRule.standardDeviations = stdDev;
    }
    else {
      addProp(avgRule, 'inclusive', boolAttr(node, 'equalAverage'), false);
    }
    rule = avgRule;
  }
  else if (type === 'expression') {
    if (!formulas[0]) {
      return null;
    }
    rule = { type: 'formula', ...base, formula: formulas[0] };
  }
  else {
    return null;
  }

  addProp(rule, 'pivot', pivot, false);
  addProp(rule, 'dxf', dxf);
  addProp(rule, 'stopIfTrue', boolAttr(node, 'stopIfTrue'), false);
  return rule;
}
