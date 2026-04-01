import { Element } from '@borgar/simple-xml';
import type { ConversionContext } from '../../ConversionContext.ts';
import type { ChartData } from './types/dataEx/ChartData.ts';

/**
 *
 */
export function readChartData (element: Element, context: ConversionContext): ChartData | undefined {
  const out: ChartData = {};

  for (const child of element.children) {
    // if (child.tagName === 'title') {
    //   addProp(out, 'title', readTitle(child, context));
    // }
    // else if (child.tagName === 'autoTitleDeleted') {
    //   addProp(out, 'autoTitleDeleted', boolValElm(child), false);
    // }
    // else if (child.tagName === 'pivotFmts') {
    //   // addProp(out, 'pivotFmts', readPivotFmts(child, context));
    // }
    // else if (child.tagName === 'view3D') {
    //   // addProp(out, 'view3D', readView3D(child, context));
    // }
    // else if (child.tagName === 'floor') {
    //   // addProp(out, 'floor', readSurface(child, context));
    // }
    // else if (child.tagName === 'sideWall') {
    //   // addProp(out, 'sideWall', readSurface(child, context));
    // }
    // else if (child.tagName === 'backWall') {
    //   // addProp(out, 'backWall', readSurface(child, context));
    // }
    // else if (child.tagName === 'plotArea') {
    //   addProp(out, 'plotArea', readPlotArea(child, context, isChartx));
    // }
    // else if (child.tagName === 'legend') {
    //   addProp(out, 'legend', readLegend(child, context));
    // }
    // else if (child.tagName === 'plotVisOnly') {
    //   addProp(out, 'plotVisOnly', boolValElm(child), false);
    // }
    // else if (child.tagName === 'dispBlanksAs') {
    //   addProp(out, 'dispBlanksAs', strValElm(child, 'zero'), 'zero');
    // }
    // else if (child.tagName === 'showDLblsOverMax') {
    //   addProp(out, 'showDLblsOverMax', boolValElm(child), false);
    // }
  }

  return out;
}
