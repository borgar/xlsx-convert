import type { Element } from '@borgar/simple-xml';
import type { PivotDataField, PivotDataFieldAggregation, PivotShowDataAs } from '@jsfkit/types';
import { addProp } from '../../utils/addProp.ts';
import { attr, numAttr } from '../../utils/attr.ts';
import { parseEnum } from '../../utils/parseEnum.ts';
import type { NumFmtLookup } from './NumFmtLookup.ts';
import { resolveNumFmt } from './resolveNumFmt.ts';

// OOXML default for `dataField/@baseItem` (CT_DataField): the "(not set)"
// sentinel. Distinct from `0`, which selects the first base item.
const BASE_ITEM_DEFAULT = 1048832;

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
    // JSF stores non-default values; defaults are implicit. `baseField`
    // defaults to `0` per OOXML, so the explicit `0` Excel emits is elided.
    // `baseItem` defaults to `1048832` (the "(not set)" sentinel), NOT `0` ---
    // `baseItem="0"` means "relative to the first item" and is significant for
    // the base-item-relative `showDataAs` modes (difference/percent/percentDiff),
    // so it must be preserved; only the sentinel default is elided.
    addProp(dataField, 'baseField', numAttr(df, 'baseField'), 0);
    addProp(dataField, 'baseItem', numAttr(df, 'baseItem'), BASE_ITEM_DEFAULT);
    addProp(dataField, 'numFmt', resolveNumFmt(df, numFmts));
    dataFields.push(dataField);
  }
  return dataFields;
}
