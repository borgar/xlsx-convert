import { Element, type Document } from '@borgar/simple-xml';
import { attr, boolAttr, numAttr } from '../utils/attr.ts';
import { handlerCell } from './cell.ts';
import { normalizeFormula } from '../utils/normalizeFormula.ts';
import { ConversionContext } from '../ConversionContext.ts';
import type { Rel } from './rels.ts';
import type { External, ExternalDefinedName } from '@jsfkit/types';
import { fromA1 } from '../utils/fromA1.ts';
import { toA1 } from '../utils/toA1.ts';

const NO_EXTERNALS = { externalLinks: [] };

export function handlerExternal (dom: Document, fileName: string = '', rels: Rel[] = []): External {
  const external: External = {
    name: fileName,
    sheets: [],
    names: [],
  };

  // read sheet names
  dom.querySelectorAll('sheetNames > sheetName')
    .forEach(sheetName => {
      external.sheets.push({
        name: attr(sheetName, 'val'),
        cells: {},
      });
    });

  // Read alternate URLs from the `<xxl21:alternateUrls>` extension element
  // (simple-xml strips the prefix so we query by the local name). Each child
  // carries an `r:id` that resolves against the external-link part's rels:
  // the rel's Target is the URL. Both children are optional per the schema;
  // we preserve whichever are present.
  //
  // The element itself also carries opaque `driveId` and `itemId` attributes
  // on OneDrive/SharePoint-sourced links that Excel uses to reach the same
  // document via the Graph API. We round-trip those verbatim.
  const altUrlsEl = dom.querySelectorAll('externalBook > alternateUrls')[0];
  if (altUrlsEl) {
    const alternateUrls: NonNullable<External['alternateUrls']> = {};
    const absEl = altUrlsEl.querySelectorAll('absoluteUrl')[0];
    if (absEl) {
      const relId = attr(absEl, 'r:id');
      const target = relId ? rels.find(r => r.id === relId)?.target : undefined;
      if (target) {
        alternateUrls.absoluteUrl = target;
      }
    }
    const relEl = altUrlsEl.querySelectorAll('relativeUrl')[0];
    if (relEl) {
      const relId = attr(relEl, 'r:id');
      const target = relId ? rels.find(r => r.id === relId)?.target : undefined;
      if (target) {
        alternateUrls.relativeUrl = target;
      }
    }
    const driveId = attr(altUrlsEl, 'driveId');
    if (driveId) {
      alternateUrls.driveId = driveId;
    }
    const itemId = attr(altUrlsEl, 'itemId');
    if (itemId) {
      alternateUrls.itemId = itemId;
    }
    if (Object.keys(alternateUrls).length > 0) {
      external.alternateUrls = alternateUrls;
    }
  }

  // read cells and their values
  //
  // A sheet named in `<sheetNames>` but missing from `<sheetDataSet>` is distinct
  // from one with an empty `<sheetData sheetId="N"/>`; track which sheetIds
  // actually had a `<sheetData>` element so the emitter can tell them apart
  // when round-tripping.
  const sheetDataSeen = new Set<number>();
  const dummyContext = new ConversionContext();
  dom.querySelectorAll('sheetDataSet > sheetData')
    .forEach(sheetData => {
      const sheetIndex = numAttr(sheetData, 'sheetId', 0);
      sheetDataSeen.add(sheetIndex);
      if (boolAttr(sheetData, 'refreshError')) {
        external.sheets[sheetIndex].refreshError = true;
      }
      const externalCells = external.sheets[sheetIndex].cells;
      let lastR = 0;
      for (const row of sheetData.childNodes) {
        if (row instanceof Element && row.tagName === 'row') {
          let lastId = '';
          const r = numAttr(row, 'r', lastR + 1);
          for (const cell of row.childNodes) {
            if (cell instanceof Element && cell.tagName === 'cell') {
              let id = attr(cell, 'r');
              if (!id) {
                const cellPos = fromA1(lastId ?? 'A' + r)!;
                id = toA1((cellPos.left || 0) + 1, cellPos.top || 0);
              }
              // External sheetData carries the cached values the host workbook
              // consumed; an empty `<cell r="X"/>` still signals "this cell was
              // in the captured range" and we preserve it as an empty object
              // rather than dropping it the way `handlerCell` does for host
              // worksheet cells.
              const c = handlerCell(cell, id, dummyContext) ?? {};
              if (id) {
                externalCells[id] = c;
              }
              lastId = id;
            }
          }
          lastR = r;
        }
      }
    });
  external.sheets.forEach((sheet, idx) => {
    if (!sheetDataSeen.has(idx)) {
      sheet.noSheetData = true;
    }
  });

  // read defined names
  dom.querySelectorAll('definedNames > definedName')
    .forEach(definedName => {
      const nameDef: ExternalDefinedName = {
        name: attr(definedName, 'name'),
      };
      const expr = attr(definedName, 'refersTo');
      if (expr) {
        nameDef.value = normalizeFormula(expr, NO_EXTERNALS);
      }
      external.names.push(nameDef);
    });

  return external;
}
