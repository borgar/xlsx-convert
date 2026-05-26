import { Element } from '@borgar/simple-xml';
import type { ConversionContext } from '../../ConversionContext.ts';
import { boolValElm, numValElm } from './utils/valElm.ts';
import { addProp } from '../../utils/addProp.ts';
import { readShapeProperties } from '../drawings/readShapeProperties.ts';
import { readDataSource } from './readDataSource.ts';
import type { Series } from './types/series/Series.ts';
import { readDataPoint } from './readDataPoint.ts';
import { readMarker } from './readMarker.ts';
import { readErrBars } from './readErrBars.ts';
import { isNumDataSource } from './utils/isNumDataSource.ts';
import { readDLbls } from './readDLbls.ts';
import { readTrendline } from './readTrendline.ts';
import { getFirstChild } from '../../utils/getFirstChild.ts';

export function readSeries (element: Element, context: ConversionContext): Series | undefined {
  const out: Partial<Series> = {};

  for (const child of element.children) {
    if (child.tagName === 'idx') {
      out.idx = numValElm(child) ?? 0;
    }
    else if (child.tagName === 'order') {
      out.order = numValElm(child) ?? 0;
    }
    else if (child.tagName === 'explosion') {
      addProp(out, 'explosion', numValElm(child), 0);
    }
    else if (child.tagName === 'tx') {
      const ds = readDataSource(child);
      if (ds?.type === 'strRef') {
        addProp(out, 'text', ds);
      }
      else {
        const v = getFirstChild(child, 'v');
        if (v?.tagName === 'v') {
          out.text = v.textContent;
        }
      }
    }
    else if (child.tagName === 'spPr') {
      out.shape = readShapeProperties(child, context);
    }
    else if (child.tagName === 'marker') {
      addProp(out, 'marker', readMarker(child, context));
    }
    else if (child.tagName === 'invertIfNegative') {
      addProp(out, 'invertIfNegative', boolValElm(child), false);
    }
    else if (child.tagName === 'pictureOptions') {
      // console.log(child.toString());
    }
    else if (child.tagName === 'dPt') {
      const dPts = element.querySelectorAll('>dPt');
      if (dPts.length) {
        const dPt = [];
        for (const dpElm of dPts) {
          const d = readDataPoint(dpElm, context);
          if (d) { dPt.push(d); }
        }
        if (dPt.length) {
          out.dPt = dPt;
        }
      }
    }
    else if (child.tagName === 'dLbls') {
      addProp(out, 'dLbls', readDLbls(child, context));
    }
    else if (child.tagName === 'trendline') {
      const trendlines = element.querySelectorAll('>trendline');
      if (trendlines.length) {
        out.trendline = trendlines.map(d => readTrendline(d, context));
      }
    }
    else if (child.tagName === 'errBars') {
      addProp(out, 'errBars', readErrBars(child, context));
    }

    // Scatter series use xVal/yVal instead of cat/val.
    // Both cat and val use the same data source reader, the difference is that the output types can be:
    // - cat/xVal: [ MultiLvlStrRef, NumRef, StrRef, NumData, StrData ]
    // - val/yVal: [ NumRef, NumData ]
    else if (child.tagName === 'cat' || child.tagName === 'xVal') {
      addProp(out, 'cat', readDataSource(child));
    }
    else if (child.tagName === 'val' || child.tagName === 'yVal') {
      const ds = readDataSource(child);
      if (isNumDataSource(ds)) {
        addProp(out, 'val', ds);
      }
    }

    else if (child.tagName === 'smooth') {
      addProp(out, 'smooth', boolValElm(child));
    }

    // Bubble series add a third numeric dimension carrying the bubble size.
    else if (child.tagName === 'bubbleSize') {
      const ds = readDataSource(child);
      if (isNumDataSource(ds)) {
        addProp(out, 'bubbleSize', ds);
      }
    }
    else if (child.tagName === 'bubble3D') {
      addProp(out, 'bubble3D', boolValElm(child), false);
    }

    // barShape
    else if (child.tagName === 'shape') {
      // addProp(out, 'barShape', strValElm(child, 'shape))
    }
  }

  return out as Series;
}
