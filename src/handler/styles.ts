import type { Document, Element } from '@borgar/simple-xml';
import type { Theme } from '@jsfkit/types';
import { type Color } from '../color/Color.ts';
import { attr } from '../utils/attr.ts';
import { BUILTIN_FORMATS } from '../constants.ts';
import type { ConversionContext } from '../ConversionContext.ts';
import { readColor } from '../color/readColor.ts';

function valOfNode (node: Element, subNodeName: string, fallback: any = null): string | null {
  const subNode = node.querySelectorAll(subNodeName)[0];
  if (subNode) {
    return attr(subNode, 'val', fallback);
  }
  return fallback;
}

type BorderSide = 'left' | 'right' | 'top' | 'bottom';
type Border = { style: string, color?: Color };
type Borders = Record<BorderSide, Border>;
type Fill = {
  type: string,
  fg?: Color
  bg?: Color
};
type Font = {
  size?: number,
  name: string,
  scheme?: 'major' | 'minor',
  underline?: string,
  bold: boolean,
  italic: boolean,
  color?: Color,
};

export type CellStyleEntry = {
  name: string;
  xfId: number;
  builtinId?: number;
};

export type StyleDefs = {
  cellStyleXfs: Xf[];
  cellXf: Xf[];
  cellStyles: CellStyleEntry[];
  fill: Fill[];
  font: Font[];
  numFmts: Record<number, string>;
  border: Borders[];
};

type Xf = Partial<{
  xfId: string;
  numFmtId: number;
  numFmt: string;
  fillId: number;
  fill: Fill;
  fontId: number;
  font: Font;
  borderId: number;
  border: Borders;
  hAlign: string;
  vAlign: string;
  wrapText: boolean;
  shrinkToFit: boolean;
  textRotation: number;
}>;

function readXf (d: Element, styles: StyleDefs) {
  const xf: Xf = {};

  const xfId = attr(d, 'xfId'); // read from cellStyleXfs
  if (xfId) { xf.xfId = xfId; }

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

  return xf;
}

function readBorder (node: Element, side: BorderSide | 'start' | 'end', theme: Theme, indexedColors: string[]) {
  const b = node.querySelectorAll(side)[0];
  if (b) {
    const color = readColor(b.querySelectorAll('color')[0], theme, indexedColors);
    const style = attr(b, 'style');
    if (color || style) {
      return { style: style, color: color };
    }
  }
}

function readFont (node: Element, theme: Theme, indexedColors: string[]): Font {
  const u = node.querySelectorAll('u')[0];
  const b = node.querySelectorAll('b')[0];
  const i = node.querySelectorAll('i')[0];
  let name = valOfNode(node, 'name');
  if (name === 'Calibri (Body)') {
    name = 'Calibri';
  }
  const scheme = valOfNode(node, 'scheme');
  return {
    size: +valOfNode(node, 'sz'),
    name: name,
    scheme: (scheme === 'major' || scheme === 'minor') ? scheme : undefined,
    underline: u ? attr(u, 'val', 'single') : undefined,
    bold: !!b,
    italic: !!i,
    color: readColor(node.querySelectorAll('color')[0], theme, indexedColors),
  };
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
  };

  // update indexed colors for this conversion
  dom.querySelectorAll('colors > indexedColors > rgbColor')
    .forEach((node, i) => {
      context.indexedColors[i] = attr(node, 'rgb');
    });

  dom.querySelectorAll('numFmts > numFmt')
    .forEach(node => {
      styles.numFmts[attr(node, 'numFmtId')] = attr(node, 'formatCode');
    });

  dom.querySelectorAll('fonts > font')
    .forEach(node => {
      styles.font.push(readFont(node, context.theme, context.indexedColors));
    });

  dom.querySelectorAll('fills > fill > patternFill')
    .forEach(fp => {
      const fgColor = fp.querySelector('fgColor');
      const bgColor = fp.querySelector('bgColor');
      const fill: Fill = { type: attr(fp, 'patternType', 'none') };
      if (fgColor) {
        fill.fg = readColor(fgColor, context.theme, context.indexedColors);
      }
      if (bgColor) {
        fill.bg = readColor(bgColor, context.theme, context.indexedColors);
      }
      styles.fill.push(fill);
    });

  dom.querySelectorAll('borders > border')
    .forEach(d => {
      const borderDefs = {
        left: readBorder(d, 'left', context.theme, context.indexedColors) || readBorder(d, 'start', context.theme, context.indexedColors),
        right: readBorder(d, 'right', context.theme, context.indexedColors) || readBorder(d, 'end', context.theme, context.indexedColors),
        top: readBorder(d, 'top', context.theme, context.indexedColors),
        bottom: readBorder(d, 'bottom', context.theme, context.indexedColors),
      };
      styles.border.push(borderDefs);
    });

  // level 1 (named cell styles)
  dom.querySelectorAll('cellStyleXfs > xf')
    .forEach(d => styles.cellStyleXfs.push(readXf(d, styles)));
  // level 2 (applied formatting)
  dom.querySelectorAll('cellXfs > xf')
    .forEach(d => {
      const xf = readXf(d, styles);
      const sxf: Xf = styles.cellStyleXfs[xf.xfId];
      for (const key in sxf) {
        if (xf[key] == null) {
          xf[key] = sxf[key];
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
        const entry: CellStyleEntry = { name, xfId: +xfId };
        const builtinId = attr(d, 'builtinId');
        if (builtinId != null) {
          entry.builtinId = +builtinId;
        }
        styles.cellStyles.push(entry);
      }
    });

  return styles;
}
