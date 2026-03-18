import { Color } from '../color/Color.ts';
import type { StyleDefs } from '../handler/styles.ts';
import type { Color as JSFColor, Style } from '@jsfkit/types';

/** Style values that can (potentially) be omitted. */
type SkipValue = string | number | boolean | JSFColor | null;

/**
 * Checks whether a style value should be omitted because it matches the given default. For
 * primitives, strict equality is used. For JSF Color objects, all properties of the skip value
 * must match those on val — but a colour with transforms is never skippable, since the transforms
 * produce a different resolved colour even if the base type and value are the same.
 */
function isSkipValue (val: any, skip: SkipValue): boolean {
  // Use strict equality if either value is a primitive.
  if (typeof val !== 'object' || typeof skip !== 'object') {
    return val === skip;
  }
  // Colours with transforms aren't skippable because the transforms produce a different resolved
  // colour even if the base type and value are the same.
  if (val.transforms?.length) { return false; }
  for (const key in skip) {
    if (val[key] !== skip[key]) { return false; }
  }
  return true;
}

const addStyle = (obj: Style, key: string, val: any, skip: SkipValue = null): number => {
  if (val == null) {
    return 0;
  }
  if (val instanceof Color) {
    val = val.getJSF();
  }
  if (skip != null && isSkipValue(val, skip)) {
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
    if (font.scheme) {
      s.fontScheme = font.scheme;
    }
    else {
      addStyle(s, 'fontFamily', font.name);
    }
    addStyle(s, 'fontSize', font.size);
    addStyle(s, 'color', font.color, { type: 'theme', value: 'dk1' });
    addStyle(s, 'underline', font.underline);
    addStyle(s, 'bold', font.bold, false);
    addStyle(s, 'italic', font.italic, false);
  }

  if (style.fill) {
    if (style.fill.type && style.fill.type !== 'none') {
      if (style.fill.type === 'solid') {
        // if it's a solid fill, flip the foreground to the background
        addStyle(s, 'fillColor', style.fill.fg);
      }
      else {
        addStyle(s, 'fillColor', style.fill.bg);
        addStyle(s, 'patternColor', style.fill.fg);
        addStyle(s, 'patternStyle', style.fill.type, 'none');
      }
    }
  }

  if (style.border) {
    const { top, bottom, left, right } = style.border;
    addStyle(s, 'borderTopStyle', top?.style);
    addStyle(s, 'borderTopColor', top?.color, { type: 'indexed', value: 64 });
    addStyle(s, 'borderBottomStyle', bottom?.style);
    addStyle(s, 'borderBottomColor', bottom?.color, { type: 'indexed', value: 64 });
    addStyle(s, 'borderLeftStyle', left?.style);
    addStyle(s, 'borderLeftColor', left?.color, { type: 'indexed', value: 64 });
    addStyle(s, 'borderRightStyle', right?.style);
    addStyle(s, 'borderRightColor', right?.color, { type: 'indexed', value: 64 });
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
