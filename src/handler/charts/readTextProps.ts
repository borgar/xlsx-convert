import type { Element } from '@borgar/simple-xml';
import { attr, boolAttr, numAttr } from '../../utils/attr.ts';
import { addProp } from '../../utils/addProp.ts';
import type { TextAnchoring } from '@jsfkit/types';
import { hasKeys } from '../../utils/hasKeys.ts';
import type { TextProps } from './types/TextProps.ts';
import type { ConversionContext } from '../../ConversionContext.ts';
import { readColor } from '../../color/readColor.ts';
import { getFirstChild } from '../../utils/getFirstChild.ts';

// Excel uses this value on an axis's bodyPr (and elsewhere?) to mean "rotation is unset, auto-fit
// labels at render time". This isn't part of the OOXML spec, naturally. We discard it so it's
// treated as an absent rot attribute (i.e. no rotation).
//
// XXX: Preserve this signal in JSF so a renderer can distinguish "author chose 0" from "Excel chose
// auto-fit".
const DML_ROT_UNSET = -60000000;

// XXX: add more props
export function readTextProps (elm: Element | null, context: ConversionContext): TextProps | undefined {
  // A rich text block (c:tx/c:rich) shares txPr's internal shape (bodyPr + a:p/a:pPr/defRPr) and
  // is where titles usually carry their font styling.
  if (elm?.tagName === 'txPr' || elm?.tagName === 'rich') {
    const text: TextProps = {};
    elm.children.forEach(child => {
      if (child.tagName === 'bodyPr') {
        addProp(text, 'anchor', attr(child, 'anchor') as TextAnchoring | undefined, 't');

        // Text rotation.
        const rot = numAttr(child, 'rot');
        if (rot != null && rot !== DML_ROT_UNSET) {
          addProp(text, 'rot', rot, 0);
        }
      }
      // Extract the default text colour from <a:p><a:pPr><a:defRPr><a:solidFill>.
      else if (child.tagName === 'p') {
        const pPr = child.children.find(c => c.tagName === 'pPr');
        // Default Text Run Properties
        const defRPr = pPr?.children.find(c => c.tagName === 'defRPr');
        if (defRPr) {
          // const s: Style;
          // const u: Underline;
          addProp(text, 'bold', boolAttr(defRPr, 'b'), false);
          addProp(text, 'italic', boolAttr(defRPr, 'i'), false);
          // addProp(text, 'underline', attr(defRPr, 'u'), false); // ST_TextUnderlineType
          // addProp(text, 'spacing', boolAttr(defRPr, 'spc'), 0); // in points * 100
          addProp(text, 'size', (numAttr(defRPr, 'sz') ?? 0) / 100, 0);
          // addProp(text, 'strike', attr(defRPr, 'strike')); // ST_TextStrikeType
          addProp(text, 'caps', attr(defRPr, 'cap') as 'all' | 'none' | null);
          // fam | scheme

          for (const c of defRPr.children) {
            if (c.tagName === 'solidFill') {
              const colorElm = getFirstChild(c);
              if (colorElm) {
                const color = readColor(colorElm, context.theme);
                addProp(text, 'color', color);
              }
            }
            else if (c.tagName === 'latin') {
              addProp(text, 'typeface', attr(c, 'typeface'), '');
            }
          }
        }
      }
    });
    return hasKeys(text) ? text : undefined;
  }
}
