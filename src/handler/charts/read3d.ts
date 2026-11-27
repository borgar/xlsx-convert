import type { Element } from '@borgar/simple-xml';
import type { ConversionContext } from '../../ConversionContext.ts';
import { addProp } from '../../utils/addProp.ts';
import { hasKeys } from '../../utils/hasKeys.ts';
import { readShapeProperties } from '../drawings/readShapeProperties.ts';
import { boolValElm, numValElm, strValElm, xperValElm } from './utils/valElm.ts';
import type { View3d } from './types/3d/View3d.ts';
import type { Surface } from './types/3d/Surface.ts';
import type { PictureFormat, PictureOptions } from './types/plots/PictureOptions.ts';

/**
 * Read `<c:view3D>`: the rotation, depth, height, and perspective of a 3D chart.
 */
export function readView3D (element: Element): View3d {
  const out: View3d = {};
  for (const child of element.children) {
    if (child.tagName === 'rotX') {
      addProp(out, 'rotX', numValElm(child));
    }
    else if (child.tagName === 'rotY') {
      addProp(out, 'rotY', numValElm(child));
    }
    else if (child.tagName === 'depthPercent') {
      addProp(out, 'depthPercent', xperValElm(child));
    }
    else if (child.tagName === 'hPercent') {
      addProp(out, 'hPercent', xperValElm(child));
    }
    else if (child.tagName === 'rAngAx') {
      addProp(out, 'rAngAx', boolValElm(child));
    }
    else if (child.tagName === 'perspective') {
      addProp(out, 'perspective', numValElm(child));
    }
  }
  return out;
}

/**
 * Read `<c:pictureOptions>`: how a picture fill is applied to a bar, area, or wall.
 */
export function readPictureOptions (element: Element): PictureOptions | undefined {
  const out: PictureOptions = {};
  for (const child of element.children) {
    if (child.tagName === 'applyToFront') {
      addProp(out, 'applyToFront', boolValElm(child));
    }
    else if (child.tagName === 'applyToSides') {
      addProp(out, 'applyToSides', boolValElm(child));
    }
    else if (child.tagName === 'applyToEnd') {
      addProp(out, 'applyToEnd', boolValElm(child));
    }
    else if (child.tagName === 'pictureFormat') {
      addProp(out, 'pictureFormat', strValElm<PictureFormat>(child));
    }
    else if (child.tagName === 'pictureStackUnit') {
      addProp(out, 'pictureStackUnit', numValElm(child));
    }
  }
  return hasKeys(out) ? out : undefined;
}

/**
 * Read `<c:floor>`, `<c:sideWall>`, or `<c:backWall>`.
 */
export function readSurface (element: Element, context: ConversionContext): Surface {
  const out: Surface = {};
  for (const child of element.children) {
    if (child.tagName === 'thickness') {
      addProp(out, 'thickness', xperValElm(child));
    }
    else if (child.tagName === 'spPr') {
      addProp(out, 'shape', readShapeProperties(child, context));
    }
    else if (child.tagName === 'pictureOptions') {
      addProp(out, 'pictureOptions', readPictureOptions(child));
    }
  }
  return out;
}
