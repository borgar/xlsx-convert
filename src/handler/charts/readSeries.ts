import { Element } from '@borgar/simple-xml';
import { readPictureOptions } from './read3d.ts';
import type { ConversionContext } from '../../ConversionContext.ts';
import { boolValElm, numValElm, strValElm } from './utils/valElm.ts';
import type { BarShape } from './types/plots/BarShape.ts';
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
import { normalizeFormula } from '../../utils/normalizeFormula.ts';
import { unescape } from '../../utils/unescape.ts';

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
      const ds = readDataSource(child, context);
      if (ds?.type === 'strRef') {
        addProp(out, 'text', ds);
      }
      else {
        const v = getFirstChild(child, 'v');
        if (v) {
          out.text = unescape(v.textContent);
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
      addProp(out, 'pictureOptions', readPictureOptions(child));
    }
    else if (child.tagName === 'dPt') {
      const d = readDataPoint(child, context);
      if (d) { (out.dPt ??= []).push(d); }
    }
    else if (child.tagName === 'dLbls') {
      addProp(out, 'dLbls', readDLbls(child, context));
    }
    else if (child.tagName === 'trendline') {
      (out.trendline ??= []).push(readTrendline(child, context));
    }
    else if (child.tagName === 'errBars') {
      // scatter, bubble, and area series can have a set for each direction
      const errBars = readErrBars(child, context);
      if (errBars) { (out.errBars ??= []).push(errBars); }
    }
    else if (child.tagName === 'extLst') {
      // Excel 2013+ "Value From Cells" label range: <c15:datalabelsRange><c15:f>. Its cache
      // (c15:dlblRangeCache) isn't read: chart data is evaluated from the formula.
      const f = child.querySelector('datalabelsRange > f')?.textContent;
      if (f) {
        out.labelsRange = normalizeFormula(f, context);
      }
    }

    // Scatter series use xVal/yVal instead of cat/val.
    // Both cat and val use the same data source reader, the difference is that the output types can be:
    // - cat/xVal: [ MultiLvlStrRef, NumRef, StrRef, NumData, StrData ]
    // - val/yVal: [ NumRef, NumData ]
    else if (child.tagName === 'cat' || child.tagName === 'xVal') {
      addProp(out, 'cat', readDataSource(child, context));
    }
    else if (child.tagName === 'val' || child.tagName === 'yVal') {
      const ds = readDataSource(child, context);
      if (isNumDataSource(ds)) {
        addProp(out, 'val', ds);
      }
    }

    else if (child.tagName === 'smooth') {
      addProp(out, 'smooth', boolValElm(child));
    }

    // Bubble series add a third numeric dimension carrying the bubble size.
    else if (child.tagName === 'bubbleSize') {
      const ds = readDataSource(child, context);
      if (isNumDataSource(ds)) {
        addProp(out, 'bubbleSize', ds);
      }
    }
    else if (child.tagName === 'bubble3D') {
      addProp(out, 'bubble3D', boolValElm(child), false);
    }
    else if (child.tagName === 'shape') {
      // the shape of a 3D bar series' bars, which overrides the plot's
      addProp(out, 'barShape', strValElm<BarShape>(child));
    }
  }

  return out as Series;
}
