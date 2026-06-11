import type { Element } from '@borgar/simple-xml';
import type { PivotFormat, Style } from '@jsfkit/types';
import { attr, numAttr } from '../../utils/attr.ts';
import { parsePivotArea } from './parsePivotArea.ts';

/**
 * Parse `<format>` records into PivotFormats. Resolve each record's `dxfId` against the styles
 * part's dxf table into an inline JSF Style. JSF has no dxf table; the differential style lives
 * on the format itself.
 */
export function parseFormats (root: Element, dxfStyles?: readonly Style[]): PivotFormat[] {
  const formats: PivotFormat[] = [];
  for (const fmtEl of root.querySelectorAll('formats > format')) {
    const pivotAreaEl = fmtEl.querySelector('pivotArea');
    const fmt: PivotFormat = {
      pivotArea: pivotAreaEl ? parsePivotArea(pivotAreaEl) : {},
    };
    if (attr(fmtEl, 'action') === 'blank') {
      fmt.action = 'blank';
    }
    else {
      const dxfId = numAttr(fmtEl, 'dxfId');
      const style = dxfId != null ? dxfStyles?.[dxfId] : undefined;
      if (style != null && Object.keys(style).length > 0) {
        fmt.style = style;
      }
    }
    formats.push(fmt);
  }
  return formats;
}
