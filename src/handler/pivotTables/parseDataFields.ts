import type { Element } from '@borgar/simple-xml';
import type { PivotDataField, PivotDataFieldAggregation, PivotShowDataAs } from '@jsfkit/types';
import { attr, numAttr } from '../../utils/attr.ts';
import { parseEnum } from '../../utils/parseEnum.ts';
import type { NumFmtLookup } from './NumFmtLookup.ts';

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
    const dfName = attr(df, 'name');
    const dataField: PivotDataField = {
      ...(dfName != null ? { name: dfName } : {}),
      fieldIndex: numAttr(df, 'fld', 0),
    };
    const subtotal = parseEnum(attr(df, 'subtotal'), DATA_FIELD_AGGREGATIONS);
    if (subtotal != null) {
      dataField.subtotal = subtotal;
    }
    const showDataAs = parseEnum(attr(df, 'showDataAs'), SHOW_DATA_AS_VALUES);
    if (showDataAs != null) {
      dataField.showDataAs = showDataAs;
    }
    const baseField = numAttr(df, 'baseField');
    if (baseField != null) {
      dataField.baseField = baseField;
    }
    const baseItem = numAttr(df, 'baseItem');
    if (baseItem != null) {
      dataField.baseItem = baseItem;
    }
    const dfNumFmtId = numAttr(df, 'numFmtId');
    if (dfNumFmtId != null && numFmts) {
      const fmt = numFmts[dfNumFmtId];
      if (typeof fmt === 'string' && fmt.toLowerCase() !== 'general') {
        dataField.numFmt = fmt;
      }
    }
    dataFields.push(dataField);
  }
  return dataFields;
}
