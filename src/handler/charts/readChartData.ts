import { Element } from '@borgar/simple-xml';
import type { ConversionContext } from '../../ConversionContext.ts';
import type { StrRef } from './types/data/StrRef.ts';
import type { StrData } from './types/data/StrData.ts';
import type { NumRef } from './types/data/NumRef.ts';
import type { NumData } from './types/data/NumData.ts';
import { attr, numAttr } from '../../utils/attr.ts';

export type ResolvedChartData = {
  cat?: StrRef | StrData;
  val?: NumRef | NumData;
};

export type ChartDataMap = Map<number, ResolvedChartData>;

/**
 * Resolve a named range reference like "_xlchart.v1.15" to the actual cell
 * range formula it maps to (e.g. "Sheet1!$A$2:$A$6").
 */
function resolveNamedRange (formula: string, context: ConversionContext): string {
  return context.nameDefs.get(formula)?.value ?? formula;
}

function readStrDim (element: Element, context: ConversionContext): StrRef | StrData {
  const lvl = element.querySelector('lvl');
  if (lvl) {
    const ptCount = numAttr(lvl, 'ptCount', 0);
    const pt = lvl.querySelectorAll('pt').map((ptElm, i) => ({
      idx: numAttr(ptElm, 'idx', i),
      v: ptElm.textContent ?? '',
    }));
    return { type: 'strData', ptCount, pt };
  }

  const formula = element.querySelector('f')?.textContent?.trim() ?? '';
  return { type: 'strRef', f: resolveNamedRange(formula, context) };
}

function readNumDim (element: Element, context: ConversionContext): NumRef | NumData {
  const formatCode = element.querySelector('nf')?.textContent?.trim();

  const lvl = element.querySelector('lvl');
  if (lvl) {
    const ptCount = numAttr(lvl, 'ptCount', 0);
    const pt = lvl.querySelectorAll('pt').map((ptElm, i) => ({
      idx: numAttr(ptElm, 'idx', i),
      v: ptElm.textContent ?? '',
    }));
    return { type: 'numData', ...(formatCode != null ? { formatCode } : {}), ptCount, pt };
  }

  const formula = element.querySelector('f')?.textContent?.trim() ?? '';
  return { type: 'numRef', f: resolveNamedRange(formula, context) };
}

/**
 * Parse a ChartEx <cx:chartData> element into a map keyed by data id.
 * Each entry holds the category (strDim type="cat") and value (numDim type="val")
 * data sources for a series to look up by its dataId.
 */
export function readChartData (element: Element, context: ConversionContext): ChartDataMap {
  const map: ChartDataMap = new Map();

  for (const child of element.children) {
    if (child.tagName !== 'data') continue;
    const id = numAttr(child, 'id', -1);
    if (id < 0) continue;

    const entry: ResolvedChartData = {};
    for (const dim of child.children) {
      const dimType = attr(dim, 'type');
      if (dim.tagName === 'strDim' && dimType === 'cat') {
        entry.cat = readStrDim(dim, context);
      }
      else if (dim.tagName === 'numDim' && dimType === 'val') {
        entry.val = readNumDim(dim, context);
      }
    }
    map.set(id, entry);
  }

  return map;
}
