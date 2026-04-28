/*

<complexType name="CT_Title">
  <sequence>
    <element name="tx" type="CT_Tx" minOccurs="0" maxOccurs="1" />
    <element name="layout" type="CT_Layout" minOccurs="0" maxOccurs="1" />
    <element name="overlay" type="CT_Boolean" minOccurs="0" maxOccurs="1" />
    <element name="spPr" type="a:CT_ShapeProperties" minOccurs="0" maxOccurs="1" />
    <element name="txPr" type="a:CT_TextBody" minOccurs="0" maxOccurs="1" />
    <element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1" />
  </sequence>
</complexType>

*/

import type { Element } from '@borgar/simple-xml';
import type { CT_Title } from './types/CT_Title.ts';
import type { ConversionContext } from '../../ConversionContext.ts';
import { boolValElm } from './utils/valElm.ts';
import { addProp } from '../../utils/addProp.ts';
import { readShapeProperties } from '../drawings/readShapeProperties.ts';

/**
 *
 */
export function readTitle (element: Element, context: ConversionContext): CT_Title | undefined {
  const out: CT_Title = {};

  for (const child of element.children) {
    if (child.tagName === 'tx') {
      // addProp(out, 'tx', readTx(child, context));
      // console.log(child.toString());
    }
    else if (child.tagName === 'txPr') {
      // addProp(out, 'txPr', readTextBody(child, context));
      // console.log(child.toString());
    }
    else if (child.tagName === 'layout') {
      // addProp(out, 'layout', readLayout(child, context));
    }
    else if (child.tagName === 'overlay') {
      // true when omitted: false means thing may not overlap the chart
      addProp(out, 'overlay', boolValElm(child, true), true);
    }
    else if (child.tagName === 'spPr') {
      addProp(out, 'spPr', readShapeProperties(child, context));
    }
  }

  return out;
}
