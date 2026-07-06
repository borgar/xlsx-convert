import type { Document, Element } from '@borgar/simple-xml';
import type { Color, Theme } from '@jsfkit/types';
import { attr, boolAttr, numAttr } from '../utils/attr.ts';
import { BUILTIN_FORMATS } from '../constants.ts';
import type { ConversionContext } from '../ConversionContext.ts';
import { readColor } from '../color/readColor.ts';
import { addProp } from '../utils/addProp.ts';

function valOfSubNode (node: Element, subNodeName: string): string | undefined {
  const subNode = node.querySelectorAll(subNodeName)[0];
  if (subNode) {
    return attr(subNode, 'val') ?? undefined;
  }
}

type BorderSide = 'left' | 'right' | 'top' | 'bottom';
type Border = { style: string, color?: Color };
type Borders = Record<BorderSide, Border | undefined>;
type Fill = {
  type: string,
  fg?: Color
  bg?: Color
};
type Font = {
  size?: number,
  name?: string,
  scheme?: 'major' | 'minor',
  underline?: string,
  bold: boolean,
  italic: boolean,
  color?: Color,
};

export type NamedStyleEntry = {
  name: string;
  xfId: number;
  builtinId?: number;
};

export type StyleDefs = {
  cellStyleXfs: Xf[];
  cellXf: Xf[];
  cellStyles: NamedStyleEntry[];
  fill: Fill[];
  font: Font[];
  numFmts: Record<number, string>;
  border: Borders[];
  dxfs: Dxf[];
  tableStyles: TableStyleEntry[];
};

/** One `<tableStyleElement>` of a custom table style: a region and its dxf reference. */
export type TableStyleElementEntry = {
  type: string;
  size?: number;
  dxfId?: number;
};

/**
 * A custom (workbook-defined) table or pivot table style (`<tableStyle>`), with its per-region
 * formatting still as references into the {@link StyleDefs.dxfs} table.
 */
export type TableStyleEntry = {
  name: string;
  pivot?: boolean;
  table?: boolean;
  elements: TableStyleElementEntry[];
};

/**
 * A differential format (`<dxf>`): each member is present only when the dxf sets it, since a
 * dxf overlays onto existing formatting rather than fully describing it. Unlike {@link Font},
 * the font members are all optional, so e.g. `<font><b/></font>` sets bold and nothing else.
 */
export type Dxf = {
  font?: {
    bold?: boolean,
    italic?: boolean,
    underline?: string,
    size?: number,
    name?: string,
    scheme?: 'major' | 'minor',
    color?: Color,
  };
  fill?: Fill;
  border?: Borders;
  numFmt?: string;
  hAlign?: string;
  vAlign?: string;
  wrapText?: boolean;
};

type Xf = {
  xfId?: number;
  numFmtId?: number;
  numFmt?: string;
  fillId?: number;
  fill?: Fill;
  fontId?: number;
  font?: Font;
  borderId?: number;
  border?: Borders;
  hAlign?: string;
  vAlign?: string;
  wrapText?: boolean;
  shrinkToFit?: boolean;
  textRotation?: number;
  pivotButton?: boolean;
};

function readXf (d: Element, styles: StyleDefs) {
  const xf: Xf = {};

  const xfId = numAttr(d, 'xfId'); // index into cellStyleXfs
  if (xfId != null) { xf.xfId = xfId; }

  const numFmtId = attr(d, 'numFmtId');
  if (numFmtId) {
    xf.numFmtId = +numFmtId;
    xf.numFmt = styles.numFmts[+numFmtId];
  }

  // Spec says you should only read fill if `applyFill` bool is set
  // but Excel seems to ignore that property and read fill anyway
  const fillId = attr(d, 'fillId') ?? null;
  if (fillId) {
    xf.fillId = +fillId;
    xf.fill = styles.fill[+fillId];
  }

  const fontId = attr(d, 'fontId');
  if (fontId != null) {
    xf.fontId = +fontId;
    xf.font = styles.font[+fontId];
  }

  const borderId = attr(d, 'borderId');
  if (borderId) {
    xf.borderId = +borderId;
    xf.border = styles.border[+borderId];
  }

  const align = d.querySelectorAll('alignment')[0];
  if (align) {
    const hAlign = attr(align, 'horizontal');
    const vAlign = attr(align, 'vertical');
    const wrapText = attr(align, 'wrapText');
    const shrinkToFit = attr(align, 'shrinkToFit');
    const textRotation = attr(align, 'textRotation');
    if (hAlign) { xf.hAlign = hAlign; }
    if (vAlign) { xf.vAlign = vAlign; }
    if (wrapText) { xf.wrapText = !!+wrapText; }
    if (shrinkToFit) { xf.shrinkToFit = !!+shrinkToFit; }
    if (textRotation) { xf.textRotation = +textRotation; }
  }

  const pivotButton = attr(d, 'pivotButton');
  if (pivotButton) { xf.pivotButton = !!+pivotButton; }

  return xf;
}

function readBorder (
  node: Element,
  side: BorderSide | 'start' | 'end',
  theme: Theme,
): Border | undefined {
  const b = node.querySelectorAll(side)[0];
  if (b) {
    const color = readColor(b.querySelectorAll('color')[0], theme);
    const style = attr(b, 'style');
    if (style) {
      return { style: style, color: color };
    }
  }
}

function readFont (node: Element, theme: Theme): Font {
  const u = node.querySelectorAll('u')[0];
  const b = node.querySelectorAll('b')[0];
  const i = node.querySelectorAll('i')[0];
  const name = valOfSubNode(node, 'name');
  const scheme = valOfSubNode(node, 'scheme');
  const sz = valOfSubNode(node, 'sz');
  return {
    size: sz ? +sz : undefined,
    name: name === 'Calibri (Body)' ? 'Calibri' : name,
    scheme: (scheme === 'major' || scheme === 'minor') ? scheme : undefined,
    underline: u ? attr(u, 'val', 'single') : undefined,
    bold: !!b,
    italic: !!i,
    color: readColor(node.querySelectorAll('color')[0], theme),
  };
}

function readBorders (node: Element, theme: Theme): Borders {
  return {
    left: readBorder(node, 'left', theme) || readBorder(node, 'start', theme),
    right: readBorder(node, 'right', theme) || readBorder(node, 'end', theme),
    top: readBorder(node, 'top', theme),
    bottom: readBorder(node, 'bottom', theme),
  };
}

function readPatternFill (fp: Element, theme: Theme): Fill {
  const fgColor = fp.querySelector('fgColor');
  const bgColor = fp.querySelector('bgColor');
  const fill: Fill = { type: attr(fp, 'patternType', 'none') };
  if (fgColor) {
    fill.fg = readColor(fgColor, theme);
  }
  if (bgColor) {
    fill.bg = readColor(bgColor, theme);
  }
  return fill;
}

/**
 * Read a `<dxf>` (differential format) element. Each member of the result is present only when
 * the dxf sets it: `<font><b/></font>` sets bold and nothing else, while `<b val="0"/>`
 * explicitly un-bolds. So this does not reuse {@link readFont}, where absent means false.
 */
function readDxf (d: Element, theme: Theme): Dxf {
  const dxf: Dxf = {};
  const fontEl = d.querySelectorAll('font')[0];
  if (fontEl) {
    const font: Dxf['font'] = {};
    const b = fontEl.querySelectorAll('b')[0];
    if (b) { font.bold = attr(b, 'val', '1') !== '0'; }
    const i = fontEl.querySelectorAll('i')[0];
    if (i) { font.italic = attr(i, 'val', '1') !== '0'; }
    const u = fontEl.querySelectorAll('u')[0];
    if (u) { font.underline = attr(u, 'val', 'single'); }
    const sz = valOfSubNode(fontEl, 'sz');
    if (sz) { font.size = +sz; }
    const name = valOfSubNode(fontEl, 'name');
    if (name) { font.name = name === 'Calibri (Body)' ? 'Calibri' : name; }
    const scheme = valOfSubNode(fontEl, 'scheme');
    if (scheme === 'major' || scheme === 'minor') { font.scheme = scheme; }
    const colorEl = fontEl.querySelectorAll('color')[0];
    if (colorEl) { font.color = readColor(colorEl, theme); }
    dxf.font = font;
  }
  const fillEl = d.querySelectorAll('fill > patternFill')[0];
  if (fillEl) {
    dxf.fill = readPatternFill(fillEl, theme);
  }
  const borderEl = d.querySelectorAll('border')[0];
  if (borderEl) {
    dxf.border = readBorders(borderEl, theme);
  }
  const numFmtEl = d.querySelectorAll('numFmt')[0];
  if (numFmtEl) {
    const code = attr(numFmtEl, 'formatCode');
    if (code != null) { dxf.numFmt = code; }
  }
  const align = d.querySelectorAll('alignment')[0];
  if (align) {
    const hAlign = attr(align, 'horizontal');
    if (hAlign) { dxf.hAlign = hAlign; }
    const vAlign = attr(align, 'vertical');
    if (vAlign) { dxf.vAlign = vAlign; }
    const wrapText = attr(align, 'wrapText');
    if (wrapText) { dxf.wrapText = !!+wrapText; }
  }
  return dxf;
}

export function handlerStyles (dom: Document, context: ConversionContext): StyleDefs {
  const styles: StyleDefs = {
    cellStyleXfs: [],
    cellXf: [],
    cellStyles: [],
    fill: [],
    font: [],
    numFmts: Object.assign({}, BUILTIN_FORMATS),
    border: [],
    dxfs: [],
    tableStyles: [],
  };

  // update indexed colors for this conversion
  dom.querySelectorAll('colors > indexedColors > rgbColor')
    .forEach((node, i) => {
      context.indexedColors[i] = attr(node, 'rgb');
    });

  dom.querySelectorAll('numFmts > numFmt')
    .forEach(node => {
      const fId = numAttr(node, 'numFmtId');
      const code = attr(node, 'formatCode');
      if (fId != null && code != null) {
        styles.numFmts[fId] = code;
      }
    });

  dom.querySelectorAll('fonts > font')
    .forEach(node => {
      styles.font.push(readFont(node, context.theme));
    });

  dom.querySelectorAll('fills > fill > patternFill')
    .forEach(fp => {
      styles.fill.push(readPatternFill(fp, context.theme));
    });

  dom.querySelectorAll('dxfs > dxf')
    .forEach(d => {
      styles.dxfs.push(readDxf(d, context.theme));
    });

  dom.querySelectorAll('borders > border')
    .forEach(d => {
      styles.border.push(readBorders(d, context.theme));
    });

  // custom (workbook-defined) table and pivot table styles
  dom.querySelectorAll('tableStyles > tableStyle')
    .forEach(d => {
      const name = attr(d, 'name');
      if (name == null) { return; }
      const entry: TableStyleEntry = { name: name, elements: [] };
      const pivot = boolAttr(d, 'pivot');
      if (pivot != null) { entry.pivot = pivot; }
      const table = boolAttr(d, 'table');
      if (table != null) { entry.table = table; }
      d.querySelectorAll('tableStyleElement').forEach(el => {
        const type = attr(el, 'type');
        if (type == null) { return; }
        const element: TableStyleElementEntry = { type: type };
        const size = numAttr(el, 'size');
        if (size != null) { element.size = size; }
        const dxfId = numAttr(el, 'dxfId');
        if (dxfId != null) { element.dxfId = dxfId; }
        entry.elements.push(element);
      });
      styles.tableStyles.push(entry);
    });

  // level 1 (named cell styles)
  dom.querySelectorAll('cellStyleXfs > xf')
    .forEach(d => styles.cellStyleXfs.push(readXf(d, styles)));
  // level 2 (applied formatting)
  dom.querySelectorAll('cellXfs > xf')
    .forEach(d => {
      const xf = readXf(d, styles);
      if (xf.xfId != null) {
        const sxf: Xf = styles.cellStyleXfs[xf.xfId];
        for (const key in sxf) {
          const k = key as keyof Xf;
          if (xf[k] == null) {
            addProp(xf, k, sxf[k]);
          }
        }
      }
      styles.cellXf.push(xf);
    });

  // named cell styles (maps names + builtinId to cellStyleXf indices)
  dom.querySelectorAll('cellStyles > cellStyle')
    .forEach(d => {
      const name = attr(d, 'name');
      const xfId = attr(d, 'xfId');
      if (name != null && xfId != null) {
        const entry: NamedStyleEntry = { name, xfId: +xfId };
        const builtinId = attr(d, 'builtinId');
        if (builtinId != null) {
          entry.builtinId = +builtinId;
        }
        styles.cellStyles.push(entry);
      }
    });

  return styles;
}
