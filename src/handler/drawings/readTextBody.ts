import type { Element } from '@borgar/simple-xml';
import { attr } from '../../utils/attr.ts';
import { addProp } from '../../utils/addProp.ts';
import type { Paragraph, TextAnchoring, TextBody, TextHorzOverflow, TextVertOverflow, TextWrapping } from '@jsfkit/types';

export function readTextBody (elm: Element | null): TextBody | undefined {
  if (elm?.tagName === 'txBody') {
    const text: TextBody = { p: [] };

    elm.children.forEach(child => {
      if (child.tagName === 'bodyPr') {
        addProp(text, 'vertOverflow', attr(child, 'vertOverflow') as TextVertOverflow | undefined, 'overflow');
        addProp(text, 'horzOverflow', attr(child, 'horzOverflow') as TextHorzOverflow | undefined, 'overflow');
        addProp(text, 'wrap', attr(child, 'wrap') as TextWrapping | undefined, 'square');
        addProp(text, 'anchor', attr(child, 'anchor') as TextAnchoring | undefined, 't');
        // | <noAutofit />
        // | <normAutofit fontScale lnSpcReduction />
        // | <prstTxWarp />
        // | <scene3d />
        // | <sp3d />
        // | <spAutoFit />
      }
      else if (child.tagName === 'lstStyle') {
        // <lstStyle />
      }
      else if (child.tagName === 'p') {
        const para: Paragraph = { text: child.textContent };
        text.p.push(para);
        // TODO: rich text
        // <p>
        //   <pPr algn="ctr" />
        //   <r>
        //     <rPr sz="1600" b="0" i="1" kern="1200" />
        //     <t>Image in a cell</t>
        //   </r>
        // </p>
      }
    });

    if (text.p.length && text.p[0].text.length) {
      return text;
    }
  }
}
