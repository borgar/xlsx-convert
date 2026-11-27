import type { Element } from '@borgar/simple-xml';
import type { Color } from '@jsfkit/types';
import { getFirstChild } from './getFirstChild.ts';

export type TextRange = {
  text: string;
  props?: {
    b?: boolean;
    i?: boolean;
    u?: boolean;
    outline?: boolean;
    shadow?: boolean;
    condense?: boolean;
    strike?: boolean;
    extend?: boolean;
    sz?: number;
    color?: Color;
    font?: string;
    vertAlign?: 'baseline' | 'superscript' | 'subscript';
  }
};

/**
 * Defines a paragraph of rich text
 */
export class RichText {
  #r: TextRange[];

  constructor () {
    this.#r = [];
  }

  add (r: TextRange): void {
    this.#r.push(r);
  }

  toJSF () {
    return {
      text: this.text,
    };
  }

  get isRich (): boolean {
    for (const r of this.#r) {
      if (r.props) {
        return true;
      }
    }
    return false;
  }

  get text (): string {
    let s = '';
    for (const r of this.#r) {
      s += r.text;
    }
    return s;
  }

  static from (elm: Element | undefined | null): RichText {
    const rt = new RichText();
    if (elm) {
      for (const item of elm.children) {
        if (item.tagName === 'r') {
          const props: TextRange['props'] = {};

          // const rPr = getFirstChild(item, 'rPr');
          // <xsd:element name="rFont" type="CT_FontName" minOccurs="0" maxOccurs="1"/>
          // <xsd:element name="charset" type="CT_IntProperty" minOccurs="0" maxOccurs="1"/>
          // <xsd:element name="family" type="CT_IntProperty" minOccurs="0" maxOccurs="1"/>
          // <xsd:element name="b" type="CT_BooleanProperty" minOccurs="0" maxOccurs="1"/>
          // <xsd:element name="i" type="CT_BooleanProperty" minOccurs="0" maxOccurs="1"/>
          // <xsd:element name="strike" type="CT_BooleanProperty" minOccurs="0" maxOccurs="1"/>
          // <xsd:element name="outline" type="CT_BooleanProperty" minOccurs="0" maxOccurs="1"/>
          // <xsd:element name="shadow" type="CT_BooleanProperty" minOccurs="0" maxOccurs="1"/>
          // <xsd:element name="condense" type="CT_BooleanProperty" minOccurs="0" maxOccurs="1"/>
          // <xsd:element name="extend" type="CT_BooleanProperty" minOccurs="0" maxOccurs="1"/>
          // <xsd:element name="color" type="CT_Color" minOccurs="0" maxOccurs="1"/>
          // <xsd:element name="sz" type="CT_FontSize" minOccurs="0" maxOccurs="1"/>
          // <xsd:element name="u" type="CT_UnderlineProperty" minOccurs="0" maxOccurs="1"/>
          // <xsd:element name="vertAlign" type="CT_VerticalAlignFontProperty" minOccurs="0" maxOccurs="1"/>
          // <xsd:element name="scheme" type="CT_FontScheme" minOccurs="0" maxOccurs="1"/>

          rt.add({ text: getFirstChild(item, 't')?.textContent || '', props });
        }
        else if (item.tagName === 't') {
          rt.add({ text: item.textContent });
        }
      }
    }
    return rt;
  }
}
