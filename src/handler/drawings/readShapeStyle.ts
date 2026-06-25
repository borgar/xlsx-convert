import type { Element } from '@borgar/simple-xml';
import type { Color } from '@jsfkit/types';
import { attr, numAttr } from '../../utils/attr.ts';
import type { ConversionContext } from '../../ConversionContext.ts';
import { readColor } from '../../color/readColor.ts';
import { getFirstChild } from '../../utils/getFirstChild.ts';

type FontIndex = ('major' | 'minor' | 'none');

type ShapeStyle = {
  line?: { color: Color, index: number },
  fill?: { color: Color, index: number },
  effect?: { color: Color, index: number },
  font?: { color: Color, index: FontIndex },
};

export function readShapeStyle (elm: Element | null, context: ConversionContext): ShapeStyle {
  const props: ShapeStyle = {};
  if (!elm) { return props; }

  // All of these share the same structure:
  // - An idx property denoting behavior/index
  // - A single color child (one of: hslClr, prstClr, schemeClr, scrgbClr, srgbClr, sysClr)

  elm.children.forEach(d => {
    const { tagName } = d;

    // Line Reference
    if (tagName === 'lnRef') {
      // attr: idx – Style Matrix Index [ST_StyleMatrixColumnIndex]
      // The idx attribute refers the index of a line style within the fillStyleLst element.
      const color = readColor(getFirstChild(d), context.theme);
      if (color) {
        props.line = { index: numAttr(d, 'idx'), color };
      }
    }
    else if (tagName === 'fillRef') {
      // The idx attribute refers to the index of a fill style or background fill style
      // within the presentation's style matrix, defined by the fmtScheme element.
      //
      // - A value of 0 or 1000 indicates no background,
      // - values 1-999 refer to the index of a fill style within the fillStyleLst element, and
      // - values 1001 and above refer to the index of a background fill style within the bgFillStyleLst element.
      //
      // The value 1001 corresponds to the first background fill style, 1002 to the
      // second background fill style, and so on.
      const color = readColor(getFirstChild(d), context.theme);
      if (color) {
        props.fill = { index: numAttr(d, 'idx'), color };
      }
    }
    else if (tagName === 'effectRef') {
      // The idx attribute refers the index of an effect style within the `effectStyleLst`` element.
      const color = readColor(getFirstChild(d), context.theme);
      if (color) {
        props.effect = { index: numAttr(d, 'idx'), color };
      }
    }
    else if (tagName === 'fontRef') {
      // idx: Specifies the identifier of the font to reference.
      // idx: ST_FontCollectionIndex: [ 'major', 'minor', 'none' ]
      const color = readColor(getFirstChild(d), context.theme);
      const fontIndex = attr(d, 'idx') as (FontIndex | undefined);
      if (color && fontIndex) {
        props.font = { index: fontIndex, color };
      }
    }
  });

  return props;
}
