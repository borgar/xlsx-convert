import type { Element } from '@borgar/simple-xml';
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

export function readGraphicContent (parent: Element, context: ConversionContext): Graphic[] {
  const content = [];

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
            out.id = cNvPr.getAttribute('id');
            out.name = cNvPr.getAttribute('name');
          }
        }
        // Group Shape Properties
        else if (child.tagName === 'grpSpPr') {
          const xfrm = readTransforms(child.querySelector('>xfrm'));
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
        out.id = cNvPr.getAttribute('id');
        out.name = cNvPr.getAttribute('name');
      }
      addProp(out, 'shape', readShapeProperties(getFirstChild(d, 'spPr'), context));
      addProp(out, 'text', readTextBody(getFirstChild(d, 'txBody')));
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
        out.id = cNvPr.getAttribute('id');
        out.name = cNvPr.getAttribute('name');
      }
      addProp(out, 'shape', readShapeProperties(getFirstChild(d, 'spPr'), context));
      addProp(out, 'text', readTextBody(getFirstChild(d, 'txBody')));
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
        out.id = cNvPr.getAttribute('id'); // "2"
        out.name = cNvPr.getAttribute('name'); // "Picture 2"
        const desc = cNvPr.getAttribute('descr');
        if (desc) { out.desc = desc; } // "Spit Cat"
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
        out.id = cNvPr.getAttribute('id'); // "2"
        out.name = cNvPr.getAttribute('name'); // "Chart 1"
      }
      // const graphicFrameLocks = d.querySelector('graphicFrameLocks');
      // if (graphicFrameLocks) { out.locked = {}; }

      // Specifies a 2D transform to be applied to a Graphic Frame:
      addProp(out, 'xfrm', readTransforms(d.querySelector('xfrm')));

      // Chart data
      const chart = d.querySelector('graphicData > chart');
      if (chart) {
        out.chartId = chart.getAttribute('r:id');
        content.push(out);
      }
      else {
        // throw new Error('Support missing for Graphic Frame content');
        return;
      }
    }
  });

  return content;
}
