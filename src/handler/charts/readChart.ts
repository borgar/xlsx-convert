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
import { readPivotFmts } from './readPivotFmts.ts';
import { readSurface, readView3D } from './read3d.ts';
import { readPlotArea } from './readPlotArea.ts';
import type { Chart } from './types/Chart.ts';

export function readChart (element: Element, context: ConversionContext): Chart | undefined {
  const out: Partial<Chart> = {};

  for (const child of element.children) {
    if (child.tagName === 'title') {
      // c:autoTitleDeleted isn't read: Excel writes it set only when there's no c:title, so a
      // missing title says the same thing.
      addProp(out, 'title', readTitle(child, context));
    }
    else if (child.tagName === 'pivotFmts') {
      addProp(out, 'pivotFmts', readPivotFmts(child, context));
    }
    else if (child.tagName === 'view3D') {
      addProp(out, 'view3D', readView3D(child));
    }
    else if (child.tagName === 'floor') {
      addProp(out, 'floor', readSurface(child, context));
    }
    else if (child.tagName === 'sideWall') {
      addProp(out, 'sideWall', readSurface(child, context));
    }
    else if (child.tagName === 'backWall') {
      addProp(out, 'backWall', readSurface(child, context));
    }
    else if (child.tagName === 'plotArea') {
      addProp(out, 'plotArea', readPlotArea(child, context));
    }
    else if (child.tagName === 'legend') {
      addProp(out, 'legend', readLegend(child, context));
    }
    else if (child.tagName === 'plotVisOnly') {
      // Keep explicit values: `false` means data in hidden cells is plotted.
      addProp(out, 'plotVisOnly', boolValElm(child));
    }
    else if (child.tagName === 'dispBlanksAs') {
      // Keeping an explicit "gap": presence matters. The ECMA-376 default for an ABSENT
      // dispBlanksAs element is "zero" (legacy charts omit it and Excel plots blanks at 0),
      // while modern Excel writes "gap" explicitly and suppressing it would erase the distinction.
      addProp(out, 'dispBlanksAs', strValElm(child, 'gap'));
    }
    else if (child.tagName === 'showDLblsOverMax') {
      addProp(out, 'showDLblsOverMax', boolValElm(child), false);
    }
    else if (child.tagName === 'extLst') {
      // Excel 2016+: <c16r3:dataDisplayOptions16><c16r3:dispNaAsBlank val="1"/>
      const naAsBlank = child.querySelector('dataDisplayOptions16 > dispNaAsBlank');
      if (naAsBlank) {
        addProp(out, 'dispNaAsBlank', boolValElm(naAsBlank));
      }
    }
  }

  return out as Chart;
}
