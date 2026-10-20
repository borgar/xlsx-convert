import type { Element } from '@borgar/simple-xml';
import type { ConversionContext } from '../../ConversionContext.ts';
import { attr, numAttr } from '../../utils/attr.ts';
import { getFirstChild } from '../../utils/getFirstChild.ts';
import { normalizeFormula } from '../../utils/normalizeFormula.ts';

/** ChartEx dimension types: `cat`, `colorStr`, and `entityId` are text, the rest are numbers. */
export type ChartExDimType = 'cat' | 'colorStr' | 'entityId' | 'val' | 'x' | 'y' | 'size' | 'colorVal';

/**
 * One dimension of ChartEx data (`cx:strDim` or `cx:numDim`).
 *
 * A dimension with a formula is a reference, and its cache isn't read: chart data is evaluated
 * from the formula. A dimension without a formula is literal data.
 */
export type ChartExDim = {
  numeric: boolean;
  /** The resolved and normalized formula, for example `Sheet1!$B$2:$B$6`. */
  f?: string;
  /** Which way the range's values run (`cx:f dir`). */
  dir?: 'col' | 'row';
  /** Number of levels, for multi-level categories. */
  levels?: number;
  /** Number format code (`cx:nf`, or the first level's `formatCode`). */
  formatCode?: string;
  /**
   * Literal values of the innermost level, by point index, with `null` for points without a value.
   * Only for data without a formula.
   */
  values?: (string | null)[];
  /**
   * Literal values of every level, innermost first, when the data has more than one level. Only for
   * data without a formula.
   */
  levelValues?: (string | null)[][];
};

/** The dimensions of one `cx:data` element, by type. */
export type ChartExData = Partial<Record<ChartExDimType, ChartExDim>>;

export type ChartDataMap = Map<number, ChartExData>;

/**
 * Resolve a defined name like "_xlchart.v1.15", which ChartEx uses for every data reference, to
 * the cell range formula it stands for (e.g. "Sheet1!$A$2:$A$6"), normalized.
 */
export function resolveNamedRange (formula: string, context: ConversionContext): string {
  return normalizeFormula(context.nameDefs.get(formula)?.value ?? formula, context);
}

function readDim (element: Element, context: ConversionContext): ChartExDim {
  const dim: ChartExDim = { numeric: element.tagName === 'numDim' };
  const f = getFirstChild(element, 'f');
  const lvls = element.children.filter(d => d.tagName === 'lvl');
  const nf = getFirstChild(element, 'nf')?.textContent?.trim();
  if (nf) {
    dim.formatCode = nf;
  }
  if (lvls.length > 1) {
    // Counting the levels reads the structure, not the cached values.
    dim.levels = lvls.length;
  }
  if (f) {
    dim.f = resolveNamedRange(f.textContent?.trim() ?? '', context);
    const dir = attr(f, 'dir');
    if (dir === 'col' || dir === 'row') {
      dim.dir = dir;
    }
  }
  else if (lvls.length) {
    // Literal data: the first level is the innermost one.
    const formatCode = attr(lvls[0], 'formatCode');
    if (formatCode && !dim.formatCode) {
      dim.formatCode = formatCode;
    }
    const levelValues = lvls.map(lvl => {
      const values: (string | null)[] = Array.from({ length: numAttr(lvl, 'ptCount', 0) ?? 0 }, () => null);
      for (const pt of lvl.children.filter(d => d.tagName === 'pt')) {
        const idx = numAttr(pt, 'idx');
        if (idx != null) {
          values[idx] = pt.textContent ?? '';
        }
      }
      return values;
    });
    dim.values = levelValues[0];
    if (levelValues.length > 1) {
      dim.levelValues = levelValues;
    }
  }
  return dim;
}

/**
 * Parse a ChartEx `<cx:chartData>` element into a map keyed by data ID. Each entry holds the
 * data's dimensions by type, for a series to look up through its `cx:dataId`.
 */
export function readChartData (element: Element, context: ConversionContext): ChartDataMap {
  const map: ChartDataMap = new Map();
  for (const child of element.children) {
    if (child.tagName !== 'data') { continue; }
    const id = numAttr(child, 'id', -1) ?? -1;
    if (id < 0) { continue; }
    const entry: ChartExData = {};
    for (const dim of child.children) {
      const type = attr(dim, 'type') as ChartExDimType | null;
      if (type && (dim.tagName === 'strDim' || dim.tagName === 'numDim')) {
        entry[type] = readDim(dim, context);
      }
    }
    map.set(id, entry);
  }
  return map;
}
