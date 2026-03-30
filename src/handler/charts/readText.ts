import type { Element } from '@borgar/simple-xml';
import { attr } from '../../utils/attr.ts';
import { addProp } from '../../utils/addProp.ts';
import type { TextAnchoring } from '@jsfkit/types';
import type { TextProps } from './_types/TextProps.ts';
import { hasKeys } from '../../utils/hasKeys.ts';
import type { Text } from './_types/Text.ts';

export function readText (elm: Element | null): Text | undefined {
  if (elm?.tagName === 'tx') {
    const text: Text = {};

    elm.children.forEach(child => {
      if (child.tagName === 'bodyPr') {
        addProp(text, 'anchor', attr(child, 'anchor') as TextAnchoring | undefined, 't');
      }
    });

    return hasKeys(text) ? text : undefined;
  }
}
