import type { Document } from '@borgar/simple-xml';
import { attr } from '../utils/attr.ts';
import { COLOR_INDEX } from '../constants.ts';

export type Theme = {
  scheme: Record<string, string>;
  indexedColors: string[];
};

export function getBlankTheme (): Theme {
  return {
    scheme: {
      lt1: 'Window',     // FFFFFF
      dk1: 'WindowText', // 000000
      lt2: 'E8E8E8',
      dk2: '0E2841',
      accent1: '156082',
      accent2: 'E97132',
      accent3: '196B24',
      accent4: '0F9ED5',
      accent5: 'A02B93',
      accent6: '4EA72E',
      hlink: '467886',
      folHlink: '96607D',
      // bg1: '', // -> dk1
      // bg2: '', // -> dk2
      // tx1: '', // -> lt1
      // tx2: '', // -> lt2
      // phClr: '', // = equivalen to CSS currentColor
    },
    indexedColors: [ ...COLOR_INDEX ],
  };
}

export function handlerTheme (dom: Document): Theme {
  const theme: Theme = getBlankTheme();
  const elements = dom.querySelectorAll('theme > themeElements > clrScheme > *');

  elements.forEach(d => {
    d.children.forEach(c => {
      // One of: [ srgbClr, sysClr ]
      const val = attr(c, 'val');
      theme.scheme[d.tagName] = val;
    });
  });

  return theme;
}
