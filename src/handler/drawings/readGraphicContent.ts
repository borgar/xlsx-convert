import { Element } from '@borgar/simple-xml';
import type { Graphic, GraphicBitmap, GraphicChart, GraphicConnectionShape, GraphicGroup, GraphicShape } from '@jsfkit/types';
import { boolAttr } from '../../utils/attr.ts';
import { readTransforms } from './readTransforms.ts';
import { getFirstChild } from '../../utils/getFirstChild.ts';
import { readShapeProperties } from './readShapeProperties.ts';
// import { readShapeStyle } from './readShapeStyle.ts';
import { readTextBody } from './readTextBody.ts';
import type { ConversionContext } from '../../ConversionContext.ts';
import { addProp } from '../../utils/addProp.ts';
import { readFillBlip } from './readFillBlip.ts';
import {
  MISSING_ASSET_3D, MISSING_SHAPE_DIAGRAM, MISSING_SHAPE_MATH, MISSING_TABLE_SLICER,
  MISSING_TIME_SLICER,
} from '../../constants.ts';

function seekXmlNs (node: Element, prefix: string): string | null {
  let c: Element | null = node;
  do {
    const uri = c.getAttribute('xmlns:' + prefix);
    if (uri) {
      return uri;
    }
    c = node.parentNode;
  } while (c instanceof Element);
  return null;
}

export function readGraphicContent (parent: Element, context: ConversionContext): Graphic[] {
  const content: Graphic[] = [];

  parent.children.forEach((d: Element) => {
    // Group Shape
    if (d.tagName === 'grpSp') {
      const out: GraphicGroup = {
        type: 'group',
        id: '',
        name: '',
        // recurse for children, they should be read like other elements in the current list
        content: readGraphicContent(d, context),
      };
      d.children.forEach(child => {
        // Non-Visual Shape Properties
        if (child.tagName === 'nvGrpSpPr') {
          const cNvPr = child.querySelector('>cNvPr');
          if (cNvPr) {
            out.id = cNvPr.getAttribute('id') ?? '';
            out.name = cNvPr.getAttribute('name') ?? '';
          }
        }
        // Group Shape Properties
        else if (child.tagName === 'grpSpPr') {
          const xfrm = readTransforms(child.querySelector('>xfrm'), true);
          if (xfrm) { out.xfrm = xfrm; }
        }
      });
      // if group has no content, we don't need to add it
      if (out.content.length) {
        content.push(out);
      }
    }

    // Connection Shape
    else if (d.tagName === 'cxnSp') {
      const out: GraphicConnectionShape = {
        type: 'connectionShape',
        id: '',
        name: '',
      };
      // Non-Visual Shape Properties
      const cNvPr = d.querySelector('> nvCxnSpPr > cNvPr');
      if (cNvPr) {
        out.id = cNvPr.getAttribute('id') ?? '';
        out.name = cNvPr.getAttribute('name') ?? '';
      }
      addProp(out, 'shape', readShapeProperties(getFirstChild(d, 'spPr'), context));
      addProp(out, 'text', readTextBody(getFirstChild(d, 'txBody'), context));
      // addProp(out, 'style', readShapeStyle(getFirstChild(d, 'style'), context));
      content.push(out);
    }

    // Shape
    else if (d.tagName === 'sp') {
      const out: GraphicShape = {
        type: 'shape',
        id: '',
        name: '',
      };
      // Non-Visual Shape Properties
      const cNvPr = d.querySelector('cNvPr');
      if (cNvPr) {
        out.id = cNvPr.getAttribute('id') ?? '';
        out.name = cNvPr.getAttribute('name') ?? '';
      }
      addProp(out, 'shape', readShapeProperties(getFirstChild(d, 'spPr'), context));
      addProp(out, 'text', readTextBody(getFirstChild(d, 'txBody'), context));
      // addProp(out, 'style', readShapeStyle(getFirstChild(d, 'style'), context));
      content.push(out);
    }

    // Picture / Bitmap
    else if (d.tagName === 'pic') {
      const out: GraphicBitmap = {
        type: 'bitmap',
        id: '',
        name: '',
        mediaId: '',
        noChangeAspect: false,
      };
      // Non-Visual Properties
      const cNvPr = d.querySelector('cNvPr');
      if (cNvPr) {
        out.id = cNvPr.getAttribute('id') ?? '';
        out.name = cNvPr.getAttribute('name') ?? '';
        const desc = cNvPr.getAttribute('descr');
        if (desc) { out.desc = desc; }
      }
      // Non-Visual Picture Drawing Properties
      //  todo: Support 5.8.2.6: cNvPicPr[preferRelativeResize]
      const picLocks = d.querySelector('cNvPicPr > picLocks');
      if (picLocks) { out.noChangeAspect = boolAttr(picLocks, 'noChangeAspect', false); }

      const blipFillElm = d.querySelector('blipFill');
      const blipFill = readFillBlip(blipFillElm, context);
      if (blipFill) {
        // copy props
        out.mediaId = blipFill.mediaId;
        out.alpha = blipFill.alpha;
        out.stretchRect = blipFill.stretchRect;
        out.srcRect = blipFill.srcRect;
        addProp(out, 'shape', readShapeProperties(getFirstChild(d, 'spPr'), context));
        content.push(out);
      }
    }

    // Charts
    else if (d.tagName === 'graphicFrame') {
      const out: GraphicChart = { type: 'chart', id: '', name: '', chartId: '' };
      // Non-Visual Properties
      const cNvPr = d.querySelector('cNvPr');
      if (cNvPr) {
        out.id = cNvPr.getAttribute('id') ?? '';
        out.name = cNvPr.getAttribute('name') ?? '';
      }
      // const graphicFrameLocks = d.querySelector('graphicFrameLocks');
      // if (graphicFrameLocks) { out.locked = {}; }

      // Specifies a 2D transform to be applied to a Graphic Frame:
      addProp(out, 'xfrm', readTransforms(d.querySelector('xfrm')));
      // XXX: can't we discard ext: { cx:0, cy:0 } here? Charts contain <ext cx="0" cy="0" />, but this seems wrong.

      // Chart data
      const chart = d.querySelector('graphicData > chart');
      if (chart) {
        const rId = chart.getAttribute('r:id');
        if (rId) {
          const rel = context.drawingRels.find(r => r.id === rId);
          if (rel?.type === 'chart' || rel?.type === 'chartEx') {
            out.chartId = rel.target; // or rId?
            context.charts.push({ rel, type: rel?.type });
            content.push(out);
          }
        }
      }
      else {
        const graphicData = d.querySelector('graphicData');
        // http://schemas.openxmlformats.org/drawingml/2006/diagram
        if (graphicData?.getAttribute('uri')?.endsWith('/diagram')) {
          context.unsupported.add(MISSING_SHAPE_DIAGRAM);
        }
        else {
          // is this a slicer?
          const slicer = d.querySelector('graphicData > slicer');
          if (slicer) {
            context.unsupported.add(MISSING_TABLE_SLICER);
          }
        }
      }
    }
    else if (d.tagName === 'AlternateContent') {
      for (const x of d.children) {
        if (x.tagName === 'Choice') {
          const req = x.attr.Requires.trim().split(/\s+/);
          if (req.length) {
            for (const prefix of req) {
              const ns = seekXmlNs(x, prefix);
              if (ns?.endsWith('/slicer')) {
                context.unsupported.add(MISSING_TABLE_SLICER);
              }
              else if (ns?.endsWith('/timeslicer')) {
                context.unsupported.add(MISSING_TIME_SLICER);
              }
              else if (ns?.endsWith('/model3d')) {
                context.unsupported.add(MISSING_ASSET_3D);
              }
              else if (ns?.endsWith('/chartex')) {
                const ch = getFirstChild(x);
                if (ch) {
                  content.push(...readGraphicContent(x, context));
                }
              }
              else if (ns?.endsWith('/drawing/2010/main')) {
                if (x.querySelector('oMath')) {
                  context.unsupported.add(MISSING_SHAPE_MATH);
                }
              }
            }
          }
          /*
          | Namespace URI | Common prefix | Capability |
          |---|---|---|
          | `http://schemas.microsoft.com/office/drawing/2010/main`                | Office 2010 extended DrawingML |
          | `http://schemas.microsoft.com/office/drawing/2010/slicer`              | Excel slicer drawing |
          | `http://schemas.microsoft.com/office/drawing/2012/slicer`              | Excel 2013+ slicer drawing |
          | `http://schemas.microsoft.com/office/drawing/2012/timeslicer`          | Excel Timeline (time slicer) drawing |
          | `http://schemas.microsoft.com/office/excel/2010/spreadsheetDrawing`    | Extended Excel spreadsheet-drawing content |
          | `http://schemas.microsoft.com/office/drawing/2010/compatibility`       | Compatibility shapes for legacy controls / OLE / ActiveX |
          | `http://schemas.microsoft.com/office/drawing/2007/8/2/chart`           | Office 2010 extended chart functionality |
          | `http://schemas.microsoft.com/office/drawing/2012/chart`               | Office 2013 extended chart functionality |
          | `http://schemas.microsoft.com/office/drawing/2014/chart`               | Office 2016 extended chart functionality |
          | `http://schemas.microsoft.com/office/drawing/2014/chartex`             | Extended/new chart model (Waterfall, Histogram, etc.) |
          | `http://schemas.microsoft.com/office/drawing/2014/chart/ac`            | Compatibility extensions for the extended chart model |
          | `http://schemas.microsoft.com/office/drawing/2015/06/chart`            | Later Office 2016 chart extensions |
          | `http://schemas.microsoft.com/office/drawing/2017/03/chart`            | Later-generation chart extensions |
          | `http://schemas.microsoft.com/office/drawing/2016/SVG/main`            | SVG image representation |
          | `http://schemas.microsoft.com/office/drawing/2017/model3d`             | 3D model drawing |
          | `http://schemas.microsoft.com/office/drawing/2016/ink`                 | Ink drawing |
          | `http://schemas.microsoft.com/office/drawing/2017/decorative`          | Decorative-object accessibility metadata |
          | `http://schemas.microsoft.com/office/drawing/2018/sketchyshapes`       | Sketch / hand-drawn shape rendering |
          | `http://schemas.microsoft.com/office/drawing/2018/animation`           | Drawing animation |
          | `http://schemas.microsoft.com/office/drawing/2018/animation/model3d`   | 3D-model animation |
          | `http://schemas.microsoft.com/office/drawing/2020/classificationShape` | Classification / sensitivity-label shapes |
          | `http://schemas.microsoft.com/office/drawing/2021/livefeed`            | Live-feed drawing objects |
          | `http://schemas.microsoft.com/office/drawing/2021/scriptlink`          | Script-linked drawing content |
          | `http://schemas.microsoft.com/office/drawing/2022/imageformula`        | Formula-backed image content |
          */
        }
      }
    }
  });

  return content;
}
