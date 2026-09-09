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

// `dataField/@subtotal` is ST_DataConsolidateFunction, which spells the population variants
// with a lowercase trailing `p`. JSF spells them `stdDevP`/`varP`, the spelling ST_ItemType
// uses and which `subtotalFunctions` keeps. Every other token is identical either side, so
// only those two are mapped. Keys are the OOXML tokens: `stdDevP` and `varP` are not legal
// here, and are rejected like any other unknown value.
const DATA_FIELD_AGGREGATIONS: Readonly<Record<string, PivotDataFieldAggregation>> = {
  average: 'average',
  count: 'count',
  countNums: 'countNums',
  max: 'max',
  min: 'min',
  product: 'product',
  stdDev: 'stdDev',
  stdDevp: 'stdDevP',
  sum: 'sum',
  var: 'var',
  varp: 'varP',
};

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

function mapDataFieldAggregation (value: string | null): PivotDataFieldAggregation | undefined {
  if (value == null) {
    return undefined;
  }
  return Object.hasOwn(DATA_FIELD_AGGREGATIONS, value) ? DATA_FIELD_AGGREGATIONS[value] : undefined;
}

export function parseDataFields (root: Element, numFmts?: NumFmtLookup): PivotDataField[] {
  const dataFields: PivotDataField[] = [];
  for (const df of root.querySelectorAll('dataFields > dataField')) {
    const dataField: PivotDataField = {
      fieldIndex: numAttr(df, 'fld', 0),
    };
    addProp(dataField, 'name', attr(df, 'name'));
    addProp(dataField, 'subtotal', mapDataFieldAggregation(attr(df, 'subtotal')));
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
