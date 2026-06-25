import { CDataNode, Element, TextNode } from '@borgar/simple-xml';
import type { Text } from './types/Text.ts';
import { getFirstChild } from '../../utils/getFirstChild.ts';
import { readDataSource } from './readDataSource.ts';

function getTextContent (elm: Element | null | undefined) {
  let text = '';
  if (elm) {
    for (const child of elm.childNodes) {
      if (child instanceof TextNode || child instanceof CDataNode) {
        text += child.value;
      }
      else if (child instanceof Element) {
        text += getTextContent(child);
      }
    }
  }
  return text;
}

export function readText (elm: Element | null): Text | undefined {
  if (elm?.tagName === 'tx') {
    const child = getFirstChild(elm);
    if (child?.tagName === 'rich') {
      const text: Text = {
        p: [],
      };
      const paragraphs = elm.getElementsByTagName('p');
      for (const para of paragraphs) {
        const p = { text: '' };
        text.p.push(p);
        const ranges = para.getElementsByTagName('r');
        ranges.forEach(range => {
          const t = range.querySelector('t');
          p.text += getTextContent(t);
        });
      }
      return text;
    }
    else if (child?.tagName === 'strRef') {
      const ds = readDataSource(elm);
      if (ds?.type === 'strRef') {
        return ds;
      }
    }
    else if (child?.tagName === 'txData') {
      // ChartEx title/series text: <cx:txData><cx:v>Title text</cx:v></cx:txData>
      const v = child.querySelector('v')?.textContent;
      if (v != null) {
        return { p: [ { text: v } ] };
      }
    }
  }
}
