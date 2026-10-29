import type { Document, Element } from '@borgar/simple-xml';
import type { CFRule } from '@jsfkit/types';

import type { ConversionContext } from '../../ConversionContext.ts';
import { addProp } from '../../utils/addProp.ts';
import { attr, boolAttr, numAttr } from '../../utils/attr.ts';
import { getFirstChild } from '../../utils/getFirstChild.ts';
import { readDxf } from '../styles.ts';
import { extendRule } from './extendRule.ts';
import { readRule } from './readRule.ts';
import type { RuleContext } from './RuleContext.ts';

function readSqRef (sqref: string | null): string[] {
  // The sqref attr is a space-separated list of cell ranges.
  return (sqref ?? '').split(/\s/).filter(Boolean);
}

/**
 * Stores an inline `<x14:dxf>` on the workbook and returns its index.
 */
function addDxf (node: Element | undefined, context: ConversionContext): number | null {
  if (!node) {
    return null;
  }
  const wb = context.workbook!;
  wb.diffStyles ??= [];
  wb.diffStyles.push(readDxf(node, context.theme));
  return wb.diffStyles.length - 1;
}

/**
 * Reads conditional formatting rules from a worksheet, both from the standard OOXML spec
 * `<conditionalFormatting>` elements, and from the `x14:conditionalFormattings` extension list.
 *
 * In JSF, extension rules that extend a standard OOXML spec rule are merged into a single rule.
 */
export function handlerConditionalFormatting (dom: Document, context: ConversionContext): CFRule[] {
  const rules: CFRule[] = [];
  if (!dom.root) {
    return rules;
  }

  // Index the x14 rules by their id
  type X14Entry = { rule: Element; rc: RuleContext; used: boolean };
  const x14Rules: X14Entry[] = [];
  const x14ById = new Map<string, X14Entry>();
  dom.root.children
    .filter(d => d.tagName === 'extLst')
    .flatMap(d => d.querySelectorAll('conditionalFormattings > conditionalFormatting'))
    .forEach(condFmt => {
      const rc: RuleContext = {
        context,
        ref: readSqRef(getFirstChild(condFmt, 'sqref')?.textContent ?? null),
        pivot: boolAttr(condFmt, 'pivot', false),
      };
      for (const rule of condFmt.children) {
        if (rule.tagName !== 'cfRule') {
          continue;
        }
        const entry: X14Entry = { rule, rc, used: false };
        x14Rules.push(entry);
        const id = attr(rule, 'id');
        if (id) {
          x14ById.set(id, entry);
        }
      }
    });

  // Standard OOXML rules
  for (const condFmt of dom.root.children) {
    if (condFmt.tagName !== 'conditionalFormatting') {
      continue;
    }
    const rc: RuleContext = {
      context,
      ref: readSqRef(attr(condFmt, 'sqref')),
      pivot: boolAttr(condFmt, 'pivot', false),
    };
    if (!rc.ref.length) {
      continue;
    }
    for (const cfRule of condFmt.children) {
      if (cfRule.tagName !== 'cfRule') {
        continue;
      }
      const rule = readRule(cfRule, rc, numAttr(cfRule, 'dxfId'));
      if (!rule) {
        continue;
      }
      const extId = cfRule.querySelector('extLst > ext > id')?.textContent.trim();
      const ext = extId ? x14ById.get(extId) : null;
      if (ext) {
        ext.used = true;
        extendRule(rule, ext.rule, rc);
      }
      rules.push(rule);
    }
  }

  // x14 rules that don't extend a standard OOXML rule (i.e. they're rules in their own right)
  for (const entry of x14Rules) {
    if (entry.used || !entry.rc.ref.length) {
      continue;
    }
    const rule = readRule(entry.rule, entry.rc, null);
    if (rule) {
      if (rule.type !== 'colorScale' && rule.type !== 'dataBar' && rule.type !== 'iconSet') {
        addProp(rule, 'dxf', addDxf(getFirstChild(entry.rule, 'dxf'), context));
      }
      rules.push(rule);
    }
  }

  // Return rules in priority order. Smaller priority number means higher priority.
  return rules.sort((a, b) => a.priority - b.priority);
}
