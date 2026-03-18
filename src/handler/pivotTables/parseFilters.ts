import type { Element } from '@borgar/simple-xml';
import type { PivotAutoFilterColumn, PivotCustomFilterCriterion, PivotFilter, PivotFilterType } from '@jsfkit/types';
import { attr, boolAttr, numAttr } from '../../utils/attr.ts';
import { parseEnum } from '../../utils/parseEnum.ts';

type CustomFilterOp = NonNullable<PivotCustomFilterCriterion['operator']>;

const FILTER_TYPES: ReadonlySet<PivotFilterType> = new Set<PivotFilterType>([
  'unknown',
  'count',
  'percent',
  'sum',
  'captionEqual',
  'captionNotEqual',
  'captionBeginsWith',
  'captionNotBeginsWith',
  'captionEndsWith',
  'captionNotEndsWith',
  'captionContains',
  'captionNotContains',
  'captionGreaterThan',
  'captionGreaterThanOrEqual',
  'captionLessThan',
  'captionLessThanOrEqual',
  'captionBetween',
  'captionNotBetween',
  'valueEqual',
  'valueNotEqual',
  'valueGreaterThan',
  'valueGreaterThanOrEqual',
  'valueLessThan',
  'valueLessThanOrEqual',
  'valueBetween',
  'valueNotBetween',
  'dateEqual',
  'dateNotEqual',
  'dateOlderThan',
  'dateOlderThanOrEqual',
  'dateNewerThan',
  'dateNewerThanOrEqual',
  'dateBetween',
  'dateNotBetween',
  'tomorrow',
  'today',
  'yesterday',
  'nextWeek',
  'thisWeek',
  'lastWeek',
  'nextMonth',
  'thisMonth',
  'lastMonth',
  'nextQuarter',
  'thisQuarter',
  'lastQuarter',
  'nextYear',
  'thisYear',
  'lastYear',
  'yearToDate',
  'Q1',
  'Q2',
  'Q3',
  'Q4',
  'M1',
  'M2',
  'M3',
  'M4',
  'M5',
  'M6',
  'M7',
  'M8',
  'M9',
  'M10',
  'M11',
  'M12',
]);

const CUSTOM_FILTER_OPS: ReadonlySet<CustomFilterOp> = new Set<CustomFilterOp>([
  'lessThan', 'lessThanOrEqual', 'equal', 'notEqual', 'greaterThanOrEqual', 'greaterThan',
]);

export function parseFilters (root: Element): PivotFilter[] {
  const filters: PivotFilter[] = [];
  for (const fEl of root.querySelectorAll('filters > filter')) {
    const type = parseEnum(attr(fEl, 'type'), FILTER_TYPES);
    if (type == null) { continue; }
    const filter: PivotFilter = {
      fieldIndex: numAttr(fEl, 'fld', 0),
      type,
      id: numAttr(fEl, 'id', 0),
    };
    const evalOrder = numAttr(fEl, 'evalOrder');
    if (evalOrder != null && evalOrder !== 0) { filter.evalOrder = evalOrder; }
    const mpFld = numAttr(fEl, 'mpFld');
    if (mpFld != null) { filter.mpFld = mpFld; }
    const iMeasureHier = numAttr(fEl, 'iMeasureHier');
    if (iMeasureHier != null) { filter.iMeasureHier = iMeasureHier; }
    const iMeasureFld = numAttr(fEl, 'iMeasureFld');
    if (iMeasureFld != null) { filter.iMeasureFld = iMeasureFld; }
    const name = attr(fEl, 'name');
    if (name != null) { filter.name = name; }
    const description = attr(fEl, 'description');
    if (description != null) { filter.description = description; }
    const sv1 = attr(fEl, 'stringValue1');
    if (sv1 != null) { filter.stringValue1 = sv1; }
    const sv2 = attr(fEl, 'stringValue2');
    if (sv2 != null) { filter.stringValue2 = sv2; }

    const afEl = fEl.getElementsByTagName('autoFilter')[0];
    if (afEl) {
      const af: PivotFilter['autoFilter'] = {};
      const afRef = attr(afEl, 'ref');
      if (afRef != null) { af.ref = afRef; }
      const filterColumns: PivotAutoFilterColumn[] = [];
      for (const fcEl of afEl.getElementsByTagName('filterColumn')) {
        const fc: PivotAutoFilterColumn = { colId: numAttr(fcEl, 'colId', 0) };
        const top10El = fcEl.getElementsByTagName('top10')[0];
        if (top10El) {
          fc.top10 = { val: numAttr(top10El, 'val', 0) };
          const top = boolAttr(top10El, 'top');
          if (top === false) { fc.top10.top = false; }
          const percent = boolAttr(top10El, 'percent');
          if (percent === true) { fc.top10.percent = true; }
          const filterVal = numAttr(top10El, 'filterVal');
          if (filterVal != null) { fc.top10.filterVal = filterVal; }
        }
        const customFiltersEl = fcEl.getElementsByTagName('customFilters')[0];
        if (customFiltersEl) {
          const cfItems: NonNullable<PivotAutoFilterColumn['customFilters']>['filters'] = [];
          for (const cfItemEl of customFiltersEl.getElementsByTagName('customFilter')) {
            const f: (typeof cfItems)[number] = {};
            const op = parseEnum(attr(cfItemEl, 'operator'), CUSTOM_FILTER_OPS);
            if (op != null) {
              f.operator = op;
            }
            const val = attr(cfItemEl, 'val');
            if (val != null) { f.val = val; }
            cfItems.push(f);
          }
          const cf: NonNullable<PivotAutoFilterColumn['customFilters']> = { filters: cfItems };
          if (boolAttr(customFiltersEl, 'and') === true) { cf.and = true; }
          fc.customFilters = cf;
        }
        filterColumns.push(fc);
      }
      if (filterColumns.length > 0) { af.filterColumns = filterColumns; }
      filter.autoFilter = af;
    }

    filters.push(filter);
  }
  return filters;
}
