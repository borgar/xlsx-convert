const addStyle = (obj, key, val, skip = null) => {
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

function convertStyle (styleDefs, styleIndex) {
  const style = styleDefs.cellXf[styleIndex];
  const s = {};

  if (style.numFmtId) {
    const numFmt = styleDefs.numFmts[style.numFmtId];
    if (numFmt.toLowerCase() !== 'general') {
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

  if (style.fill && style.fill.fg) {
    addStyle(s, 'fill-color', style.fill.fg, '#0000');
  }

  if (style.border) {
    const { top, bottom, left, right } = style.border;
    addStyle(s, 'border-top-style', top && top.style);
    addStyle(s, 'border-top-color', top && top.color, '#000');
    addStyle(s, 'border-bottom-style', bottom && bottom.style);
    addStyle(s, 'border-bottom-color', bottom && bottom.color, '#000');
    addStyle(s, 'border-left-style', left && left.style);
    addStyle(s, 'border-left-color', left && left.color, '#000');
    addStyle(s, 'border-right-style', right && right.style);
    addStyle(s, 'border-right-color', right && right.color, '#000');
  }

  return s;
}

export default function (styleDefs) {
  const styles = [];
  for (let i = 0; i < styleDefs.cellXf.length; i++) {
    styles[i] = convertStyle(styleDefs, i);
  }
  return styles;
}
