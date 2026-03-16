import type { Document, Element as XMLElement } from '@borgar/simple-xml';
import type { Theme, ThemeFontCollection } from '@jsfkit/types';
import { readDrawingMLColor } from '../color/readDrawingMLColor.ts';
import { attr } from '../utils/attr.ts';
import { getFirstChild } from '../utils/getFirstChild.ts';
import type { ConversionContext } from '../ConversionContext.ts';

export function getBlankTheme (): Theme {
  return {
    name: 'Office',
    colorScheme: {
      name: 'Office',
      lt1: { type: 'system', value: 'window' },
      dk1: { type: 'system', value: 'windowText' },
      lt2: { type: 'srgb', value: 'E8E8E8' },
      dk2: { type: 'srgb', value: '0E2841' },
      accent1: { type: 'srgb', value: '156082' },
      accent2: { type: 'srgb', value: 'E97132' },
      accent3: { type: 'srgb', value: '196B24' },
      accent4: { type: 'srgb', value: '0F9ED5' },
      accent5: { type: 'srgb', value: 'A02B93' },
      accent6: { type: 'srgb', value: '4EA72E' },
      hlink: { type: 'srgb', value: '467886' },
      folHlink: { type: 'srgb', value: '96607D' },
    },
    fontScheme: {
      name: 'Office',
      major: { latin: { typeface: 'Aptos Display' } },
      minor: { latin: { typeface: 'Aptos Display' } },
    },
  };
}

export function handlerTheme (dom: Document, context: ConversionContext): Theme {
  const theme: Theme = getBlankTheme();

  // get a derivative of context but use our new theme
  const ctx = Object.create(context);
  ctx.theme = theme;

  const themeElement = dom.querySelector('theme');
  const themeName = attr(themeElement, 'name');
  if (themeName) {
    theme.name = themeName;
  }

  const themeElements = themeElement.querySelector('themeElements');

  const clrScheme = getFirstChild(themeElements, 'clrScheme');
  const clrSchemeName = attr(clrScheme, 'name');
  if (clrSchemeName) {
    theme.colorScheme.name = clrSchemeName;
  }
  clrScheme?.children.forEach(child => {
    const key = child.tagName;
    const colorElm = child.children[0];
    if (key in theme.colorScheme && colorElm) {
      const color = readDrawingMLColor(colorElm);
      if (color) {
        theme.colorScheme[key] = color;
      }
    }
  });

  const fontScheme = getFirstChild(themeElements, 'fontScheme');
  const fontSchemeName = attr(fontScheme, 'name');
  if (fontSchemeName) {
    theme.fontScheme.name = fontSchemeName;
  }
  fontScheme?.children.forEach(d => {
    if (d.tagName === 'majorFont') {
      theme.fontScheme.major = extractFontCollection(d);
    }
    else if (d.tagName === 'minorFont') {
      theme.fontScheme.minor = extractFontCollection(d);
    }
  });

  // const fmtScheme = getFirstChild(themeElements, 'fmtScheme');

  // const fillStyleLst = getFirstChild(fmtScheme, 'fillStyleLst');
  // const fillList = [];
  // fillStyleLst?.children.forEach(d => {
  //   const fill = readFill(d, ctx);
  //   if (fill) { fillList.push(fill); }
  // });
  // theme.fillList = fillList;

  // const bgFillStyleLst = getFirstChild(fmtScheme, 'bgFillStyleLst');
  // const bgFillList = [];
  // bgFillStyleLst?.children.forEach(d => {
  //   const fill = readFill(d, ctx);
  //   if (fill) { bgFillList.push(fill); }
  // });
  // theme.bgFillList = bgFillList;

  // const lnStyleLst = getFirstChild(fmtScheme, 'lnStyleLst');
  // const lineList = [];
  // lnStyleLst?.children.forEach(d => {});
  // theme.lineList = lineList;

  // const effectStyleLst = getFirstChild(fmtScheme, 'effectStyleLst');
  // const effectList = [];
  // effectStyleLst?.children.forEach(d => {});
  // theme.effectList = effectList;

  // const objectDefaults = dom.querySelector('theme > objectDefaults');

  return theme;
}

/**
 * Extracts a font collection from the given OOXML element, which should be either a `majorFont` or
 * `minorFont` element.
 *
 * The font collection must contain a `latin` element (although we include a fallback), plus
 * optional `ea` (east Asian) and `cs` (complex script) elements. These three specify a typeface to
 * use for that script.
 */
function extractFontCollection (fontCollection: XMLElement) {
  const latin = getFirstChild(fontCollection, 'latin');
  const eastAsian = getFirstChild(fontCollection, 'ea');
  const complexScript = getFirstChild(fontCollection, 'cs');

  const font: ThemeFontCollection = {
    latin: {
      typeface: attr(latin, 'typeface', 'Aptos Display'),
    },
  };
  if (eastAsian) {
    font.eastAsian = {
      typeface: attr(eastAsian, 'typeface', ''),
    };
  }
  if (complexScript) {
    font.complexScript = {
      typeface: attr(complexScript, 'typeface', ''),
    };
  }
  return font;
}
