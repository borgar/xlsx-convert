import type { Element } from '@borgar/simple-xml';
import type { PivotAutoFilterColumn, PivotCustomFilterCriterion, PivotFilter, PivotFilterType } from '@jsfkit/types';
import { addProp } from '../../utils/addProp.ts';
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
    addProp(filter, 'evalOrder', numAttr(fEl, 'evalOrder'), 0);
    addProp(filter, 'mpFld', numAttr(fEl, 'mpFld'));
    addProp(filter, 'iMeasureHier', numAttr(fEl, 'iMeasureHier'));
    addProp(filter, 'iMeasureFld', numAttr(fEl, 'iMeasureFld'));
    addProp(filter, 'name', attr(fEl, 'name'));
    addProp(filter, 'description', attr(fEl, 'description'));
    addProp(filter, 'stringValue1', attr(fEl, 'stringValue1'));
    addProp(filter, 'stringValue2', attr(fEl, 'stringValue2'));

    const afEl = fEl.querySelector('autoFilter');
    if (afEl) {
      const af: PivotFilter['autoFilter'] = {};
      addProp(af, 'ref', attr(afEl, 'ref'));
      const filterColumns: PivotAutoFilterColumn[] = [];
      for (const fcEl of afEl.getElementsByTagName('filterColumn')) {
        const fc: PivotAutoFilterColumn = { colId: numAttr(fcEl, 'colId', 0) };
        const top10El = fcEl.querySelector('top10');
        if (top10El) {
          fc.top10 = { val: numAttr(top10El, 'val', 0) };
          const top = boolAttr(top10El, 'top');
          if (top === false) { fc.top10.top = false; }
          const percent = boolAttr(top10El, 'percent');
          if (percent === true) { fc.top10.percent = true; }
          addProp(fc.top10, 'filterVal', numAttr(top10El, 'filterVal'));
        }
        const customFiltersEl = fcEl.querySelector('customFilters');
        if (customFiltersEl) {
          const cfItems: NonNullable<PivotAutoFilterColumn['customFilters']>['filters'] = [];
          for (const cfItemEl of customFiltersEl.getElementsByTagName('customFilter')) {
            const f: (typeof cfItems)[number] = {};
            addProp(f, 'operator', parseEnum(attr(cfItemEl, 'operator'), CUSTOM_FILTER_OPS));
            addProp(f, 'val', attr(cfItemEl, 'val'));
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
