import type { Element } from '@borgar/simple-xml';
import type { PivotPageField } from '@jsfkit/types';
import { attr, numAttr } from '../../utils/attr.ts';

export function parsePageFields (root: Element): PivotPageField[] {
  const pageFields: PivotPageField[] = [];
  for (const pf of root.querySelectorAll('pageFields > pageField')) {
    const pageField: PivotPageField = {
      fieldIndex: numAttr(pf, 'fld', 0),
    };
    const item = numAttr(pf, 'item');
    if (item != null) {
      pageField.selectedItem = item;
    }
    const pfName = attr(pf, 'name');
    if (pfName) {
      pageField.name = pfName;
    }
    const pfCaption = attr(pf, 'cap');
    if (pfCaption != null) {
      pageField.caption = pfCaption;
    }
    const pfHier = numAttr(pf, 'hier');
    if (pfHier != null) {
      pageField.hierarchy = pfHier;
    }
    pageFields.push(pageField);
  }
  return pageFields;
}
