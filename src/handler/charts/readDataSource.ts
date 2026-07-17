import type { Element } from '@borgar/simple-xml';
import { getFirstChild } from '../../utils/getFirstChild.ts';
import type { NumRef } from './types/data/NumRef.ts';
import type { StrRef } from './types/data/StrRef.ts';
import type { StrData } from './types/data/StrData.ts';
import type { MultiLvlStrRef } from './types/data/MultiLvlStrRef.ts';
import type { NumData } from './types/data/NumData.ts';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function readCacheData (ch: Element, data: NumRef | StrRef) {
  // const numCache = getFirstChild(ch, 'numCache');
  // if (numCache) {
  //   const pts = numCache.children.filter(d => d.tagName === 'pt');
  //   const ptCount = getFirstChild(numCache, 'ptCount');
  //   // all these props are optional!
  //   data.numCache = {
  //     z: getFirstChild(ch, 'formatCode')?.textContent ?? 'General',
  //     ptCount: numValElm(ptCount) ?? pts.length,
  //     pts: pts.map((d: Element) => {
  //       const value = getFirstChild(d, 'v')?.textContent ?? '0';
  //       const r = { v: isNumeric ? +value : value };
  //       const formatCode = getFirstChild(d, 'formatCode');
  //       if (formatCode) {
  //         r.z = formatCode.textContent || 'General';
  //       }
  //       return r;
  //     }),
  //   };
  // }
}

type DataSource = NumRef | NumData | StrRef | StrData | MultiLvlStrRef;

export function readDataSource (element: Element): DataSource | undefined {
  let data: DataSource | undefined = undefined;
  // One of:
  //   <element name="multiLvlStrRef" type="CT_MultiLvlStrRef" minOccurs="1" maxOccurs="1" />
  //   <element name="numRef" type="CT_NumRef" minOccurs="1" maxOccurs="1" />
  //   <element name="strRef" type="CT_StrRef" minOccurs="1" maxOccurs="1" />
  //   <element name="numLit" type="CT_NumData" minOccurs="1" maxOccurs="1" />
  //   <element name="strLit" type="CT_StrData" minOccurs="1" maxOccurs="1" />
  const ch = getFirstChild(element);
  if (ch?.tagName === 'numRef') {
    data = { type: 'numRef', f: '' };
    data.f = getFirstChild(ch, 'f')?.textContent ?? '';
    // if (context.options.includeCacheData) {
    //   readCacheData(ch, data);
    // }
  }
  else if (ch?.tagName === 'strRef') {
    data = { type: 'strRef', f: '' };
    data.f = getFirstChild(ch, 'f')?.textContent ?? '';
    // if (context.options.includeCacheData) {
    //   readCacheData(ch, data);
    // }
  }
  else if (ch?.tagName === 'multiLvlStrRef') {
    // Multi-level (grouped) category/x references span several columns. Consumers resolve the
    // cells through `f` like the other ref types; dropping the element would lose the series'
    // category or x data entirely.
    data = { type: 'mlStrRef', f: getFirstChild(ch, 'f')?.textContent ?? '' };
  }

  return data;
}
