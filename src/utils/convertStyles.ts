import type { StyleDefs } from '../handler/styles.ts';
import type { JSFStyle } from '../jsf-types.js';

const addStyle = (obj: JSFStyle, key: string, val: any, skip: any = null): number => {
  if (val == null) {
    return 0;
  }
  if (val.hsl) {
    val = String(val);
  }
  if (skip === val) {
    return 0;
  }
  obj[key] = val;
  return 1;
};

function convertStyle (styleDefs, styleIndex: number): JSFStyle {
  const style = styleDefs.cellXf[styleIndex];
  const s: JSFStyle = {};

  if (style.numFmtId) {
    const numFmt = styleDefs.numFmts[style.numFmtId];
    if (typeof numFmt === 'string' && numFmt.toLowerCase() !== 'general') {
      s['number-format'] = numFmt;
    }
  }

  addStyle(s, 'horizontal-alignment', style.hAlign);
  addStyle(s, 'vertical-alignment', style.vAlign, 'bottom');
  addStyle(s, 'wrap-text', !!style.wrapText, false);
  addStyle(s, 'shrink-to-fit', !!style.shrinkToFit, false);

  if (style.font) {
    const font = style.font;
    addStyle(s, 'font-name', font.name, 'Calibri');
    addStyle(s, 'font-size', font.size, 11);
    addStyle(s, 'font-color', font.color, '#000');
    addStyle(s, 'underline', font.underline);
    addStyle(s, 'bold', font.bold, false);
    addStyle(s, 'italic', font.italic, false);
  }

  if (style.fill?.fg) {
    addStyle(s, 'fill-color', style.fill.fg, '#0000');
  }

  if (style.border) {
    const { top, bottom, left, right } = style.border;
    addStyle(s, 'border-top-style', top?.style);
    addStyle(s, 'border-top-color', top?.color, '#000');
    addStyle(s, 'border-bottom-style', bottom?.style);
    addStyle(s, 'border-bottom-color', bottom?.color, '#000');
    addStyle(s, 'border-left-style', left?.style);
    addStyle(s, 'border-left-color', left?.color, '#000');
    addStyle(s, 'border-right-style', right?.style);
    addStyle(s, 'border-right-color', right?.color, '#000');
  }

  return s;
}

export function convertStyles (styleDefs: StyleDefs): JSFStyle[] {
  const styles = [];
  for (let i = 0; i < styleDefs.cellXf.length; i++) {
    styles[i] = convertStyle(styleDefs, i);
  }
  return styles;
}
