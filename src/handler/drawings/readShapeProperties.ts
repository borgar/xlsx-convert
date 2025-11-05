import type { Element } from '@borgar/simple-xml';
import type { Transform2D } from './types.ts';
import { readTransforms } from './readTransforms.ts';
import { boolAttr } from '../../utils/attr.ts';
import { readShapeColor } from './readShapeColor.ts';
import type { ConversionContext } from '../../ConversionContext.ts';

type ShapeProperties = {
  transform?: Transform2D,
  bwMode?: boolean,
  background: any,
};

export function readShapeProperties (elm: Element | null, context: ConversionContext): ShapeProperties {
  const props: ShapeProperties = {};

  const bwMode = boolAttr(elm, 'bwMode');
  if (bwMode) {
    props.bwMode = true;
  }
  // console.log(elm.toString());

  elm.children.forEach(d => {
    const { tagName } = d;
    // 2D Transform for Individual Objects – §5.1.9.6
    if (tagName === 'xfrm') {
      props.transform = readTransforms(d);
    }

    // No Fill – §5.1.10.44 (<noFill> is a noop since we assume no fill)
    // Picture Fill – §5.1.10.14
    if (tagName === 'blipFill') {
      // recurse/reuse the reader from readGraphicContent?
      // console.log(d.toString());
    }
    // Gradient Fill – §5.1.10.33
    if (tagName === 'gradFill') {
      // console.log(d.toString());
    }
    // Group Fill – §5.1.10.35
    if (tagName === 'grpFill') {
      // console.log(d.toString());
    }
    // Pattern Fill – §5.1.10.47
    if (tagName === 'pattFill') {
      // console.log(d.toString());
    }
    // Solid Fill – §5.1.10.54
    if (tagName === 'solidFill') {
      const color = readShapeColor(d.children[0], context);
      if (color) {
        props.background = color;
      }
      // hslClr (Hue, Saturation, Luminance Color Model) §5.1.2.2.13
      // prstClr (Preset Color) §5.1.2.2.22
      // schemeClr (Scheme Color) §5.1.2.2.29
      // scrgbClr (RGB Color Model - Percentage Variant) §5.1.2.2.30
      // srgbClr (RGB Color Model - Hex Variant) §5.1.2.2.32
      // sysClr (System Color) §5.1.2.2.33
    }

    // Custom Geometry – §5.1.11.8
    if (tagName === 'custGeom') {
      // console.log(d.toString());
    }

    // Effect Container – §5.1.10.25
    if (tagName === 'effectDag') {
      // console.log(d.toString());
    }
    // Effect Container – §5.1.10.26
    if (tagName === 'effectLst') {
      // glow
      // outerShdw
      // reflection
      // softEdge
      // console.log(d.toString());
    }

    // Extension List – §5.1.2.1.15
    if (tagName === 'extLst') {
      // console.log(d.toString());
    }

    // Outline – §5.1.2.1.24
    if (tagName === 'ln') {
      // console.log(d.toString());
    }

    // Preset geometry – §5.1.11.18
    if (tagName === 'prstGeom') {
      // console.log(d.toString());
    }

    // 3D Scene Properties – §5.1.4.1.26
    if (tagName === 'scene3d') {
      // console.log(d.toString());
    }
    // Apply 3D shape properties – §5.1.7.12
    if (tagName === 'sp3d') {
      // console.log(d.toString());
    }
  });

  return props;
}
