import type { Document } from '@borgar/simple-xml';
import { attr } from '../utils/attr.ts';
import { COLOR_INDEX } from '../constants.ts';
import { getFirstChild } from '../utils/getFirstChild.ts';

export type Theme = {
  scheme: Record<string, string>;
  indexedColors: string[];
  fontScheme: { major: string, minor: string },
  lineList?: any[],
  fillList?: any[],
  bgFillList?: any[],
  effectList?: any[],
};

export function getBlankTheme (): Theme {
  return {
    // XXX: rename to something like colorScheme?
    scheme: {
      lt1: 'FFFFFF', // Window
      dk1: '000000', // WindowText
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
      // phClr: '', // = equivalent to CSS currentColor
    },
    indexedColors: [ ...COLOR_INDEX ],
    fontScheme: {
      major: 'Aptos Display',
      minor: 'Aptos Narrow',
    },
  };
}

export function handlerTheme (dom: Document): Theme {
  const theme: Theme = getBlankTheme();
  const themeElements = dom.querySelector('theme > themeElements');

  const clrScheme = getFirstChild(themeElements, 'clrScheme');
  clrScheme.children.forEach(child => {
    const key = child.tagName;
    const color = child.children[0];
    if (key in theme.scheme && color) {
      if (color.tagName === 'sysClr') {
        theme.scheme[key] = attr(color, 'lastClr');
      }
      if (color.tagName === 'srgbClr') {
        theme.scheme[key] = attr(color, 'val');
      }
    }
  });

  const fontScheme = getFirstChild(themeElements, 'fontScheme');
  fontScheme.children.forEach(d => {
    if (d.tagName === 'majorFont') {
      const latin = getFirstChild(d, 'latin');
      // fallback to Calibri?
      if (latin) { theme.fontScheme.major = attr(latin, 'typeface', 'Aptos Display'); }
    }
    else if (d.tagName === 'minorFont') {
      const latin = getFirstChild(d, 'latin');
      // fallback to Calibri?
      if (latin) { theme.fontScheme.minor = attr(latin, 'typeface', 'Aptos Narrow'); }
    }
  });

  return theme;
}
