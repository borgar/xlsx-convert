import { Element } from '@borgar/simple-xml';
import type { ConversionContext } from '../../ConversionContext.ts';
import type { DLbls } from './types/datalabels/DLbls.ts';
import type { DLblShared } from './types/datalabels/DLblShared.ts';
import type { DLbl } from './types/datalabels/DLbl.ts';
import { boolValElm, numValElm, strValElm } from './utils/valElm.ts';
import { readShapeProperties } from '../drawings/readShapeProperties.ts';
import { addProp } from '../../utils/addProp.ts';
import { readNumFmt } from './readNumFmt.ts';
import { readTextProps } from './readTextProps.ts';
import { readText } from './readText.ts';
import type { DLblPos } from './types/datalabels/DLblPos.ts';
import { getFirstChild } from '../../utils/getFirstChild.ts';
import { readLayout } from './readLayout.ts';

function readDLblShared (element: Element, context: ConversionContext): DLblShared {
  const label: DLblShared = {};
  for (const child of element.children) {
    if (child.tagName === 'numFmt') {
      addProp(label, 'numFmt', readNumFmt(child));
    }
    else if (child.tagName === 'spPr') {
      addProp(label, 'shape', readShapeProperties(child, context));
    }
    else if (child.tagName === 'txPr') {
      addProp(label, 'textProps', readTextProps(child, context));
    }
    else if (child.tagName === 'dLblPos') {
      addProp(label, 'dLblPos', strValElm<DLblPos>(child));
    }
    else if (child.tagName === 'showLegendKey') {
      addProp(label, 'showLegendKey', boolValElm(child), false);
    }
    else if (child.tagName === 'showVal') {
      addProp(label, 'showVal', boolValElm(child), false);
    }
    else if (child.tagName === 'showCatName') {
      addProp(label, 'showCatName', boolValElm(child), false);
    }
    else if (child.tagName === 'showSerName') {
      addProp(label, 'showSerName', boolValElm(child), false);
    }
    else if (child.tagName === 'showPercent') {
      addProp(label, 'showPercent', boolValElm(child), false);
    }
    else if (child.tagName === 'showBubbleSize') {
      addProp(label, 'showBubbleSize', boolValElm(child), false);
    }
    else if (child.tagName === 'separator') {
      label.separator = child.textContent;
    }
  }
  return label;
}

function readDLbl (element: Element, context: ConversionContext): DLbl | undefined {
  const label: Partial<DLbl> = {};

  for (const child of element.children) {
    if (child.tagName === 'idx') {
      addProp(label, 'idx', numValElm(child));
    }
    else if (child.tagName === 'delete') {
      label.delete = boolValElm(child);
    }
    else if (child.tagName === 'layout') {
      addProp(label, 'layout', readLayout(child));
    }
    else if (child.tagName === 'tx') {
      addProp(label, 'text', readText(child));
    }
  }

  if (label.idx != null) {
    const sh = readDLblShared(element, context);
    if (sh) { Object.assign(label, sh); }

    return label as DLbl;
  }
}

export function readDLbls (element: Element, context: ConversionContext): DLbls {
  const labels: DLbls = {};

  for (const child of element.children) {
    if (child.tagName === 'dLbl') {
      const lbl = readDLbl(child, context);
      if (lbl) {
        if (!labels.dLbl) { labels.dLbl = []; }
        labels.dLbl.push(lbl);
      }
    }
    else if (child.tagName === 'delete') {
      addProp(labels, 'delete', boolValElm(child));
    }
    else if (child.tagName === 'showLeaderLines') {
      addProp(labels, 'showLeaderLines', boolValElm(child));
    }
    else if (child.tagName === 'leaderLines') { // TODO: ChartLines
      const spPr = getFirstChild(child, 'spPr');
      const shape = spPr && readShapeProperties(spPr, context);
      if (shape) {
        labels.leaderLines = { shape };
      }
    }
  }

  const sh = readDLblShared(element, context);
  if (sh) { Object.assign(labels, sh); }

  return labels;
}
