import type { Element } from '@borgar/simple-xml';
import type { PivotFormat } from '@jsfkit/types';
import { attr, numAttr } from '../../utils/attr.ts';
import { parsePivotArea } from './parsePivotArea.ts';

/**
 * Parse `<format>` records into PivotFormats. Each record's `dxfId` becomes the format's
 * `diffStyleId`, an index into the workbook's shared differential-style table
 * (`Workbook.diffStyles`, 1:1 with the styles part's `<dxfs>` table). The differential style
 * itself is not inlined here, and the dxf is not resolved per-converter; only the index is carried.
 *
 * `diffStyleId` is set whenever a non-blank record carries a `dxfId` — even if the referenced dxf
 * is empty, since that entry still exists in the shared table and preserving the index keeps the
 * round trip faithful. Blank-action records and records without a `dxfId` get no `diffStyleId`.
 */
export function parseFormats (root: Element): PivotFormat[] {
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
      if (dxfId != null) {
        fmt.diffStyleId = dxfId;
      }
    }
    formats.push(fmt);
  }
  return formats;
}
