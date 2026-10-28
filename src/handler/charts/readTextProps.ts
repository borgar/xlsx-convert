import type { Element } from '@borgar/simple-xml';
import { attr, boolAttr, numAttr } from '../../utils/attr.ts';
import { addProp } from '../../utils/addProp.ts';
import type { TextAnchoring, TextVerticalType, Underline } from '@jsfkit/types';
import { hasKeys } from '../../utils/hasKeys.ts';
import type { TextProps } from './types/TextProps.ts';
import type { ConversionContext } from '../../ConversionContext.ts';
import { readColor } from '../../color/readColor.ts';
import { getFirstChild } from '../../utils/getFirstChild.ts';

// Excel uses this value on an axis's bodyPr (and elsewhere?) to mean "rotation is unset, auto-fit
// labels at render time". This isn't part of the OOXML spec, naturally. We discard it so it's
// treated as an absent rot attribute (i.e. no rotation). JSF has no way to keep this yet (see
// jsfchart/outstanding.md).
const DML_ROT_UNSET = -60000000;

/** Whether a run properties element has any attributes, apart from namespaces and language. */
function hasRunAttrs (elm: Element): boolean {
  for (const { name } of elm.attributes) {
    if (name !== 'lang' && name !== 'altLang' && !name.startsWith('xmlns')) {
      return true;
    }
  }
  return false;
}

/**
 * A DrawingML underline type (`ST_TextUnderlineType`) as a JSF underline. JSF has single and double
 * underlines, so the other DrawingML styles (dotted, wavy, heavy, and so on) map to the nearest.
 * `none`, which Excel writes on nearly every text element, is left out.
 */
function readUnderline (u: string | null): Underline | undefined {
  if (!u || u === 'none') {
    return undefined;
  }
  return /dbl/i.test(u) ? 'double' : 'single';
}

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
        addProp(text, 'vert', attr(child, 'vert') as TextVerticalType | undefined, 'horz');
      }
      // Extract the default text properties from <a:p><a:pPr><a:defRPr>. Excel sometimes leaves
      // defRPr empty and puts them on the paragraph's end run properties (<a:endParaRPr>) instead,
      // for example on ChartEx legends. A ChartEx title keeps them on its first run (<a:r><a:rPr>).
      else if (child.tagName === 'p') {
        const pPr = child.children.find(c => c.tagName === 'pPr');
        const hasProps = (e?: Element) => !!e && (hasRunAttrs(e) || e.children.length > 0);
        const defRPrElm = pPr?.children.find(c => c.tagName === 'defRPr');
        const endParaRPr = child.children.find(c => c.tagName === 'endParaRPr');
        const runRPr = child.children.find(c => c.tagName === 'r')?.children.find(c => c.tagName === 'rPr');
        const defRPr = [ defRPrElm, endParaRPr, runRPr ].find(hasProps) ?? defRPrElm;
        if (defRPr) {
          // An explicit b="0" or i="0" is kept: it overrides what the element would inherit.
          addProp(text, 'bold', boolAttr(defRPr, 'b'));
          addProp(text, 'italic', boolAttr(defRPr, 'i'));
          addProp(text, 'underline', readUnderline(attr(defRPr, 'u')));
          addProp(text, 'size', (numAttr(defRPr, 'sz') ?? 0) / 100, 0);
          addProp(text, 'caps', attr(defRPr, 'cap') as 'all' | 'none' | null);

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
