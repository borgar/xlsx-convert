import type { Element } from '@borgar/simple-xml';
import { attr } from '../../utils/attr.ts';
import { addProp } from '../../utils/addProp.ts';
import type { TextAnchoring } from '@jsfkit/types';
import type { TextProps } from './_types/TextProps.ts';
import { hasKeys } from '../../utils/hasKeys.ts';

// XXX: add more props
export function readTextProps (elm: Element | null): TextProps | undefined {
  if (elm?.tagName === 'txPr') {
    const text: TextProps = {};

    elm.children.forEach(child => {
      if (child.tagName === 'bodyPr') {
        addProp(text, 'anchor', attr(child, 'anchor') as TextAnchoring | undefined, 't');
      }
    });

    return hasKeys(text) ? text : undefined;
  }
}
