import type { Element } from '@borgar/simple-xml';
import type { PivotTableStyle, PivotTableStyleName } from '@jsfkit/types';
import { attr, boolAttr } from '../../utils/attr.ts';

// NB: readBoolAttrs can't be used here because the OOXML attribute names
// (showColHeaders, showColStripes) differ from the JSF property names
// (showColumnHeaders, showColumnStripes).
export function parseStyle (root: Element): PivotTableStyle | undefined {
  const styleInfo = root.getElementsByTagName('pivotTableStyleInfo')[0];
  if (!styleInfo) { return; }
  const style: PivotTableStyle = {};
  const styleName = attr(styleInfo, 'name');
  if (styleName) {
    // Cast is intentional: Excel allows user-defined custom pivot styles whose
    // names aren't in the PivotTableStyleName union. We preserve whatever name
    // the file contains rather than validating against the built-in list.
    style.name = styleName as PivotTableStyleName;
  }
  const showRowHeaders = boolAttr(styleInfo, 'showRowHeaders');
  if (showRowHeaders != null) {
    style.showRowHeaders = showRowHeaders;
  }
  const showColHeaders = boolAttr(styleInfo, 'showColHeaders');
  if (showColHeaders != null) {
    style.showColumnHeaders = showColHeaders;
  }
  const showRowStripes = boolAttr(styleInfo, 'showRowStripes');
  if (showRowStripes != null) {
    style.showRowStripes = showRowStripes;
  }
  const showColStripes = boolAttr(styleInfo, 'showColStripes');
  if (showColStripes != null) {
    style.showColumnStripes = showColStripes;
  }
  const showLastColumn = boolAttr(styleInfo, 'showLastColumn');
  if (showLastColumn != null) {
    style.showLastColumn = showLastColumn;
  }
  return style;
}
