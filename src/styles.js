const readColor = require('./color');
const attr = require('./utils/attr');
const { BUILTIN_FORMATS } = require('./constants');

const valOfNode = (node, subNodeName, fallback = null) => {
  const subNode = node.querySelectorAll(subNodeName)[0];
  if (subNode) {
    return attr(subNode, 'val', fallback);
  }
  return fallback;
};

const readXf = (d, styles) => {
  const xf = {};

  const xfId = attr(d, 'xfId'); // read from cellStyleXfs
  if (xfId) { xf.xfId = xfId; }

  const numFmtId = attr(d, 'numFmtId');
  if (numFmtId) {
    xf.numFmtId = +numFmtId;
    xf.numFmt = styles.numFmts[+numFmtId];
  }

  const fillId = +attr(d, 'applyFill', 0) ? attr(d, 'fillId') : null;
  if (fillId) {
    xf.fillId = +fillId;
    xf.fill = styles.fill[+fillId];
  }

  const fontId = +attr(d, 'applyFont', 0) ? attr(d, 'fontId') : null;
  if (fontId) {
    xf.fontId = +fontId;
    xf.font = styles.font[+fontId];
  }

  const borderId = +attr(d, 'applyBorder', 0) ? attr(d, 'borderId') : null;
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
    if (hAlign) { xf.hAlign = hAlign; }
    if (vAlign) { xf.vAlign = vAlign; }
    if (wrapText) { xf.wrapText = !!+wrapText; }
    if (shrinkToFit) { xf.shrinkToFit = !!+shrinkToFit; }
  }

  return xf;
};

const readBorder = (node, side, theme) => {
  const b = node.querySelectorAll(side)[0];
  if (b) {
    const color = readColor(node.querySelectorAll('color')[0], theme);
    const style = attr(b, 'style');
    if (color || style) {
      return { style: style, color: color };
    }
  }
};

const readFont = (node, theme) => {
  const u = node.querySelectorAll('u')[0];
  const b = node.querySelectorAll('b')[0];
  const i = node.querySelectorAll('i')[0];
  let name = valOfNode(node, 'name');
  if (name === 'Calibri (Body)') {
    name = 'Calibri';
  }
  return {
    size: +valOfNode(node, 'sz') || null,
    name: name,
    underline: u ? attr(u, 'val', 'single') : null,
    bold: !!b,
    italic: !!i,
    color: readColor(node.querySelectorAll('color')[0], theme)
  };
};

module.exports = (dom, wb) => {
  const styles = {
    cellStyleXfs: [],
    cellXf: [],
    fill: [],
    font: [],
    numFmts: Object.assign({}, BUILTIN_FORMATS),
    border: []
  };

  dom.querySelectorAll('numFmts > numFmt')
    .forEach(node => {
      styles.numFmts[attr(node, 'numFmtId')] = attr(node, 'formatCode');
    });

  dom.querySelectorAll('fonts > font')
    .forEach(node => {
      styles.font.push(readFont(node, wb.theme));
    });

  dom.querySelectorAll('fills > fill > patternFill')
    .forEach(fp => {
      const type = fp && attr(fp, 'patternType');
      styles.fill.push({
        type: type,
        fg: type === 'solid' ? readColor(fp.querySelectorAll('fgColor')[0], wb.theme) : null
        // bg: type === 'solid' ? readColor(child(fp, 'bgColor'), wb.theme) : null,
      });
    });

  dom.querySelectorAll('borders > border')
    .forEach(d => {
      styles.border.push({
        left: readBorder(d, 'left', wb.theme),
        right: readBorder(d, 'right', wb.theme),
        top: readBorder(d, 'top', wb.theme),
        bottom: readBorder(d, 'bottom', wb.theme)
      });
    });

  // level 1 (named cell styles)
  dom.querySelectorAll('cellStyleXfs > xf')
    .forEach(d => styles.cellStyleXfs.push(readXf(d, styles)));
  // level 2 (applied formatting)
  dom.querySelectorAll('cellXfs > xf')
    .forEach(d => {
      const xf = readXf(d, styles);
      const sxf = styles.cellStyleXfs[xf.xfId];
      for (const key in sxf) {
        if (xf[key] == null) {
          xf[key] = sxf[key];
        }
      }
      styles.cellXf.push(xf);
    });

  dom.querySelectorAll('cellStyles > cellStyle')
    .forEach(d => {
      /*
      <cellStyles count="1">
        <cellStyle builtinId="0" name="Normal" xfId="0" />
      </cellStyles>
      */
    });

  dom.querySelectorAll('dxfs > dxf')
    .forEach(d => {
      /*
      <dxf>
        <font>
          <color rgb="FF9C5700" />
        </font>
        <fill>
          <patternFill>
            <bgColor rgb="FFFFEB9C" />
          </patternFill>
        </fill>
      </dxf>
      */
    });

  // tableStyles
  dom.querySelectorAll('extLst > ext')
    .forEach(d => {
      /*
      <ext uri="{EB79DEF2-80B8-43e5-95BD-54CBDDF9020C}" xmlns:x14="http://schemas.microsoft.com/office/spreadsheetml/2009/9/main">
        <x14:slicerStyles defaultSlicerStyle="SlicerStyleLight1" />
      </ext>
      */
    });

  return styles;
};
