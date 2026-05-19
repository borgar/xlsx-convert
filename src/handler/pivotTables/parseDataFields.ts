import type { Element } from '@borgar/simple-xml';
import type { PivotDataField, PivotDataFieldAggregation, PivotShowDataAs } from '@jsfkit/types';
import { addProp } from '../../utils/addProp.ts';
import { attr, numAttr } from '../../utils/attr.ts';
import { parseEnum } from '../../utils/parseEnum.ts';
import type { NumFmtLookup } from './NumFmtLookup.ts';
import { resolveNumFmt } from './resolveNumFmt.ts';

const DATA_FIELD_AGGREGATIONS: ReadonlySet<PivotDataFieldAggregation> =
  new Set<PivotDataFieldAggregation>([
    'average',
    'count',
    'countNums',
    'max',
    'min',
    'product',
    'stdDev',
    'stdDevP',
    'sum',
    'var',
    'varP',
  ]);

const SHOW_DATA_AS_VALUES: ReadonlySet<PivotShowDataAs> =
  new Set<PivotShowDataAs>([
    'normal',
    'difference',
    'percent',
    'percentDiff',
    'runTotal',
    'percentOfRow',
    'percentOfCol',
    'percentOfTotal',
    'index',
    'percentOfParentRow',
    'percentOfParentCol',
    'percentOfParent',
    'percentOfRunningTotal',
    'rankAscending',
    'rankDescending',
  ]);

export function parseDataFields (root: Element, numFmts?: NumFmtLookup): PivotDataField[] {
  const dataFields: PivotDataField[] = [];
  for (const df of root.querySelectorAll('dataFields > dataField')) {
    const dataField: PivotDataField = {
      fieldIndex: numAttr(df, 'fld', 0),
    };
    addProp(dataField, 'name', attr(df, 'name'));
    addProp(dataField, 'subtotal', parseEnum(attr(df, 'subtotal'), DATA_FIELD_AGGREGATIONS));
    addProp(dataField, 'showDataAs', parseEnum(attr(df, 'showDataAs'), SHOW_DATA_AS_VALUES));
    // `baseField` and `baseItem` default to `0` per OOXML; Excel always
    // emits them explicitly (even when 0) on the dataField. Elide the
    // default in the parsed JSF so it stays canonically minimal, and so
    // it round-trips cleanly through emitters that also emit the
    // explicit defaults (e.g. jsf2xlsx writes `baseField="0"` /
    // `baseItem="0"` unconditionally).
    addProp(dataField, 'baseField', numAttr(df, 'baseField'), 0);
    addProp(dataField, 'baseItem', numAttr(df, 'baseItem'), 0);
    addProp(dataField, 'numFmt', resolveNumFmt(df, numFmts));
    dataFields.push(dataField);
  }
  return dataFields;
}
