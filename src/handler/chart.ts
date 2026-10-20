import type { Document } from '@borgar/simple-xml';
import type { ConversionContext } from '../ConversionContext.ts';
import { numAttr } from '../utils/attr.ts';
import { boolValElm } from './charts/utils/valElm.ts';
import { addProp } from '../utils/addProp.ts';
import { readShapeProperties } from './drawings/readShapeProperties.ts';
import { readChart } from './charts/readChart.ts';
import { readChartEx } from './charts/readChartEx.ts';
import { readTextProps } from './charts/readTextProps.ts';
import type { ChartSpaceEx } from './charts/types/ChartSpaceEx.ts';
import type { ChartSpace } from './charts/types/ChartSpace.ts';

/**
 * Parse a chart part: a legacy `c:chartSpace`, or a ChartEx `cx:chartSpace` when `isChartEx` is set.
 */
export function handlerChart (dom: Document, context: ConversionContext, isChartEx: true): ChartSpaceEx;
export function handlerChart (dom: Document, context: ConversionContext, isChartEx?: false): ChartSpace;
export function handlerChart (dom: Document, context: ConversionContext, isChartEx = false): ChartSpace | ChartSpaceEx {
  if (isChartEx) {
    return readChartEx(dom.root!, context);
  }

  const chartSpace: Partial<ChartSpace> = {};
  for (const elm of dom.root!.children) {
    const { tagName } = elm;
    if (tagName === 'roundedCorners') {
      addProp(chartSpace, 'roundedCorners', boolValElm(elm), false);
    }
    else if (tagName === 'style') {
      addProp(chartSpace, 'style', numAttr(elm, 'val'));
    }
    else if (tagName === 'AlternateContent') {
      // Excel writes the style number twice: <mc:Choice Requires="c14"><c14:style val="102"/> and
      // <mc:Fallback><c:style val="2"/>. The c14 number is the plain style number plus 100.
      const fallback = elm.querySelector('Fallback > style');
      const choice = elm.querySelector('Choice > style');
      if (fallback) {
        addProp(chartSpace, 'style', numAttr(fallback, 'val'));
      }
      else if (choice) {
        addProp(chartSpace, 'style', (numAttr(choice, 'val') ?? 100) - 100);
      }
    }
    else if (tagName === 'chart') {
      const chart = readChart(elm, context);
      if (chart) { chartSpace.chart = chart; }
    }
    else if (tagName === 'spPr') {
      addProp(chartSpace, 'shape', readShapeProperties(elm, context));
    }
    else if (tagName === 'txPr') {
      addProp(chartSpace, 'textProps', readTextProps(elm, context));
    }
    // Not read: date1904 (dates use the workbook's date system), lang, clrMapOvr, pivotSource,
    // protection, externalData, printSettings, userShapes, and extLst.
  }
  return chartSpace as ChartSpace;
}
