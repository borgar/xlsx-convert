import { Element } from '@borgar/simple-xml';
import type { Text } from './types/Text.ts';
import { getFirstChild } from '../../utils/getFirstChild.ts';
import { readDataSource } from './readDataSource.ts';
import type { ConversionContext } from '../../ConversionContext.ts';
import { RichText } from '../../utils/RichText.ts';

export function readText (elm: Element | null, context: ConversionContext): Text | undefined {
  if (elm?.tagName === 'tx') {
    const child = getFirstChild(elm);
    if (child?.tagName === 'rich') {
      const paragraphs = elm.getElementsByTagName('p');
      return { p: paragraphs.map(d => RichText.from(d).toJSF()) };
    }
    else if (child?.tagName === 'strRef') {
      const ds = readDataSource(elm, context);
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
