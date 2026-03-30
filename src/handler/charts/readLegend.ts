/*

<complexType name="CT_Legend">
  <sequence>
    <element name="legendPos" type="CT_LegendPos" minOccurs="0" maxOccurs="1" />
    <element name="legendEntry" type="CT_LegendEntry" minOccurs="0" maxOccurs="unbounded" />
    <element name="layout" type="CT_Layout" minOccurs="0" maxOccurs="1" />
    <element name="overlay" type="CT_Boolean" minOccurs="0" maxOccurs="1" />
    <element name="spPr" type="a:CT_ShapeProperties" minOccurs="0" maxOccurs="1" />
    <element name="txPr" type="a:CT_TextBody" minOccurs="0" maxOccurs="1" />
    <element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1" />
  </sequence>
</complexType>

*/

import type { Element } from '@borgar/simple-xml';
import type { ConversionContext } from '../../ConversionContext.ts';
import { boolValElm, strValElm } from './utils/valElm.ts';
import { addProp } from '../../utils/addProp.ts';
import { readShapeProperties } from '../drawings/readShapeProperties.ts';
import type { Legend } from './types/legend/Legend.ts';
import { readTextProps } from './readTextProps.ts';

/**
 *
 */
export function readLegend (element: Element, context: ConversionContext): Legend | undefined {
  const out: Legend = {};

  for (const child of element.children) {
    if (child.tagName === 'legendPos') {
      addProp(out, 'legendPos', strValElm(child, 'r'), 'r');
    }
    else if (child.tagName === 'legendEntry') {
      const legendEntry_ = element.querySelectorAll('>legendEntry');
      if (legendEntry_.length) {
        // out.legendEntry = legendEntry_.map(child => readLegendEntry(child, context));
      }
    }
    else if (child.tagName === 'layout') {
      // addProp(out, 'layout', readLayout(child, context));
    }
    else if (child.tagName === 'overlay') {
      // true when omitted: false means thing may not overlap the chart
      addProp(out, 'overlay', boolValElm(child, true), true);
    }
    else if (child.tagName === 'spPr') {
      addProp(out, 'shape', readShapeProperties(child, context));
    }
    else if (child.tagName === 'txPr') {
      addProp(out, 'textProps', readTextProps(child));
    }
  }

  return out;
}
