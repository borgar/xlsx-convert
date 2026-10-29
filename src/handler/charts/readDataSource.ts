import type { Element } from '@borgar/simple-xml';
import { getFirstChild } from '../../utils/getFirstChild.ts';
import type { StrData } from './types/data/StrData.ts';
import type { NumData } from './types/data/NumData.ts';
import { normalizeFormula } from '../../utils/normalizeFormula.ts';
import type { ConversionContext } from '../../ConversionContext.ts';
import type { NumVal } from './types/data/NumVal.ts';
import type { AxDataSource } from './types/data/AxDataSource.ts';
import type { StrVal } from './types/data/StrVal.ts';
import { attr, numAttr } from '../../utils/attr.ts';
import { addProp } from '../../utils/addProp.ts';
import { numValElm } from './utils/valElm.ts';

function readNumData (elm: Element): NumData {
  const data: NumData = { type: 'numData' };
  const pt: NumVal[] = [];
  for (const child of elm.children) {
    if (child.tagName === 'formatCode') {
      data.formatCode = child.textContent;
    }
    else if (child.tagName === 'ptCount') {
      addProp(data, 'ptCount', numValElm(child));
    }
    else if (child.tagName === 'pt') {
      const idx = numAttr(child, 'idx');
      if (idx != null) {
        const val: NumVal = { idx, v: getFirstChild(child, 'v')?.textContent ?? '' };
        addProp(val, 'formatCode', attr(child, 'formatCode'));
        pt.push(val);
      }
    }
  }
  if (pt.length) { data.pt = pt; }
  return data;
}

function readStrPoints (elm: Element): StrVal[] {
  const pt: StrVal[] = [];
  for (const child of elm.children) {
    if (child.tagName === 'pt') {
      const idx = numAttr(child, 'idx');
      if (idx != null) {
        pt.push({ idx, v: getFirstChild(child, 'v')?.textContent ?? '' });
      }
    }
  }
  return pt;
}

function readStrData (elm: Element): StrData {
  const data: StrData = { type: 'strData' };
  const ptCount = getFirstChild(elm, 'ptCount');
  if (ptCount) { addProp(data, 'ptCount', numValElm(ptCount)); }
  const pt = readStrPoints(elm);
  if (pt.length) { data.pt = pt; }
  return data;
}

/**
 * Read the whole source range of a reference whose cells are filtered out with Excel's chart filter,
 * from the reference's extensions:
 *
 * - `c15:fullRef` when categories are filtered out. `c:f` then refers to the visible cells only.
 * - `c15:formulaRef` in a series that is filtered out of the chart. Excel then writes no `c:f`,
 *   because no cells are visible.
 */
function readFullRef (ref: Element, context: ConversionContext): string | undefined {
  const sqref = (
    ref.querySelector('extLst > ext > fullRef > sqref') ??
    ref.querySelector('extLst > ext > formulaRef > sqref')
  )?.textContent;
  return sqref ? normalizeFormula(sqref, context) : undefined;
}

export function readDataSource (element: Element, context: ConversionContext): AxDataSource | undefined {
  let data: AxDataSource | undefined = undefined;
  // One of:
  //   <element name="multiLvlStrRef" type="CT_MultiLvlStrRef" minOccurs="1" maxOccurs="1" />
  //   <element name="numRef" type="CT_NumRef" minOccurs="1" maxOccurs="1" />
  //   <element name="strRef" type="CT_StrRef" minOccurs="1" maxOccurs="1" />
  //   <element name="numLit" type="CT_NumData" minOccurs="1" maxOccurs="1" />
  //   <element name="strLit" type="CT_StrData" minOccurs="1" maxOccurs="1" />
  const ch = getFirstChild(element);
  if (ch?.tagName === 'numRef') {
    data = { type: 'numRef', f: '' };
    data.f = normalizeFormula(getFirstChild(ch, 'f')?.textContent ?? '', context);
    addProp(data, 'fullRef', readFullRef(ch, context));
    // The cache (`c:numCache`) isn't read: chart data is evaluated from the formula.
  }
  else if (ch?.tagName === 'strRef') {
    data = { type: 'strRef', f: '' };
    data.f = normalizeFormula(getFirstChild(ch, 'f')?.textContent ?? '', context);
    addProp(data, 'fullRef', readFullRef(ch, context));
    // The cache (`c:strCache`) isn't read: chart data is evaluated from the formula.
  }
  else if (ch?.tagName === 'multiLvlStrRef') {
    // Multi-level (grouped) category/x references span several columns. Consumers resolve the
    // cells through `f` like the other ref types; dropping the element would lose the series'
    // category or x data entirely.
    data = {
      type: 'mlStrRef',
      f: normalizeFormula(getFirstChild(ch, 'f')?.textContent ?? '', context),
    };
    addProp(data, 'fullRef', readFullRef(ch, context));
    // The cache (`c:multiLvlStrCache`) isn't read: chart data is evaluated from the formula.
  }
  else if (ch?.tagName === 'numLit') {
    data = readNumData(ch);
  }
  else if (ch?.tagName === 'strLit') {
    data = readStrData(ch);
  }

  return data;
}
