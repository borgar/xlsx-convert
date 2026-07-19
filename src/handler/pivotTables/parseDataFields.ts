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

// URI of the x14 dataField extension (CT_X14DataField, MS-XLSX). Excel strips
// the post-2010 `showDataAs` modes from the main `dataField/@showDataAs`
// attribute and stores them here instead, as `pivotShowAs`.
const X14_DATA_FIELD_EXT_URI = '{E15A36E0-9728-4e99-A89B-3F7291B0FE68}';

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

/**
 * Read the post-2010 `showDataAs` mode from a `<dataField>`'s x14 extension.
 *
 * The mode is carried as `pivotShowAs` on the `<x14:dataField>` child of the
 * `<ext>` keyed by {@link X14_DATA_FIELD_EXT_URI} inside the field's `<extLst>`.
 * Returns `undefined` when the extension is absent or its value is unknown, so
 * callers fall back to the main `@showDataAs` attribute.
 */
function parsePivotShowAs (df: Element): PivotShowDataAs | undefined {
  const ext = df
    .getElementsByTagName('extLst')[0]
    ?.children.find(e => e.getAttribute('uri') === X14_DATA_FIELD_EXT_URI);
  const x14 = ext?.children[0];
  if (!x14) {
    return undefined;
  }
  return parseEnum(attr(x14, 'pivotShowAs'), SHOW_DATA_AS_VALUES);
}

export function parseDataFields (root: Element, numFmts?: NumFmtLookup): PivotDataField[] {
  const dataFields: PivotDataField[] = [];
  for (const df of root.querySelectorAll('dataFields > dataField')) {
    const dataField: PivotDataField = {
      fieldIndex: numAttr(df, 'fld', 0),
    };
    addProp(dataField, 'name', attr(df, 'name'));
    addProp(dataField, 'subtotal', parseEnum(attr(df, 'subtotal'), DATA_FIELD_AGGREGATIONS));
    // Post-2010 `showDataAs` modes (`percentOfParent*`, `percentOfRunningTotal`,
    // `rank*`) are not legal values of the main `@showDataAs` attribute; Excel
    // carries them in the x14 dataField extension as `pivotShowAs`. When present,
    // the extension value wins; otherwise fall back to the main attribute (which
    // still holds the pre-2010 modes). The associated `baseField`/`baseItem` stay
    // on the main attributes and are read below regardless of mode.
    const showDataAs =
      parsePivotShowAs(df) ?? parseEnum(attr(df, 'showDataAs'), SHOW_DATA_AS_VALUES);
    addProp(dataField, 'showDataAs', showDataAs);
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
