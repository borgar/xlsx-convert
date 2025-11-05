import type { Document, Element } from '@borgar/simple-xml';
import { type Color } from '../color.ts';
import { attr } from '../utils/attr.ts';
import { BUILTIN_FORMATS } from '../constants.ts';
import type { ConversionContext } from '../ConversionContext.ts';
import type { Theme } from './theme.ts';
import { readColor } from '../utils/readColor.ts';

function valOfNode (node: Element, subNodeName: string, fallback: any = null): string | null {
  const subNode = node.querySelectorAll(subNodeName)[0];
  if (subNode) {
    return attr(subNode, 'val', fallback);
  }
  return fallback;
}

type BorderSide = 'left' | 'right' | 'top' | 'bottom';
type Border = { style: string, color: Color };
type Borders = Record<BorderSide, Border>;
type Fill = {
  type: string,
  fg: Color
  bg: Color
};
type Font = {
  size?: number,
  name: string,
  underline?: string,
  bold: boolean,
  italic: boolean,
  color: Color,
};

export type StyleDefs = {
  cellStyleXfs: Xf[];
  cellXf: Xf[];
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

function readBorder (node: Element, side: BorderSide | 'start' | 'end', theme: Theme) {
  const b = node.querySelectorAll(side)[0];
  if (b) {
    const color = readColor(b.querySelectorAll('color')[0], theme);
    const style = attr(b, 'style');
    if (color || style) {
      return { style: style, color: color };
    }
  }
}

function readFont (node: Element, theme: Theme): Font {
  const u = node.querySelectorAll('u')[0];
  const b = node.querySelectorAll('b')[0];
  const i = node.querySelectorAll('i')[0];
  let name = valOfNode(node, 'name');
  if (name === 'Calibri (Body)') {
    name = 'Calibri';
  }
  return {
    size: +valOfNode(node, 'sz'),
    name: name,
    underline: u ? attr(u, 'val', 'single') : undefined,
    bold: !!b,
    italic: !!i,
    color: readColor(node.querySelectorAll('color')[0], theme),
  };
}

export function handlerStyles (dom: Document, context: ConversionContext): StyleDefs {
  const styles: StyleDefs = {
    cellStyleXfs: [],
    cellXf: [],
    fill: [],
    font: [],
    numFmts: Object.assign({}, BUILTIN_FORMATS),
    border: [],
  };

  // update indexed colors on the theme
  dom.querySelectorAll('colors > indexedColors > rgbColor')
    .forEach((node, i) => {
      context.theme.indexedColors[i] = attr(node, 'rgb');
    });

  dom.querySelectorAll('numFmts > numFmt')
    .forEach(node => {
      styles.numFmts[attr(node, 'numFmtId')] = attr(node, 'formatCode');
    });

  dom.querySelectorAll('fonts > font')
    .forEach(node => {
      styles.font.push(readFont(node, context.theme));
    });

  dom.querySelectorAll('fills > fill > patternFill')
    .forEach(fp => {
      styles.fill.push({
        type: fp && attr(fp, 'patternType'),
        fg: readColor(fp.querySelectorAll('fgColor')[0], context.theme),
        bg: readColor(fp.querySelectorAll('bgColor')[0], context.theme),
      });
    });

  dom.querySelectorAll('borders > border')
    .forEach(d => {
      const borderDefs = {
        left: readBorder(d, 'left', context.theme) || readBorder(d, 'start', context.theme),
        right: readBorder(d, 'right', context.theme) || readBorder(d, 'end', context.theme),
        top: readBorder(d, 'top', context.theme),
        bottom: readBorder(d, 'bottom', context.theme),
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

  return styles;
}
