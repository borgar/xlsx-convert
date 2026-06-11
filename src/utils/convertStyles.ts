import type { Dxf, StyleDefs } from '../handler/styles.ts';
import type { NamedStyle, Color as JSFColor, Style } from '@jsfkit/types';

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
    // @ts-expect-error JSFColor is still a JS object at runtime
    if (val[key] !== skip[key]) { return false; }
  }
  return true;
}

const addStyle = (obj: Style, key: keyof Style, val: any, skip: SkipValue = null): number => {
  if (val == null) {
    return 0;
  }
  if (skip != null && isSkipValue(val, skip)) {
    return 0;
  }
  obj[key] = val;
  return 1;
};

type Xf = StyleDefs['cellXf'][number];

function convertXf (xf: Xf, styleDefs: StyleDefs): Style {
  const s: Style = {};

  if (xf.numFmtId) {
    const numFmt = styleDefs.numFmts[xf.numFmtId];
    if (typeof numFmt === 'string' && numFmt.toLowerCase() !== 'general') {
      s.numberFormat = numFmt;
    }
  }

  addStyle(s, 'horizontalAlignment', xf.hAlign);
  addStyle(s, 'verticalAlignment', xf.vAlign, 'bottom');
  addStyle(s, 'wrapText', !!xf.wrapText, false);
  addStyle(s, 'shrinkToFit', !!xf.shrinkToFit, false);
  addStyle(s, 'textRotation', xf.textRotation, 0);
  addStyle(s, 'pivotButton', !!xf.pivotButton, false);

  if (xf.font) {
    const font = xf.font;
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

  if (xf.fill) {
    if (xf.fill.type && xf.fill.type !== 'none') {
      if (xf.fill.type === 'solid') {
        // if it's a solid fill, flip the foreground to the background
        addStyle(s, 'fillColor', xf.fill.fg);
      }
      else {
        addStyle(s, 'fillColor', xf.fill.bg);
        addStyle(s, 'patternColor', xf.fill.fg);
        addStyle(s, 'patternStyle', xf.fill.type, 'none');
      }
    }
  }

  if (xf.border) {
    const { top, bottom, left, right } = xf.border;
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

type NamedStyleResult = { namedStyles: Record<string, NamedStyle>, xfIdToName: Map<number, string> };

function convertNamedStyles (styleDefs: StyleDefs): NamedStyleResult {
  const namedStyles: Record<string, NamedStyle> = {};
  const xfIdToName = new Map<number, string>();

  for (const entry of styleDefs.cellStyles) {
    const baseStyle = convertXf(styleDefs.cellStyleXfs[entry.xfId], styleDefs);

    const cellStyle: NamedStyle = {
      name: entry.name,
      ...baseStyle,
    };
    if (entry.builtinId != null) {
      cellStyle.builtinId = entry.builtinId;
    }

    namedStyles[entry.name] = cellStyle;
    xfIdToName.set(entry.xfId, entry.name);
  }

  return { namedStyles, xfIdToName };
}

/**
 * Convert a differential format (dxf) to a JSF Style. A dxf overlays onto existing formatting,
 * which matches JSF Style's all-properties-optional semantics: only those properties set in the
 * dxf are present in the result. Unlike {@link convertXf}, nothing is skipped as a default; a
 * dxf value is explicit even when it coincides with a workbook default (`<b val="0"/>` un-bolds).
 */
function convertDxf (dxf: Dxf): Style {
  const s: Style = {};
  if (dxf.numFmt && dxf.numFmt.toLowerCase() !== 'general') {
    s.numberFormat = dxf.numFmt;
  }
  addStyle(s, 'horizontalAlignment', dxf.hAlign);
  addStyle(s, 'verticalAlignment', dxf.vAlign);
  addStyle(s, 'wrapText', dxf.wrapText);
  if (dxf.font) {
    const font = dxf.font;
    if (font.scheme) {
      s.fontScheme = font.scheme;
    }
    else {
      addStyle(s, 'fontFamily', font.name);
    }
    addStyle(s, 'fontSize', font.size);
    addStyle(s, 'color', font.color);
    addStyle(s, 'underline', font.underline);
    addStyle(s, 'bold', font.bold);
    addStyle(s, 'italic', font.italic);
  }
  if (dxf.fill) {
    if (dxf.fill.type === 'solid' || dxf.fill.type === 'none') {
      // In a dxf, the visible colour of a solid fill is the BACKGROUND colour (the opposite of
      // cell xfs, where it is the foreground): Excel writes e.g.
      // `<patternFill patternType="solid"><bgColor rgb="FFFFFF00"/></patternFill>` for a plain
      // yellow fill, sometimes omitting patternType entirely (parsed here as 'none').
      addStyle(s, 'fillColor', dxf.fill.bg ?? dxf.fill.fg);
    }
    else {
      addStyle(s, 'fillColor', dxf.fill.bg);
      addStyle(s, 'patternColor', dxf.fill.fg);
      addStyle(s, 'patternStyle', dxf.fill.type);
    }
  }
  if (dxf.border) {
    const { top, bottom, left, right } = dxf.border;
    addStyle(s, 'borderTopStyle', top?.style);
    addStyle(s, 'borderTopColor', top?.color);
    addStyle(s, 'borderBottomStyle', bottom?.style);
    addStyle(s, 'borderBottomColor', bottom?.color);
    addStyle(s, 'borderLeftStyle', left?.style);
    addStyle(s, 'borderLeftColor', left?.color);
    addStyle(s, 'borderRightStyle', right?.style);
    addStyle(s, 'borderRightColor', right?.color);
  }
  return s;
}

/** Convert the styles part's dxf table to JSF Styles, indexed by dxfId. */
export function convertDxfs (styleDefs: StyleDefs): Style[] {
  return styleDefs.dxfs.map(convertDxf);
}

export function convertStyles (styleDefs: StyleDefs): { styles: Style[], namedStyles: Record<string, NamedStyle> } {
  const { namedStyles, xfIdToName } = convertNamedStyles(styleDefs);

  const styles: Style[] = [];
  for (let i = 0; i < styleDefs.cellXf.length; i++) {
    const s = convertXf(styleDefs.cellXf[i], styleDefs);
    const xf = styleDefs.cellXf[i];
    if (xf.xfId != null) {
      const name = xfIdToName.get(+xf.xfId);
      if (name != null && name !== 'Normal') {
        s.extendsStyle = name;
      }
    }
    styles[i] = s;
  }

  return { styles, namedStyles };
}
