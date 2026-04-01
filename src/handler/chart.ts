import type { Document } from '@borgar/simple-xml';
import type { ConversionContext } from '../ConversionContext.ts';
import { boolAttr } from '../utils/attr.ts';
import { addProp } from '../utils/addProp.ts';
import { readShapeProperties } from './drawings/readShapeProperties.ts';
import { readTextBody } from './drawings/readTextBody.ts';
import { readChart } from './charts/readChart.ts';
import type { ChartSpaceEx } from './charts/types/ChartSpaceEx.ts';
import type { ChartSpace } from './charts/types/ChartSpace.ts';
import { readChartData } from './charts/readChartData.ts';

/*
<complexType name="CT_ChartSpace">
  <sequence>
    <element name="date1904" type="CT_Boolean" minOccurs="0" maxOccurs="1" />
    <element name="lang" type="CT_TextLanguageID" minOccurs="0" maxOccurs="1" />
    <element name="roundedCorners" type="CT_Boolean" minOccurs="0" maxOccurs="1" />
    <element name="style" type="CT_Style" minOccurs="0" maxOccurs="1" />
    <element name="clrMapOvr" type="a:CT_ColorMapping" minOccurs="0" maxOccurs="1" />
    <element name="pivotSource" type="CT_PivotSource" minOccurs="0" maxOccurs="1" />
    <element name="protection" type="CT_Protection" minOccurs="0" maxOccurs="1" />
    <element name="chart" type="CT_Chart" minOccurs="1" maxOccurs="1" />
    <element name="spPr" type="a:CT_ShapeProperties" minOccurs="0" maxOccurs="1" />
    <element name="txPr" type="a:CT_TextBody" minOccurs="0" maxOccurs="1" />
    <element name="externalData" type="CT_ExternalData" minOccurs="0" maxOccurs="1" />
    <element name="printSettings" type="CT_PrintSettings" minOccurs="0" maxOccurs="1" />
    <element name="userShapes" type="CT_RelId" minOccurs="0" maxOccurs="1" />
    <element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1" />
  </sequence>

  // ChartSpaceEx
  <xsd:sequence>
    <xsd:element name="chartData" type="CT_ChartData" minOccurs="1" maxOccurs="1"/>
    <xsd:element name="chart" type="CT_Chart" minOccurs="1" maxOccurs="1"/>
    <xsd:element name="spPr" type="a:CT_ShapeProperties" minOccurs="0" maxOccurs="1"/>
    <xsd:element name="txPr" type="a:CT_TextBody" minOccurs="0" maxOccurs="1"/>
    <xsd:element name="clrMapOvr" type="a:CT_ColorMapping" minOccurs="0" maxOccurs="1"/>
    <xsd:element name="fmtOvrs" type="CT_FormatOverrides" minOccurs="0" maxOccurs="1"/>
    <xsd:element name="printSettings" type="CT_PrintSettings" minOccurs="0" maxOccurs="1"/>
    <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
  </xsd:sequence>
  <xsd:attribute name="version" type="xsd:string" use="optional" default="0.0"/>
  <xsd:attribute name="featureList" type="xsd:string" use="optional" default=""/>
  <xsd:attribute name="fallbackImg" type="xsd:string" use="optional" default=""/>

</complexType>
*/

export function handlerChart (dom: Document, context: ConversionContext, isChartx: true): ChartSpaceEx;
export function handlerChart (dom: Document, context: ConversionContext, isChartx?: false): ChartSpace;
export function handlerChart (dom: Document, context: ConversionContext, isChartx = false): ChartSpace | ChartSpaceEx {
  const chartSpace: Partial<ChartSpace> | Partial<ChartSpaceEx> = {};
  // dom.root is assumed to be a <chartSpace> element (5.7.2.29)
  // console.log('// ~~' + '~'.repeat(80));

  // ChartEx
  // <xsd:attribute name="version" type="xsd:string" use="optional" default="0.0"/>
  // <xsd:attribute name="featureList" type="xsd:string" use="optional" default=""/>
  // <xsd:attribute name="fallbackImg" type="xsd:string" use="optional" default=""/>

  dom.root.children.forEach(elm => {
    const { tagName } = elm;
    // ChartEx
    if (isChartx && tagName === 'chartData') {
      // @ts-expect-error XXX: deal with the types
      addProp(chartSpace, 'chartData', readChartData(elm, context));
    }
    else if (isChartx && tagName === 'fmtOvrs') { // Format overrides
      // TODO
    }

    // Chart
    else if (!isChartx && tagName === 'date1904') {
      // addProp(chart, 'epoch', boolAttr(elm, 'val') ? 1904 : null);
    }
    else if (!isChartx && tagName === 'lang') {
      // addProp(chart, 'lang', attr(elm, 'val'), 'en-US');
    }
    else if (!isChartx && tagName === 'roundedCorners') {
      // @ts-expect-error XXX: deal with the types
      addProp(chartSpace, 'roundedCorners', boolAttr(elm, 'val'), false);
    }
    else if (!isChartx && tagName === 'style') {
      // TODO
    }
    else if (isChartx && tagName === 'pivotSource') {
      // TODO
    }
    else if (isChartx && tagName === 'protection') {
      // TODO
    }
    else if (isChartx && tagName === 'userShapes') {
      // TODO
    }
    else if (isChartx && tagName === 'externalData') {
      // TODO
    }

    // Both
    else if (tagName === 'chart') {
      chartSpace.chart = readChart(elm, context, isChartx);
    }
    else if (tagName === 'spPr') {
      // XXX: ignore default? (white fill, black line, ...)
      addProp(chartSpace, 'shape', readShapeProperties(elm, context));
    }
    else if (tagName === 'txPr') {
      addProp(chartSpace, 'textProps', readTextBody(elm));
    }
    else if (tagName === 'clrMapOvr') { // Color map overrides
      // TODO
    }
    else if (tagName === 'printSettings') {
      // TODO
    }
  });

  return chartSpace as ChartSpace | ChartSpaceEx;
}
