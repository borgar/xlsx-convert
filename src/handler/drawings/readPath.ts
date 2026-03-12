import type { Element } from '@borgar/simple-xml';
import type { Path, PathFillMode } from '@jsfkit/types';
import { attr, boolAttr, numStrAttr } from '../../utils/attr.ts';
import { getFirstChild } from '../../utils/getFirstChild.ts';

export function readPath (p?: Element | null): Path | undefined {
  if (p?.tagName !== 'path') return;

  const path: Partial<Path> = { d: [] };

  // if (boolAttr(p, 'extrusionOk')) { path.extrusionOk = true; }
  if (boolAttr(p, 'stroke') === false) { path.stroke = false; }

  // fill mode for the path -- ST_PathFillMode
  const fill = attr(p, 'fill') as PathFillMode;
  if (fill) { path.fill = fill; }

  // max X/Y coordinate of any point within the path
  const h = attr(p, 'h');
  if (h) { path.height = +h; }
  const w = attr(p, 'w');
  if (w) { path.width = +w; }

  p.children.forEach(elm => {
    // close
    if (elm.tagName === 'close') {
      path.d.push([ 'Z' ]);
    }
    // moveTo
    else if (elm.tagName === 'moveTo') {
      const pt = getFirstChild(elm, 'pt');
      path.d.push([
        'M',
        numStrAttr(pt, 'x', 0),
        numStrAttr(pt, 'y', 0),
      ]);
    }
    // lnTo
    else if (elm.tagName === 'lnTo') {
      const pt = getFirstChild(elm, 'pt');
      path.d.push([
        'L',
        numStrAttr(pt, 'x', 0),
        numStrAttr(pt, 'y', 0),
      ]);
    }
    // arcTo
    else if (elm.tagName === 'arcTo') {
      path.d.push([
        'A',
        numStrAttr(elm, 'stAng', 0),
        numStrAttr(elm, 'swAng', 0),
        numStrAttr(elm, 'wR', 0),
        numStrAttr(elm, 'hR', 0),
      ]);
    }
    // quadBezTo
    else if (elm.tagName === 'quadBezTo') {
      const pt0 = elm.children[0];
      const pt1 = elm.children[1];
      path.d.push([
        'Q',
        numStrAttr(pt0, 'x', 0),
        numStrAttr(pt0, 'y', 0),
        numStrAttr(pt1, 'x', 0),
        numStrAttr(pt1, 'y', 0),
      ]);
    }
    // cubicBezTo
    else if (elm.tagName === 'cubicBezTo') {
      const pt0 = elm.children[0];
      const pt1 = elm.children[1];
      const pt2 = elm.children[2];
      path.d.push([
        'C',
        numStrAttr(pt0, 'x', 0),
        numStrAttr(pt0, 'y', 0),
        numStrAttr(pt1, 'x', 0),
        numStrAttr(pt1, 'y', 0),
        numStrAttr(pt2, 'x', 0),
        numStrAttr(pt2, 'y', 0),
      ]);
    }
  });

  if (path.d.length) {
    return path as Path;
  }
}
