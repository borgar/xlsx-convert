import type { Element } from '@borgar/simple-xml';
import type { PivotTable } from '@jsfkit/types';
import { boolAttr } from '../../utils/attr.ts';

// URI of the x14 pivotTableDefinition extension (the 2009/9 SpreadsheetML
// extension that carries post-2007 pivot attributes such as `hideValuesRow`).
const X14_PIVOT_TABLE_DEFINITION_URI = '{962EF5D1-5CA2-4c93-8EF4-DBF5C05439D2}';

/**
 * Parse the `x14:pivotTableDefinition` extension from a pivot table's `<extLst>` into the
 * JSF model. The extension lives in an `<ext>` keyed by {@link X14_PIVOT_TABLE_DEFINITION_URI}
 * and carries pivot attributes that postdate the original CT_pivotTableDefinition schema.
 *
 * Only `hideValuesRow` is read for now. Other x14 pivot attributes
 * (`calculatedMembersInFilters`, the deferred conditional-format containers, etc.) have no JSF
 * representation yet; add them here once the model gains the corresponding properties.
 *
 * Returns a partial set of PivotTable properties to merge onto the table, or `undefined` when
 * the extension is absent or carries nothing we model.
 */
export function parseExtensions (root: Element): Partial<PivotTable> | undefined {
  // The element name `pivotTableDefinition` collides with the root, so scope to the ext URI
  // first and read the (single) child rather than searching by tag name.
  const ext = root
    .getElementsByTagName('extLst')[0]
    ?.children.find(e => e.getAttribute('uri') === X14_PIVOT_TABLE_DEFINITION_URI);
  const x14 = ext?.children[0];

  const hideValuesRow = x14 && boolAttr(x14, 'hideValuesRow');
  // OOXML default is false; only convey the non-default value.
  if (hideValuesRow) {
    return { hideValuesRow: true };
  }
}
