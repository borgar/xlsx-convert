import { Document } from '@borgar/simple-xml';
import { ConversionContext } from '../ConversionContext.ts';
import { attr, boolAttr, numAttr } from '../utils/attr.ts';
import { normalizeFormula } from '../utils/normalizeFormula.ts';
import { toInt } from '../utils/typecast.ts';
import type { DefinedName, Workbook, WorkbookView } from '@jsfkit/types';

function isSafeInt (n: number | null | undefined): n is number {
  return Number.isSafeInteger(n);
}

const HIDDEN: Record<string, 0 | 1 | 2> = {
  visible: 0,
  hidden: 1,
  veryHidden: 2,
};

export function handlerWorkbook (dom: Document, context: ConversionContext): Workbook {
  const wb: Workbook = {
    name: context.filename,
    sheets: [],
    names: [],
    // charts: [],
    calculationProperties: {
      iterate: false,
      iterateCount: 100,
      iterateDelta: 0.001,
      epoch: 1900,
    },
    styles: [],
    tables: [],
    // externals: [],
  };

  dom.querySelectorAll('sheets > sheet')
    .forEach(d => {
      context.sheetLinks.push({
        name: attr(d, 'name'),
        index: numAttr(d, 'sheetId'),
        rId: attr(d, 'r:id'),
        hidden: HIDDEN[attr(d, 'state', 'visible')] ?? 0,
      });
    });

  // FIXME: discard names that appear twice
  dom.getElementsByTagName('definedName')
    .forEach(d => {
      const name: DefinedName = {
        name: attr(d, 'name'),
        value: normalizeFormula(d.textContent, context),
      };
      const hidden = boolAttr(d, 'hidden');
      context.nameDefs.set(name.name, name);
      if (hidden) {
        return;
      }
      const localSheetId = attr(d, 'localSheetId');
      if (localSheetId) {
        name.scope = context.sheetLinks[+localSheetId].name;
      }
      wb.names!.push(name);
    });

  const pr = dom.querySelectorAll('workbook > workbookPr')[0];
  const epoch = (pr && numAttr(pr, 'date1904')) ? 1904 : 1900;

  // if theme is missing later, we can use this to determine which defaults to use
  context.defaultThemeVersion = pr?.getAttribute('defaultThemeVersion') || '0';

  const calcPr = dom.getElementsByTagName('calcPr')[0];
  if (calcPr) {
    if (boolAttr(calcPr, 'iterate')) {
      wb.calculationProperties = {
        iterate: true,
        iterateCount: toInt(numAttr(calcPr, 'iterateCount', 100)),
        iterateDelta: numAttr(calcPr, 'iterateDelta', 0.001),
        epoch: epoch,
      };
    }
    const calcMode = attr(calcPr, 'calcMode');
    if (calcMode === 'autoNoTable' || calcMode === 'manual') {
      wb.calculationProperties!.calcMode = calcMode;
    }
    // ECMA-376 §18.2.2: `fullCalcOnLoad` is the writer's request to recalc on load;
    // `forceFullCalc` is the same prescriptive signal (Excel sets it after a calc-engine version
    // bump, distinct from fullCalcOnLoad). Either translates to the same consumer action, so
    // collapse both onto the JSF's single `fullCalcOnLoad` flag.
    if (boolAttr(calcPr, 'fullCalcOnLoad') || boolAttr(calcPr, 'forceFullCalc')) {
      wb.calculationProperties!.fullCalcOnLoad = true;
    }
  }

  wb.calculationProperties!.epoch = epoch;

  // Store "active sheet" (the last-used sheet at save) for each workbook view. Excel supports
  // multiple workbook views (window arrangements), though most files only have one.
  const workbookViews = dom.querySelectorAll('bookViews > workbookView');
  const views: WorkbookView[] = workbookViews.map(view => {
    const activeSheet = toInt(numAttr(view, 'activeTab'));
    if (isSafeInt(activeSheet) && activeSheet >= 0) {
      return { activeSheet };
    }
    else {
      return {};
    }
  });
  // Workbook views can store many settings, but we only extract `activeTab` currently. This means
  // we may produce views with no useful data (empty objects). We still store the array so that the
  // indices continue to align with worksheet view references.
  if (views.length) {
    wb.views = views;
  }

  return wb;
}
