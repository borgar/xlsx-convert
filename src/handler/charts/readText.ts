import { Element } from '@borgar/simple-xml';
import type { Text } from './types/Text.ts';
import { getFirstChild } from '../../utils/getFirstChild.ts';
import { readDataSource } from './readDataSource.ts';
import type { ConversionContext } from '../../ConversionContext.ts';
import { RichText } from '../../utils/RichText.ts';
import { resolveNamedRange } from './readChartData.ts';

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
      // ChartEx text: <cx:txData><cx:f>…</cx:f><cx:v>cached text</cx:v></cx:txData>, or
      // <cx:txData><cx:v>literal text</cx:v></cx:txData>. The formula is a defined name. The cached
      // text next to a formula isn't read: the text is evaluated from the formula.
      const f = getFirstChild(child, 'f')?.textContent?.trim();
      if (f) {
        return { type: 'strRef', f: resolveNamedRange(f, context) };
      }
      const v = getFirstChild(child, 'v')?.textContent;
      if (v != null) {
        return { p: [ { text: v } ] };
      }
    }
  }
}
