import type { Element } from '@borgar/simple-xml';
import type { Path, Shape, GuidePoint, BlackWhiteMode, ConnectionPoint, AdjustPoint } from '@jsfkit/types';
import { readTransforms } from './readTransforms.ts';
import { readPath } from './readPath.ts';
import { attr, numAttr, numStrAttr } from '../../utils/attr.ts';
import type { ConversionContext } from '../../ConversionContext.ts';
import { getFirstChild } from '../../utils/getFirstChild.ts';
import { SHAPE_TYPE } from '../../constants.ts';
import { addProp } from '../../utils/addProp.ts';
import { readFill } from './readFill.ts';
import { readLineProps } from './readLineProps.ts';
import { hasKeys } from '../../utils/hasKeys.ts';

function readGuides (elm: Element | null): GuidePoint[] | undefined {
  if (!elm) return;
  const gds = [];
  elm.children.forEach(gd => {
    if (gd.tagName === 'gd') {
      gds.push({
        name: attr(gd, 'name'),
        fmla: attr(gd, 'fmla'),
      });
    }
  });
  return (gds.length) ? gds : undefined;
}

function readAdjustPoint (posElm: Element): AdjustPoint {
  return {
    x: numStrAttr(posElm, 'x', 0),
    y: numStrAttr(posElm, 'y', 0),
  };
}

export function readShapeProperties (elm: Element | null, context: ConversionContext): Shape | undefined {
  const props: Shape = {};

  const bwMode = attr(elm, 'bwMode') as BlackWhiteMode | undefined;
  if (bwMode && bwMode !== 'auto') { props.bwMode = bwMode; }

  elm.children.forEach(d => {
    const { tagName } = d;

    if (tagName === 'xfrm') {
      addProp(props, 'xfrm', readTransforms(d));
    }

    else if (
      tagName === 'blipFill' ||
      tagName === 'gradFill' ||
      tagName === 'grpFill' ||
      tagName === 'solidFill' ||
      tagName === 'pattFill'
    ) {
      addProp(props, 'fill', readFill(d, context));
    }

    // Custom Geometry – §5.1.11.8
    else if (tagName === 'custGeom') {
      // ahLst (List of Shape Adjust Handles) §5.1.11.1
      const ahLst = getFirstChild(d, 'ahLst');
      const ahs = [];
      ahLst?.children.forEach(ah => {
        if (ah.tagName === 'ahPolar') {
          ahs.push({
            type: 'polar',
            // name of guide that will update with the angle from this
            gdRefAng: attr(ah, 'gdRefAng'),
            maxAng: numStrAttr(ah, 'maxAng'),
            minAng: numStrAttr(ah, 'minAng'),
            // name of guide that will update with the radius from this
            gdRefR: attr(ah, 'gdRefR'),
            maxR: numStrAttr(ah, 'maxR'),
            minR: numStrAttr(ah, 'minR'),
            pos: readAdjustPoint(getFirstChild(ah, 'pos')),
          });
        }
        else if (ah.tagName === 'ahXY') {
          ahs.push({
            type: 'xy',
            gdRefX: attr(ah, 'gdRefX'),
            maxX: numAttr(ah, 'maxX'),
            minX: numAttr(ah, 'minX'),
            gdRefY: attr(ah, 'gdRefY'),
            maxY: numAttr(ah, 'maxY'),
            minY: numAttr(ah, 'minY'),
            pos: readAdjustPoint(getFirstChild(ah, 'pos')),
          });
        }
      });
      if (ahs.length) { props.ah = ahs; }

      // avLst (List of Shape Adjust Values) §5.1.11.5
      const av = readGuides(d.querySelector('avLst'));
      if (av?.length) { props.av = av; }

      // cxnLst (List of Shape Connection Sites) §5.1.11.10
      const cxnList = d.querySelectorAll('cxnLst > cxn');
      if (cxnList.length) {
        const cxns: ConnectionPoint[] = [];
        cxnList.forEach(cElm => {
          const pos = readAdjustPoint(getFirstChild(cElm, 'pos'));
          if (pos) {
            const pt: ConnectionPoint = { pos };
            const ang = numStrAttr(cElm, 'ang');
            if (ang) { pt.ang = ang; }
            cxns.push(pt);
          }
        });
        if (cxns.length) { props.cxn = cxns; }
      }

      // gdLst (List of Shape Guides) §5.1.11.12
      const gd = readGuides(d.querySelector('gdLst'));
      if (gd?.length) { props.gd = gd; }

      // pathLst (List of Shape Paths) §5.1.11.16
      const paths: Path[] = [];
      const pathLst = d.querySelector('pathLst');
      pathLst?.children.forEach(section => {
        const p = readPath(section);
        if (p) { paths.push(p); }
      });
      if (paths.length) { props.paths = paths; }

      // rect (Shape Text Rectangle) §5.1.11.22
      const rectElm = d.querySelector('rect');
      if (rectElm) {
        // all attr are required
        const rect = {
          t: attr(rectElm, 't'),
          b: attr(rectElm, 'b'),
          l: attr(rectElm, 'l'),
          r: attr(rectElm, 'r'),
        };
        // ...but rect itself is redundant if it is t=t/b=b/r=r/l=l
        if (rect.t !== 't' || rect.b !== 'b' || rect.l !== 'l' || rect.r !== 'r') {
          props.rect = rect;
        }
      }
    }

    // Outline – §5.1.2.1.24
    else if (tagName === 'ln') {
      addProp(props, 'line', readLineProps(d, context));
    }

    // Preset geometry – §5.1.11.18
    else if (tagName === 'prstGeom') {
      const prst = attr(d, 'prst');
      if (SHAPE_TYPE.includes(prst)) {
        props.preset = prst;
      }
      //  Shape Adjust Values (5.1.11.5)
      const av = readGuides(d.querySelector('avLst'));
      if (av?.length) { props.av = av; }
    }

    // 3D Scene Properties – §5.1.4.1.26
    else if (tagName === 'scene3d') {
      // TBD
    }

    // Apply 3D shape properties – §5.1.7.12
    else if (tagName === 'sp3d') {
      // TBD
    }

    // Effect Container – §5.1.10.25
    else if (tagName === 'effectDag') {
      // TBD
    }

    // Effect Container – §5.1.10.26
    else if (tagName === 'effectLst') {
      // TBD
    }
  });

  return hasKeys(props) ? props : undefined;
}
