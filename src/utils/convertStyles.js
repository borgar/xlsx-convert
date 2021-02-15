const addStyle = (obj, key, val, skip = null) => {
  if (val == null) { return 0; }
  if (val.hsl) { val = String(val); }
  if (skip === val) { return 0; }
  obj[key] = val;
  return 1;
};

module.exports = function (style, haveContent = true) {
  const s = {};
  let a = 0; // count of styles affecting content look
  let b = 0; // count of styles affecting cell look

  a += addStyle(s, 'horizontal-alignment', style.hAlign);
  a += addStyle(s, 'vertical-alignment', style.vAlign);
  a += addStyle(s, 'wrap-text', !!style.wrapText, false);
  a += addStyle(s, 'shrink-to-fit', !!style.shrinkToFit, false);

  if (style.font) {
    a += addStyle(s, 'font-name', style.font.name, 'Calibri');
    a += addStyle(s, 'font-size', style.font.size, 11);
    a += addStyle(s, 'font-color', style.font.color, '#000');
    a += addStyle(s, 'underline', style.font.underline);
    a += addStyle(s, 'bold', style.font.bold, false);
    a += addStyle(s, 'italic', style.font.bold, false);
  }

  if (style.fill && style.fill.fg) {
    b += addStyle(s, 'fill-color', style.fill.fg, '#0000');
  }

  if (style.border) {
    const { top, bottom, left, right } = style.border;
    b += addStyle(s, 'border-top-style', top && top.style);
    b += addStyle(s, 'border-top-color', top && top.color, '#000');
    b += addStyle(s, 'border-bottom-style', bottom && bottom.style);
    b += addStyle(s, 'border-bottom-color', bottom && bottom.color, '#000');
    b += addStyle(s, 'border-left-style', left && left.style);
    b += addStyle(s, 'border-left-color', left && left.color, '#000');
    b += addStyle(s, 'border-right-style', right && right.style);
    b += addStyle(s, 'border-right-color', right && right.color, '#000');
  }

  // for empty cells we only emit styles if there are fills or borders
  if ((a + b) && (b || haveContent)) {
    return s;
  }
};
