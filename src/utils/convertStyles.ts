import { Color } from '../color.ts';
import type { StyleDefs } from '../handler/styles.ts';
import type { Style } from '@jsfkit/types';

const addStyle = (obj: Style, key: string, val: any, skip: any = null): number => {
  if (val == null) {
    return 0;
  }
  if (val instanceof Color) {
    val = val.getJSF();
  }
  if (skip === val) {
    return 0;
  }
  obj[key] = val;
  return 1;
};

function convertStyle (styleDefs: StyleDefs, styleIndex: number): Style {
  const style = styleDefs.cellXf[styleIndex];
  const s: Style = {};

  if (style.numFmtId) {
    const numFmt = styleDefs.numFmts[style.numFmtId];
    if (typeof numFmt === 'string' && numFmt.toLowerCase() !== 'general') {
      s.numberFormat = numFmt;
    }
  }

  addStyle(s, 'horizontalAlignment', style.hAlign);
  addStyle(s, 'verticalAlignment', style.vAlign, 'bottom');
  addStyle(s, 'wrapText', !!style.wrapText, false);
  addStyle(s, 'shrinkToFit', !!style.shrinkToFit, false);
  addStyle(s, 'textRotation', style.textRotation, 0);

  if (style.font) {
    const font = style.font;
    addStyle(s, 'fontFamily', font.name, 'Calibri');
    addStyle(s, 'fontSize', font.size, 11);
    addStyle(s, 'color', font.color, '#000');
    addStyle(s, 'underline', font.underline);
    addStyle(s, 'bold', font.bold, false);
    addStyle(s, 'italic', font.italic, false);
  }

  if (style.fill) {
    if (style.fill.type && style.fill.type !== 'none') {
      if (style.fill.type === 'solid') {
        // if it's a solid fill, flip the foreground to the background
        addStyle(s, 'fillColor', style.fill.fg, '#0000');
      }
      else {
        addStyle(s, 'fillColor', style.fill.bg, '#0000');
        addStyle(s, 'patternColor', style.fill.fg, '#0000');
        addStyle(s, 'patternStyle', style.fill.type, 'none');
      }
    }
  }

  if (style.border) {
    const { top, bottom, left, right } = style.border;
    addStyle(s, 'borderTopStyle', top?.style);
    addStyle(s, 'borderTopColor', top?.color, '#000');
    addStyle(s, 'borderBottomStyle', bottom?.style);
    addStyle(s, 'borderBottomColor', bottom?.color, '#000');
    addStyle(s, 'borderLeftStyle', left?.style);
    addStyle(s, 'borderLeftColor', left?.color, '#000');
    addStyle(s, 'borderRightStyle', right?.style);
    addStyle(s, 'borderRightColor', right?.color, '#000');
  }

  return s;
}

export function convertStyles (styleDefs: StyleDefs): Style[] {
  const styles = [];
  for (let i = 0; i < styleDefs.cellXf.length; i++) {
    styles[i] = convertStyle(styleDefs, i);
  }
  return styles;
}
