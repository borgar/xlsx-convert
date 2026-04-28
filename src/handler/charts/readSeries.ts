/*
<complexType name="CT_PlotArea">
  <sequence>
    <element name="layout" type="CT_Layout" minOccurs="0" maxOccurs="1" />
    <choice minOccurs="1" maxOccurs="unbounded">
      <element name="areaChart" type="CT_AreaChart" minOccurs="1" maxOccurs="1" />
      <element name="area3DChart" type="CT_Area3DChart" minOccurs="1" maxOccurs="1" />
      <element name="lineChart" type="CT_LineChart" minOccurs="1" maxOccurs="1" />
      <element name="line3DChart" type="CT_Line3DChart" minOccurs="1" maxOccurs="1" />
      <element name="stockChart" type="CT_StockChart" minOccurs="1" maxOccurs="1" />
      <element name="radarChart" type="CT_RadarChart" minOccurs="1" maxOccurs="1" />
      <element name="scatterChart" type="CT_ScatterChart" minOccurs="1" maxOccurs="1" />
      <element name="pieChart" type="CT_PieChart" minOccurs="1" maxOccurs="1" />
      <element name="pie3DChart" type="CT_Pie3DChart" minOccurs="1" maxOccurs="1" />
      <element name="doughnutChart" type="CT_DoughnutChart" minOccurs="1" maxOccurs="1" />
      <element name="barChart" type="CT_BarChart" minOccurs="1" maxOccurs="1" />
      <element name="bar3DChart" type="CT_Bar3DChart" minOccurs="1" maxOccurs="1" />
      <element name="ofPieChart" type="CT_OfPieChart" minOccurs="1" maxOccurs="1" />
      <element name="surfaceChart" type="CT_SurfaceChart" minOccurs="1" maxOccurs="1" />
      <element name="surface3DChart" type="CT_Surface3DChart" minOccurs="1" maxOccurs="1" />
      <element name="bubbleChart" type="CT_BubbleChart" minOccurs="1" maxOccurs="1" />
    </choice>
    <choice minOccurs="0" maxOccurs="unbounded">
      <element name="valAx" type="CT_ValAx" minOccurs="1" maxOccurs="1" />
      <element name="catAx" type="CT_CatAx" minOccurs="1" maxOccurs="1" />
      <element name="dateAx" type="CT_DateAx" minOccurs="1" maxOccurs="1" />
      <element name="serAx" type="CT_SerAx" minOccurs="1" maxOccurs="1" />
    </choice>
    <element name="dTable" type="CT_DTable" minOccurs="0" maxOccurs="1" />
    <element name="spPr" type="a:CT_ShapeProperties" minOccurs="0" maxOccurs="1" />
    <element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1" />
  </sequence>
</complexType>
*/

import { Element } from '@borgar/simple-xml';
import type { ConversionContext } from '../../ConversionContext.ts';
import { boolValElm, numValElm } from './utils/valElm.ts';
import { addProp } from '../../utils/addProp.ts';
import type { Shape } from '@jsfkit/types';
import { readShapeProperties } from '../drawings/readShapeProperties.ts';
import { getFirstChild } from '../../utils/getFirstChild.ts';

type integer = number;

export type DataSourceRef<T extends string | number> = {
  type: T extends number ? 'numRef' : 'strRef',
  f: string,
  numCache?: {
    z?: string,
    ptCount?: number,
    pts?: ({ v: T, z?: string })[],
  },
};

// export type Series = {
//   // shared...
//   idx: integer;
//   order: integer;
//   // tx?: CT_SerTx;
//   shape?: Shape;
//   // bar...
//   invertIfNegative?: boolean;
//   // pictureOptions?: CT_PictureOptions;
//   // dPt?: CT_DPt[];
//   // dLbls?: CT_DLbls;
//   // trendline?: CT_Trendline[];
//   // errBars?: CT_ErrBars;
//   cat?: DataSourceRef<number> | DataSourceRef<string>;
//   val?: DataSourceRef<number>;
//   // shape?: ST_Shape;
// };

export function readDataSource (
  element: Element,
  context: ConversionContext,
): DataSourceRef<number> | DataSourceRef<string> | undefined {
  let data;
  // One of:
  //   <element name="multiLvlStrRef" type="CT_MultiLvlStrRef" minOccurs="1" maxOccurs="1" />
  //   <element name="numRef" type="CT_NumRef" minOccurs="1" maxOccurs="1" />
  //   <element name="strRef" type="CT_StrRef" minOccurs="1" maxOccurs="1" />
  //   <element name="numLit" type="CT_NumData" minOccurs="1" maxOccurs="1" />
  //   <element name="strLit" type="CT_StrData" minOccurs="1" maxOccurs="1" />
  const ch = getFirstChild(element);
  if (ch.tagName === 'numRef' || ch.tagName === 'strRef') {
    const isNumeric = ch.tagName === 'numRef';
    data = { type: ch.tagName };
    // there should be a formula ref
    data.type = ch.tagName;
    data.f = getFirstChild(ch, 'f')?.textContent ?? '';

    // AND: if option.includeCachedData is set
    if (context.options.includeCacheData) {
      const numCache = getFirstChild(ch, 'numCache');
      if (numCache) {
        const pts = numCache.children.filter(d => d.tagName === 'pt');
        const ptCount = getFirstChild(numCache, 'ptCount');
        // all these props are optional!
        data.numCache = {
          z: getFirstChild(ch, 'formatCode')?.textContent ?? 'General',
          ptCount: numValElm(ptCount) ?? pts.length,
          pts: pts.map((d: Element) => {
            const value = getFirstChild(d, 'v')?.textContent ?? '0';
            const r = { v: isNumeric ? +value : value };
            const formatCode = getFirstChild(d, 'formatCode');
            if (formatCode) {
              r.z = formatCode.textContent || 'General';
            }
            return r;
          }),
        };
      }
    }
  }
  else {
    // console.log(ch.toString());
  }

  return data;
}

export function readSeries (element: Element, context: ConversionContext): Series | undefined {
  const out: Partial<Series> = {};

  for (const child of element.children) {
    // shared props
    if (child.tagName === 'idx') {
      out.idx = numValElm(child);
    }
    else if (child.tagName === 'order') {
      out.order = numValElm(child);
    }
    else if (child.tagName === 'tx') {
      // console.log(child.toString());
    }
    else if (child.tagName === 'spPr') {
      out.shape = readShapeProperties(child, context);
    }

    // bar
    else if (child.tagName === 'invertIfNegative') {
      addProp(out, 'invertIfNegative', boolValElm(child), false);
    }
    else if (child.tagName === 'pictureOptions') {
      // console.log(child.toString());
      // addProp(out, 'pictureOptions', readPictureOptions(child, context));
    }
    else if (child.tagName === 'dPt') {
      // data points?
      const dPt_ = element.querySelectorAll('>dPt');
      if (dPt_.length) {
        // out.dPt = dPt_.map(child => readDPt(child, context));
      }
    }
    else if (child.tagName === 'dLbls') {
      // data labels?
      // addProp(out, 'dLbls', readDLbls(child, context));
    }
    else if (child.tagName === 'trendline') {
      const trendline_ = element.querySelectorAll('>trendline');
      if (trendline_.length) {
        // out.trendline = trendline_.map(child => readTrendline(child, context));
      }
    }
    else if (child.tagName === 'errBars') {
      // addProp(out, 'errBars', readErrBars(child, context));
    }

    // both cat and val use the same data source reader,
    // the difference is that the output types can be:
    // cat: [ MultiLvlStrRef, NumRef, StrRef, NumData, StrData ]
    // val: [ NumRef, NumData ]
    else if (child.tagName === 'cat') {
      addProp(out, 'cat', readDataSource(child, context));
    }
    else if (child.tagName === 'val') {
      const ds = readDataSource(child, context);
      if (ds.type === 'numRef' || ds.type === 'numLit') {
        addProp(out, 'val', ds);
      }
    }

    else if (child.tagName === 'shape') {
      // console.log(child.toString());
      // addProp(out, 'shape', readShape(child, context));
    }
  }

  return out;
}
