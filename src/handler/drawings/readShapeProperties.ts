import type { Element } from '@borgar/simple-xml';
import type { Transform2D } from './types.ts';
import { readTransforms } from './readTransforms.ts';
import { attr, boolAttr } from '../../utils/attr.ts';
import type { ConversionContext } from '../../ConversionContext.ts';
import { readColor } from '../../utils/readColor.ts';
import { getFirstChild } from '../../utils/getFirstChild.ts';
import { SHAPE_TYPE } from '../../constants.ts';

type ShapeProperties = {
  transform?: Transform2D,
  bwMode?: boolean, // grayscale or duetone?
  patternStyle?: string,
  patternColor?: string,
  fillColor?: string,
  shape?: string,
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
    else if (tagName === 'blipFill') {
      // recurse/reuse the reader from readGraphicContent?
      // console.log(d.toString());
    }
    // Gradient Fill – §5.1.10.33
    else if (tagName === 'gradFill') {
      // console.log(d.toString());
    }
    // Group Fill – §5.1.10.35
    else if (tagName === 'grpFill') {
      // When specified, this setting indicates that the parent element is part of a
      // group and should inherit the fill properties of the group.
    }
    // Pattern Fill – §5.1.10.47
    else if (tagName === 'pattFill') {
      // FIXME: ensure that this matches with styles behavior
      // 5.1.12.51 ST_PresetPatternVal
      const prst = attr(d, 'prst');
      if (prst) {
        props.patternStyle = prst;
      }
      props.patternColor = readColor(getFirstChild(d, 'fgClr').children[0], context.theme).getJSF();
      props.fillColor = readColor(getFirstChild(d, 'bgClr').children[0], context.theme).getJSF();
    }
    // Solid Fill – §5.1.10.54
    else if (tagName === 'solidFill') {
      props.fillColor = readColor(d.children[0], context.theme).getJSF();
    }

    // Custom Geometry – §5.1.11.8
    else if (tagName === 'custGeom') {
      // console.log(d.toString());
    }

    // Effect Container – §5.1.10.25
    else if (tagName === 'effectDag') {
      // console.log(d.toString());
    }
    // Effect Container – §5.1.10.26
    else if (tagName === 'effectLst') {
      // glow
      // outerShdw
      // reflection
      // softEdge
      // console.log(d.toString());
    }

    // Extension List – §5.1.2.1.15
    else if (tagName === 'extLst') {
      // console.log(d.toString());
    }

    // Outline – §5.1.2.1.24
    else if (tagName === 'ln') {
      // console.log(d.toString());
    }

    // Preset geometry – §5.1.11.18
    else if (tagName === 'prstGeom') {
      // TODO: support child element: 5.1.11.5 <avLst> (List of Shape Adjust Values)
      const prst = attr(d, 'prst');
      if (SHAPE_TYPE.includes(prst)) {
        props.shape = prst;
      }
    }

    // 3D Scene Properties – §5.1.4.1.26
    else if (tagName === 'scene3d') {
      // console.log(d.toString());
    }
    // Apply 3D shape properties – §5.1.7.12
    else if (tagName === 'sp3d') {
      // console.log(d.toString());
    }
  });

  return props;
}
