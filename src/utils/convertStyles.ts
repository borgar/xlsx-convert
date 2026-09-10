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
type FontProps = NonNullable<Xf['font'] | Dxf['font']>;

/**
 * Map font members onto Style properties. `skipDefaults` elides values matching the workbook
 * defaults (the xf path); the dxf path passes false, since a dxf value is explicit even when it
 * coincides with a default.
 */
function addFontStyles (s: Style, font: FontProps, skipDefaults: boolean): void {
  if (font.scheme) {
    s.fontScheme = font.scheme;
  }
  else {
    addStyle(s, 'fontFamily', font.name);
  }
  addStyle(s, 'fontSize', font.size);
  addStyle(s, 'color', font.color, skipDefaults ? { type: 'theme', value: 'dk1' } : null);
  addStyle(s, 'underline', font.underline);
  addStyle(s, 'bold', font.bold, skipDefaults ? false : null);
  addStyle(s, 'italic', font.italic, skipDefaults ? false : null);
}

/** Map border members onto Style properties, skipping colours that match `skipColor` (if given). */
function addBorderStyles (s: Style, border: NonNullable<Xf['border']>, skipColor: SkipValue = null): void {
  const { top, bottom, left, right } = border;
  addStyle(s, 'borderTopStyle', top?.style);
  addStyle(s, 'borderTopColor', top?.color, skipColor);
  addStyle(s, 'borderBottomStyle', bottom?.style);
  addStyle(s, 'borderBottomColor', bottom?.color, skipColor);
  addStyle(s, 'borderLeftStyle', left?.style);
  addStyle(s, 'borderLeftColor', left?.color, skipColor);
  addStyle(s, 'borderRightStyle', right?.style);
  addStyle(s, 'borderRightColor', right?.color, skipColor);
}

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
    addFontStyles(s, xf.font, true);
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
    addBorderStyles(s, xf.border, { type: 'indexed', value: 64 });
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
 * dxf are present in the result. Unlike {@link convertXf}, workbook defaults are not skipped; a
 * dxf value is explicit even when it coincides with one (`<b val="0"/>` un-bolds). A `General`
 * number format is still dropped, though: JSF expresses General as the absence of numberFormat.
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
    addFontStyles(s, dxf.font, false);
  }
  if (dxf.fill) {
    if (dxf.fill.type === 'solid' || dxf.fill.type === 'none') {
      // In a dxf, a solid fill's visible colour comes from the background, not the foreground
      // as in cell xfs. The bundled `pivot-format-records.xlsx` fixture writes a plain yellow
      // fill as `<patternFill patternType="solid"><bgColor rgb="FFFFFF00"/></patternFill>`. The
      // `'none'` branch handles a `patternFill` with the patternType attribute absent.
      addStyle(s, 'fillColor', dxf.fill.bg ?? dxf.fill.fg);
    }
    else {
      addStyle(s, 'fillColor', dxf.fill.bg);
      addStyle(s, 'patternColor', dxf.fill.fg);
      addStyle(s, 'patternStyle', dxf.fill.type);
    }
  }
  if (dxf.border) {
    addBorderStyles(s, dxf.border);
  }
  return s;
}

/**
 * Convert the styles part's dxf table to JSF Styles, producing the workbook's `diffStyles` table.
 * The result is 1:1 with the `<dxfs>` table: each entry's array index equals its OOXML dxfId, so
 * a `PivotFormat.diffStyleId` (carried straight through from `dxfId`) indexes the right entry.
 */
export function convertDxfs (dxfs: readonly Dxf[]): Style[] {
  return dxfs.map(convertDxf);
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
