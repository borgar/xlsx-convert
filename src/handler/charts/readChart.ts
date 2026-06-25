/*
<complexType name="CT_Chart">
  <sequence>
    <element name="title" type="CT_Title" minOccurs="0" maxOccurs="1" />
    <element name="autoTitleDeleted" type="CT_Boolean" minOccurs="0" maxOccurs="1" />
    <element name="pivotFmts" type="CT_PivotFmts" minOccurs="0" maxOccurs="1" />
    <element name="view3D" type="CT_View3D" minOccurs="0" maxOccurs="1" />
    <element name="floor" type="CT_Surface" minOccurs="0" maxOccurs="1" />
    <element name="sideWall" type="CT_Surface" minOccurs="0" maxOccurs="1" />
    <element name="backWall" type="CT_Surface" minOccurs="0" maxOccurs="1" />
    <element name="plotArea" type="CT_PlotArea" minOccurs="1" maxOccurs="1" />
    <element name="legend" type="CT_Legend" minOccurs="0" maxOccurs="1" />
    <element name="plotVisOnly" type="CT_Boolean" minOccurs="0" maxOccurs="1" />
    <element name="dispBlanksAs" type="CT_DispBlanksAs" minOccurs="0" maxOccurs="1" />
    <element name="showDLblsOverMax" type="CT_Boolean" minOccurs="0" maxOccurs="1" />
    <element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1" />
  </sequence>
</complexType>
*/

import { Element } from '@borgar/simple-xml';
import { addProp } from '../../utils/addProp.ts';
import type { ConversionContext } from '../../ConversionContext.ts';
import { readLegend } from './readLegend.ts';
import { boolValElm, strValElm } from './utils/valElm.ts';
import { readTitle } from './readTitle.ts';
import { readPlotArea, type FmtOvrsMap } from './readPlotArea.ts';
import type { Chart } from './types/Chart.ts';
import type { ChartEx } from './types/ChartEx.ts';
import type { ChartDataMap } from './readChartData.ts';

export function readChart (
  element: Element, context: ConversionContext, isChartx: true, chartDataMap?: ChartDataMap, fmtOvrsMap?: FmtOvrsMap,
): ChartEx | undefined;
export function readChart (
  element: Element, context: ConversionContext, isChartx?: false, chartDataMap?: ChartDataMap, fmtOvrsMap?: FmtOvrsMap,
): Chart | undefined;
export function readChart (
  element: Element, context: ConversionContext, isChartx: boolean, chartDataMap?: ChartDataMap, fmtOvrsMap?: FmtOvrsMap,
): Chart | ChartEx | undefined;
export function readChart (
  element: Element,
  context: ConversionContext,
  isChartx = false,
  chartDataMap?: ChartDataMap,
  fmtOvrsMap?: FmtOvrsMap,
): Chart | ChartEx | undefined {
  const out: Partial<Omit<Chart, 'type'>> & Partial<Omit<ChartEx, 'type'>> & {
    type: 'bc' | 'ex',
  } = {
    type: 'bc',
  };

  for (const child of element.children) {
    if (child.tagName === 'title') {
      addProp(out, 'title', readTitle(child, context));
    }
    else if (child.tagName === 'autoTitleDeleted') {
      addProp(out, 'autoTitleDeleted', boolValElm(child), false);
    }
    else if (child.tagName === 'pivotFmts') {
      // addProp(out, 'pivotFmts', readPivotFmts(child, context));
    }
    else if (child.tagName === 'view3D') {
      // addProp(out, 'view3D', readView3D(child, context));
    }
    else if (child.tagName === 'floor') {
      // addProp(out, 'floor', readSurface(child, context));
    }
    else if (child.tagName === 'sideWall') {
      // addProp(out, 'sideWall', readSurface(child, context));
    }
    else if (child.tagName === 'backWall') {
      // addProp(out, 'backWall', readSurface(child, context));
    }
    else if (child.tagName === 'plotArea') {
      // @ts-expect-error -- need to untangle Chart & ChartEx
      addProp(out, 'plotArea', readPlotArea(child, context, isChartx, chartDataMap, fmtOvrsMap));
    }
    else if (child.tagName === 'legend') {
      addProp(out, 'legend', readLegend(child, context));
    }
    else if (child.tagName === 'plotVisOnly') {
      addProp(out, 'plotVisOnly', boolValElm(child), false);
    }
    else if (child.tagName === 'dispBlanksAs') {
      addProp(out, 'dispBlanksAs', strValElm(child, 'gap'), 'gap');
    }
    else if (child.tagName === 'showDLblsOverMax') {
      addProp(out, 'showDLblsOverMax', boolValElm(child), false);
    }
  }

  return out as Chart | ChartEx | undefined;
}
