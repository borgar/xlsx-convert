// src/index.ts
import * as fs from "fs/promises";
import path2 from "path";
import JSZip from "jszip";
import { parseXML } from "@borgar/simple-xml";

// src/utils/convertStyles.ts
var addStyle = (obj, key, val, skip = null) => {
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
function convertStyle(styleDefs, styleIndex) {
  const style = styleDefs.cellXf[styleIndex];
  const s = {};
  if (style.numFmtId) {
    const numFmt = styleDefs.numFmts[style.numFmtId];
    if (numFmt.toLowerCase() !== "general") {
      s["number-format"] = numFmt;
    }
  }
  addStyle(s, "horizontal-alignment", style.hAlign);
  addStyle(s, "vertical-alignment", style.vAlign, "bottom");
  addStyle(s, "wrap-text", !!style.wrapText, false);
  addStyle(s, "shrink-to-fit", !!style.shrinkToFit, false);
  if (style.font) {
    const font = style.font;
    addStyle(s, "font-name", font.name, "Calibri");
    addStyle(s, "font-size", font.size, 11);
    addStyle(s, "font-color", font.color, "#000");
    addStyle(s, "underline", font.underline);
    addStyle(s, "bold", font.bold, false);
    addStyle(s, "italic", font.italic, false);
  }
  if (style.fill?.fg) {
    addStyle(s, "fill-color", style.fill.fg, "#0000");
  }
  if (style.border) {
    const { top, bottom, left, right } = style.border;
    addStyle(s, "border-top-style", top?.style);
    addStyle(s, "border-top-color", top?.color, "#000");
    addStyle(s, "border-bottom-style", bottom?.style);
    addStyle(s, "border-bottom-color", bottom?.color, "#000");
    addStyle(s, "border-left-style", left?.style);
    addStyle(s, "border-left-color", left?.color, "#000");
    addStyle(s, "border-right-style", right?.style);
    addStyle(s, "border-right-color", right?.color, "#000");
  }
  return s;
}
function convertStyles(styleDefs) {
  const styles = [];
  for (let i = 0; i < styleDefs.cellXf.length; i++) {
    styles[i] = convertStyle(styleDefs, i);
  }
  return styles;
}

// src/ConversionContext.ts
var ConversionContext = class {
  workbook;
  sst;
  persons;
  options;
  rels;
  theme;
  richStruct;
  richValues;
  metadata;
  sheetLinks;
  comments;
  externalLinks;
  filename;
  _shared;
  _merged;
  _arrayFormula;
  // ??
  constructor() {
    this.rels = [];
    this.options = {};
    this.workbook = null;
    this.sst = [];
    this.persons = {};
    this.theme = { scheme: [], indexedColors: [] };
    this.richStruct = [];
    this.richValues = null;
    this.metadata = null;
    this.sheetLinks = [];
    this.comments = {};
    this.externalLinks = [];
    this.filename = "";
    this._shared = {};
    this._merged = {};
    this._arrayFormula = [];
  }
};

// src/handler/rels.ts
import path from "path";

// src/utils/attr.ts
function attr(node, name, fallBack = null) {
  if (node.hasAttribute(name)) {
    return node.getAttribute(name);
  }
  return fallBack;
}
function numAttr(node, name, fallBack = null) {
  const v = attr(node, name);
  return v == null ? fallBack : +v;
}
function boolAttr(node, name, fallBack = null) {
  const v = attr(node, name, fallBack);
  return v == null ? fallBack : !!+v;
}

// src/constants.ts
var REL_PREFIXES = [
  // standard
  "http://schemas.microsoft.com/office/2017/10/relationships/",
  "http://schemas.microsoft.com/office/2017/06/relationships/",
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships/",
  "http://schemas.openxmlformats.org/package/2006/relationships/",
  // strict
  "http://purl.oclc.org/ooxml/officeDocument/relationships/"
];
var BUILTIN_FORMATS = {
  0: "General",
  1: "0",
  2: "0.00",
  3: "#,##0",
  4: "#,##0.00",
  // These next four are locale dependent. For example the Icelandic locale uses `#,##0 "kr.";-#,##0 "kr."`
  5: '"$"#,##0_);("$"#,##0)',
  6: '"$"#,##0_);[Red]("$"#,##0)',
  7: '"$"#,##0.00_);("$"#,##0.00)',
  8: '"$"#,##0.00_);[Red]("$"#,##0.00)',
  9: "0%",
  10: "0.00%",
  11: "0.00E+00",
  12: "# ?/?",
  13: "# ??/??",
  // Format 14, Excel's default "Short Date" is very locale dependent:
  // It seem to use OS short date format: "1/2/09", "2.1.1909", "02-01-1909"
  14: "m/d/yy",
  // Next three have locale dependent delimiter, and possibly more:
  15: "d-mmm-yy",
  16: "d-mmm",
  17: "mmm-yy",
  18: "h:mm AM/PM",
  19: "h:mm:ss AM/PM",
  20: "h:mm",
  21: "h:mm:ss",
  37: "#,##0_);(#,##0)",
  38: "#,##0_);[Red](#,##0)",
  39: "#,##0.00_);(#,##0.00)",
  40: "#,##0.00_);[Red](#,##0.00)",
  41: '_(* #,##0_);_(* \\(#,##0\\);_(* "-"_);_(@_)',
  42: '_("$"* #,##0_);_("$"* \\(#,##0\\);_("$"* "-"_);_(@_)',
  43: '_(* #,##0.00_);_(* \\(#,##0.00\\);_(* "-"??_);_(@_)',
  44: '_("$"* #,##0.00_);_("$"* \\(#,##0.00\\);_("$"* "-"??_);_(@_)',
  45: "mm:ss",
  46: "[h]:mm:ss",
  47: "mm:ss.0",
  48: "##0.0E+0",
  49: "@",
  55: "yyyy/mm/dd"
};
[
  [22, 21],
  [23, 21],
  [24, 21],
  [25, 21],
  [26, 14],
  [27, 37],
  [28, 38],
  [29, 39],
  [30, 40],
  [31, 41],
  [32, 42],
  [33, 43],
  [34, 44],
  [35, 45],
  [36, 46]
].forEach(([to, from]) => {
  BUILTIN_FORMATS[to] = BUILTIN_FORMATS[from];
});
var COLOR_INDEX = [
  "FF000000",
  "FFFFFFFF",
  "FFFF0000",
  "FF00FF00",
  "FF0000FF",
  // 0-4
  "FFFFFF00",
  "FFFF00FF",
  "FF00FFFF",
  "FF000000",
  "FFFFFFFF",
  // 5-9
  "FFFF0000",
  "FF00FF00",
  "FF0000FF",
  "FFFFFF00",
  "FFFF00FF",
  // 10-14
  "FF00FFFF",
  "FF800000",
  "FF008000",
  "FF000080",
  "FF808000",
  // 15-19
  "FF800080",
  "FF008080",
  "FFC0C0C0",
  "FF808080",
  "FF9999FF",
  // 20-24
  "FF993366",
  "FFFFFFCC",
  "FFCCFFFF",
  "FF660066",
  "FFFF8080",
  // 25-29
  "FF0066CC",
  "FFCCCCFF",
  "FF000080",
  "FFFF00FF",
  "FFFFFF00",
  // 30-34
  "FF00FFFF",
  "FF800080",
  "FF800000",
  "FF008080",
  "FF0000FF",
  // 35-39
  "FF00CCFF",
  "FFCCFFFF",
  "FFCCFFCC",
  "FFFFFF99",
  "FF99CCFF",
  // 40-44
  "FFFF99CC",
  "FFCC99FF",
  "FFFFCC99",
  "FF3366FF",
  "FF33CCCC",
  // 45-49
  "FF99CC00",
  "FFFFCC00",
  "FFFF9900",
  "FFFF6600",
  "FF666699",
  // 50-54
  "FF969696",
  "FF003366",
  "FF339966",
  "FF003300",
  "FF333300",
  // 55-59
  "FF993300",
  "FF993366",
  "FF333399",
  "FF333333",
  "System Foreground",
  // 60-64
  "System Background"
  // 65
];
var NAMED_COLORS = {
  // not sure why this is reversed?
  "system foreground": "FF000000",
  "system background": "FFFFFFFF",
  // 'system foreground': 'FFFFFFFF',
  // 'system background': 'FF000000',
  "activeborder": "FFB4B4B4",
  "activetitle": "FF99B4D1",
  "appworkspace": "FFABABAB",
  "background": "FF000000",
  "buttonalternateface": "FF000000",
  "buttondkshadow": "FF696969",
  "buttonface": "FFF0F0F0",
  "buttonhilight": "FFFFFFFF",
  "buttonlight": "FFE3E3E3",
  "buttonshadow": "FFA0A0A0",
  "buttontext": "FF000000",
  "gradientactivetitle": "FFB9D1EA",
  "gradientinactivetitle": "FFD7E4F2",
  "graytext": "FF6D6D6D",
  "hilight": "FF3399FF",
  "hilighttext": "FFFFFFFF",
  "hottrackingcolor": "FF0066CC",
  "inactiveborder": "FFF4F7FC",
  "inactivetitle": "FFBFCDDB",
  "inactivetitletext": "FF000000",
  "infotext": "FF000000",
  "infowindow": "FFFFFFE1",
  "menu": "FFF0F0F0",
  "menubar": "FFF0F0F0",
  "menuhilight": "FF3399FF",
  "menutext": "FF000000",
  "scrollbar": "FFC8C8C8",
  "titletext": "FF000000",
  "window": "FFFFFFFF",
  "windowframe": "FF646464",
  "windowtext": "FF000000"
};

// src/handler/rels.ts
function handlerRels(dom, basepath = "xl/workbook.xml") {
  basepath = path.dirname(basepath);
  const rels = [];
  if (dom) {
    dom.querySelectorAll("Relationship").forEach((d) => {
      const mode = attr(d, "TargetMode");
      let type = attr(d, "Type");
      let target = attr(d, "Target");
      for (const p of REL_PREFIXES) {
        if (type.startsWith(p)) {
          type = type.slice(p.length);
          if (mode !== "External") {
            target = path.join(basepath, target);
          }
          break;
        }
      }
      rels.push({
        id: attr(d, "Id"),
        type,
        target
      });
    });
  }
  return rels;
}

// src/utils/normalizeFormula.ts
import {
  isFunction,
  isReference,
  parseA1Ref,
  parseStructRef,
  stringifyA1Ref,
  stringifyStructRef,
  tokenTypes,
  tokenize
} from "@borgar/fx";
function updateContext(ref, externalLinks) {
  const context = [];
  if (ref.workbookName && isFinite(+ref.workbookName)) {
    const wbIndex = +ref.workbookName - 1;
    if (externalLinks[wbIndex]) {
      context.push(externalLinks[wbIndex].filename);
    }
  }
  if (ref.sheetName) {
    context.push(ref.sheetName);
  }
  return context;
}
function normalizeFormula(formula, wb) {
  const tokens = tokenize(formula.normalize(), { xlsx: true });
  let normalized = "";
  tokens.forEach((t) => {
    if (isFunction(t)) {
      normalized += t.value.replace(/^(?:_xlfn\.|_xludf\.|_xlws\.)+/i, "");
      return;
    } else if (isReference(t) && wb?.externalLinks) {
      if (t.type === tokenTypes.REF_NAMED) {
        t.value = t.value.replace(/^(?:_xlpm\.)/ig, "");
      }
      if (t.value.includes("[")) {
        let newValue;
        if (t.type === tokenTypes.REF_STRUCT) {
          const ref = parseStructRef(t.value, { xlsx: true });
          if (ref.table && wb.tables?.length) {
          }
          ref.context = updateContext(ref, wb.externalLinks);
          newValue = stringifyStructRef(ref);
        } else {
          const ref = parseA1Ref(t.value, { xlsx: true });
          ref.context = updateContext(ref, wb.externalLinks);
          newValue = stringifyA1Ref(ref);
        }
        normalized += newValue;
        return;
      }
    }
    normalized += t.value;
  });
  return normalized;
}

// src/utils/typecast.ts
function toInt(n) {
  return n == null ? null : Math.floor(+n);
}
function toNum(n) {
  if (n == null) {
    return null;
  }
  if (/[.Ee]/.test(n)) {
    return Number(n);
  }
  return toInt(n);
}

// src/handler/workbook.ts
function handlerWorkbook(dom, context) {
  const wb = {
    filename: context.filename,
    sheets: [],
    names: [],
    tables: [],
    styles: [],
    // charts: [],
    calculation_properties: {
      iterate: false,
      iterate_count: 100,
      iterate_delta: 1e-3
    },
    // externals: [],
    epoch: 1900
  };
  dom.querySelectorAll("sheets > sheet").forEach((d) => {
    context.sheetLinks.push({
      name: attr(d, "name"),
      index: numAttr(d, "sheetId"),
      rId: attr(d, "r:id")
    });
  });
  dom.getElementsByTagName("definedName").forEach((d) => {
    const name = {
      name: attr(d, "name"),
      value: normalizeFormula(d.textContent, context)
    };
    const localSheetId = attr(d, "localSheetId");
    if (localSheetId) {
      name.scope = context.sheetLinks[+localSheetId].name;
    }
    wb.names.push(name);
  });
  const pr = dom.querySelectorAll("workbook > workbookPr")[0];
  wb.epoch = pr && numAttr(pr, "date1904") ? 1904 : 1900;
  const calcPr = dom.getElementsByTagName("calcPr")[0];
  if (calcPr) {
    const iterate = toInt(attr(calcPr, "iterate"));
    if (iterate && isFinite(iterate)) {
      wb.calculation_properties = {
        iterate: true,
        iterate_count: toInt(numAttr(calcPr, "iterateCount", 100)),
        iterate_delta: numAttr(calcPr, "iterateDelta", 1e-3)
      };
    }
  }
  return wb;
}

// src/handler/sharedstrings.ts
function handlerSharedStrings(dom) {
  const sst = dom.querySelectorAll("sst")[0];
  const stringTable = sst.querySelectorAll("si").map((d) => {
    return d.querySelectorAll("t").map((d2) => d2.textContent).join("");
  });
  const count = numAttr(sst, "uniqueCount", 0);
  if (count !== stringTable.length) {
    console.warn("String table did not contain correct amount of entries.");
    console.warn(`I got ${stringTable.length}, but expected ${count}`);
  }
  return stringTable;
}

// src/handler/persons.ts
function handlerPersons(dom) {
  const persons = {};
  dom.querySelectorAll("personlist > person").forEach((person) => {
    persons[attr(person, "id")] = attr(person, "displayName");
  });
  return persons;
}

// src/handler/theme.ts
var colorIndexes = {
  lt1: 0,
  // Light 1
  dk1: 1,
  // Dark 1
  lt2: 2,
  // Light 2
  dk2: 3,
  // Dark 2
  accent1: 4,
  // Accent 1
  accent2: 5,
  // Accent 2
  accent3: 6,
  // Accent 3
  accent4: 7,
  // Accent 4
  accent5: 8,
  // Accent 5
  accent6: 9,
  // Accent 6
  hlink: 10,
  // Hyperlink
  folHlink: 11
  // Followed Hyperlink
};
function handlerTheme(dom) {
  const theme = {
    // FIXME: what is the default windows Excel color scheme? (clue: not this)
    scheme: [
      "WindowText",
      "Window",
      "FF000000",
      "FF000000",
      "FF000000",
      "FF000000",
      "FF000000",
      "FF000000",
      "FF000000",
      "FF000000",
      "FF000000",
      "FF000000"
    ],
    indexedColors: [...COLOR_INDEX]
  };
  const elements = dom.querySelectorAll("theme > themeElements > clrScheme > *");
  elements.forEach((d) => {
    let index = colorIndexes[d.tagName];
    if (index == null) {
      index = theme.scheme.length;
    }
    d.children.forEach((c) => {
      const val = attr(c, "val");
      if (c.tagName === "sysClr") {
        theme.scheme[index] = val;
      }
      if (c.tagName === "srgbClr") {
        theme.scheme[index] = "FF" + val;
      }
    });
  });
  return theme;
}

// src/color.ts
import { rgb, hsl } from "d3-color";
function bound(c) {
  if (c < 0) {
    return 0;
  }
  if (c > 255) {
    return 255;
  }
  return ~~c;
}
var Color = class {
  type;
  r;
  g;
  b;
  a;
  src;
  name;
  tint;
  constuctor() {
    this.type = null;
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.a = 1;
    this.src = "";
    this.name = "";
    this.tint = 0;
  }
  rgb() {
    return rgb(this.r, this.g, this.b);
  }
  hsl() {
    return hsl(this.rgb());
  }
  toJSON() {
    return this.toString();
  }
  toRgba() {
    return `rgba(${bound(this.r)},${bound(this.g)},${bound(this.b)},${this.a})`;
  }
  toString() {
    if (!this.a) {
      return "#0000";
    }
    let s = "" + bound(this.r).toString(16).padStart(2, "0") + bound(this.g).toString(16).padStart(2, "0") + bound(this.b).toString(16).padStart(2, "0");
    if (this.a !== 1) {
      s += bound(this.a * 255).toString(16).padStart(2, "0");
    }
    if (/^(.)\1(.)\2(.)\3(?:(.)\4)?$/.test(s)) {
      s = s[0] + s[2] + s[4] + (s[6] || "");
    }
    return "#" + s.toUpperCase();
  }
};
function readColor(node, theme) {
  if (!node) {
    return null;
  }
  const color = new Color();
  let argb = attr(node, "rgb");
  if (argb) {
    color.type = "rgb";
    color.src = argb;
  }
  const indexed = attr(node, "indexed");
  if (indexed) {
    color.type = "index";
    color.src = indexed;
    argb = theme.indexedColors[+indexed];
  }
  const _theme = attr(node, "theme");
  if (_theme && theme) {
    color.type = "theme";
    color.src = _theme;
    argb = theme.scheme[_theme];
  }
  argb = argb?.toLowerCase();
  if (argb in NAMED_COLORS) {
    color.name = argb;
    argb = NAMED_COLORS[argb];
  }
  if (argb) {
    color.a = parseInt(argb.slice(0, 2), 16) / 255;
    color.r = parseInt(argb.slice(2, 4), 16);
    color.g = parseInt(argb.slice(4, 6), 16);
    color.b = parseInt(argb.slice(6, 8), 16);
  }
  const tint = numAttr(node, "tint", 0);
  if (tint) {
    color.tint = tint;
    const h = color.hsl();
    if (tint < 0) {
      const \u0190 = 1 + tint;
      h.l = \u0190 * h.l;
    } else {
      const \u0190 = 1 - tint;
      h.l = \u0190 * h.l + (1 - \u0190);
    }
    const rgb2 = h.rgb();
    color.r = rgb2.r;
    color.g = rgb2.g;
    color.b = rgb2.b;
  }
  return color.type ? color : null;
}

// src/handler/styles.ts
function valOfNode(node, subNodeName, fallback = null) {
  const subNode = node.querySelectorAll(subNodeName)[0];
  if (subNode) {
    return attr(subNode, "val", fallback);
  }
  return fallback;
}
function readXf(d, styles) {
  const xf = {};
  const xfId = attr(d, "xfId");
  if (xfId) {
    xf.xfId = xfId;
  }
  const numFmtId = attr(d, "numFmtId");
  if (numFmtId) {
    xf.numFmtId = +numFmtId;
    xf.numFmt = styles.numFmts[+numFmtId];
  }
  const fillId = boolAttr(d, "applyFill") ? attr(d, "fillId") : null;
  if (fillId) {
    xf.fillId = +fillId;
    console.log(styles.fill[+fillId]);
    xf.fill = styles.fill[+fillId];
  }
  const fontId = attr(d, "fontId");
  if (fontId != null) {
    xf.fontId = +fontId;
    xf.font = styles.font[+fontId];
  }
  const borderId = attr(d, "borderId");
  if (borderId) {
    xf.borderId = +borderId;
    xf.border = styles.border[+borderId];
  }
  const align = d.querySelectorAll("alignment")[0];
  if (align) {
    const hAlign = attr(align, "horizontal");
    const vAlign = attr(align, "vertical");
    const wrapText = attr(align, "wrapText");
    const shrinkToFit = attr(align, "shrinkToFit");
    if (hAlign) {
      xf.hAlign = hAlign;
    }
    if (vAlign) {
      xf.vAlign = vAlign;
    }
    if (wrapText) {
      xf.wrapText = !!+wrapText;
    }
    if (shrinkToFit) {
      xf.shrinkToFit = !!+shrinkToFit;
    }
  }
  return xf;
}
function readBorder(node, side, theme) {
  const b = node.querySelectorAll(side)[0];
  if (b) {
    const color = readColor(b.querySelectorAll("color")[0], theme);
    const style = attr(b, "style");
    if (color || style) {
      return { style, color };
    }
  }
}
function readFont(node, theme) {
  const u = node.querySelectorAll("u")[0];
  const b = node.querySelectorAll("b")[0];
  const i = node.querySelectorAll("i")[0];
  let name = valOfNode(node, "name");
  if (name === "Calibri (Body)") {
    name = "Calibri";
  }
  return {
    size: +valOfNode(node, "sz") || null,
    name,
    underline: u ? attr(u, "val", "single") : null,
    bold: !!b,
    italic: !!i,
    color: readColor(node.querySelectorAll("color")[0], theme)
  };
}
function handlerStyles(dom, context) {
  const styles = {
    cellStyleXfs: [],
    cellXf: [],
    fill: [],
    font: [],
    numFmts: Object.assign({}, BUILTIN_FORMATS),
    border: []
  };
  dom.querySelectorAll("colors > indexedColors > rgbColor").forEach((node, i) => {
    context.theme.indexedColors[i] = attr(node, "rgb");
  });
  dom.querySelectorAll("numFmts > numFmt").forEach((node) => {
    styles.numFmts[attr(node, "numFmtId")] = attr(node, "formatCode");
  });
  dom.querySelectorAll("fonts > font").forEach((node) => {
    styles.font.push(readFont(node, context.theme));
  });
  dom.querySelectorAll("fills > fill > patternFill").forEach((fp) => {
    const type = fp && attr(fp, "patternType");
    const isSolid = type === "solid";
    styles.fill.push({
      type,
      fg: isSolid ? readColor(fp.querySelectorAll("fgColor")[0], context.theme) : null
      // bg: isSolid' ? readColor(child(fp, 'bgColor'), wb.theme) : null,
    });
  });
  dom.querySelectorAll("borders > border").forEach((d) => {
    const borderDefs = {
      left: readBorder(d, "left", context.theme) || readBorder(d, "start", context.theme),
      right: readBorder(d, "right", context.theme) || readBorder(d, "end", context.theme),
      top: readBorder(d, "top", context.theme),
      bottom: readBorder(d, "bottom", context.theme)
    };
    styles.border.push(borderDefs);
  });
  dom.querySelectorAll("cellStyleXfs > xf").forEach((d) => styles.cellStyleXfs.push(readXf(d, styles)));
  dom.querySelectorAll("cellXfs > xf").forEach((d) => {
    const xf = readXf(d, styles);
    const sxf = styles.cellStyleXfs[xf.xfId];
    for (const key in sxf) {
      if (xf[key] == null) {
        xf[key] = sxf[key];
      }
    }
    styles.cellXf.push(xf);
  });
  return styles;
}

// src/handler/rdstuct.ts
function handlerRDStruct(dom) {
  const structures = [];
  dom.querySelectorAll("rvStructures > s").forEach((s) => {
    structures.push({
      type: attr(s, "t"),
      keys: s.getElementsByTagName("k").map((k) => ({
        name: attr(k, "n"),
        type: attr(k, "t")
      }))
    });
  });
  return structures;
}

// src/handler/rdvalue.ts
function handlerRDValue(dom, context) {
  const values = [];
  const structures = context.richStruct || [];
  dom.querySelectorAll("rvData > rv").forEach((rv) => {
    const nth = numAttr(rv, "s", 0);
    const s = structures[nth];
    const val = { _type: s.type };
    rv.getElementsByTagName("v").forEach((k, i) => {
      const def = s.keys[i];
      let v = k.textContent;
      if (def.type === "i") {
        v = Math.floor(+v);
      }
      val[def.name] = v;
    });
    values.push(val);
  });
  return values;
}

// src/handler/metadata.ts
function parseBk(bk, tables) {
  const rc = bk.getElementsByTagName("rc")[0];
  const t = numAttr(rc, "t", 0);
  const v = numAttr(rc, "v", 0);
  const r = tables[t - 1];
  if (!r?.values[v]) {
    throw new Error(`Can't reach meta-value ${t}/${v} in metadata.xml`);
  }
  return r.values[v];
}
function handlerMetaData(dom, context) {
  const tables = [];
  dom.getElementsByTagName("futureMetadata").forEach((fMD) => {
    const table = [];
    const metaName = attr(fMD, "name");
    tables.push({ name: metaName, values: table });
    fMD.querySelectorAll("bk ext").forEach((ext) => {
      if (metaName === "XLDAPR") {
        const dAP = ext.getElementsByTagName("dynamicArrayProperties")[0];
        table.push({
          _type: "_dynamicArray",
          fCollapsed: numAttr(dAP, "fCollapsed"),
          fDynamic: numAttr(dAP, "fDynamic")
        });
      } else if (metaName === "XLRICHVALUE") {
        const rvb = ext.getElementsByTagName("rvb")[0];
        table.push(context.richValues[numAttr(rvb, "i", 0)]);
      }
    });
  });
  const cells = dom.querySelectorAll("cellMetadata > bk").map((bk) => parseBk(bk, tables));
  const values = dom.querySelectorAll("valueMetadata > bk").map((bk) => parseBk(bk, tables));
  return {
    values,
    cells
  };
}

// src/handler/comments.ts
function handlerComments(dom, context) {
  const persons = context.persons;
  const comments = {};
  dom.getElementsByTagName("threadedComment").forEach((d) => {
    const ref = attr(d, "ref");
    if (!comments[ref]) {
      comments[ref] = [];
    }
    const personId = attr(d, "personId");
    comments[ref].push({
      // author
      a: persons[personId] || "",
      d: new Date(Date.parse(attr(d, "dT"))).toISOString(),
      // text
      t: d.getElementsByTagName("text")[0].textContent
    });
  });
  return comments;
}

// src/handler/worksheet.ts
import { parseA1Ref as parseA1Ref2, stringifyA1Ref as stringifyA1Ref2 } from "@borgar/fx";

// src/utils/rle.ts
function rle(list, defaultValue) {
  let lastItem = [];
  let current;
  return list.sort((a, b) => a[0] - b[0]).reduce((newList, item) => {
    const nextInSeq = lastItem[0] + 1 === item[0];
    const sameSize = lastItem[1] === item[1];
    if (nextInSeq && sameSize) {
      current.end = item[0];
    } else {
      current = {
        begin: item[0],
        end: item[0],
        size: item[1]
      };
      newList.push(current);
    }
    lastItem = item;
    return newList;
  }, []).filter((d) => d.size !== defaultValue);
}

// src/handler/cell.ts
import { dateToSerial, isDateFormat } from "numfmt";

// src/utils/unescape.ts
function unescape(str) {
  return str.replace(
    /_x([\da-f]{4})_/gi,
    (m, n) => String.fromCharCode(parseInt(n, 16))
  );
}

// src/RelativeFormula.ts
import { translateToA1, translateToR1C1 } from "@borgar/fx";
var RelativeFormula = class {
  anchorA1;
  formula;
  relative;
  constructor(formula, anchorCell) {
    this.anchorA1 = anchorCell;
    this.formula = formula;
    this.relative = translateToR1C1(formula, anchorCell);
  }
  /** @param {string} offsetCell */
  translate(offsetCell) {
    return translateToA1(this.relative, offsetCell);
  }
};

// src/handler/cell.ts
var relevantStyle = (obj) => {
  return !!// obj['number-format'] ||
  (obj["fill-color"] || obj["border-top-style"] || obj["border-left-style"] || obj["border-bottom-style"] || obj["border-right-style"]);
};
function handlerCell(node, context) {
  const cell = {};
  const sharedF = context._shared;
  const comments = context.comments;
  const arrayFormula = context._arrayFormula;
  const address = attr(node, "r");
  let valueType = attr(node, "t", "n");
  const styleIndex = Math.trunc(numAttr(node, "s", 0));
  if (styleIndex) {
    cell.si = styleIndex;
  }
  const vNode = node.querySelectorAll("> v")[0];
  let v = vNode ? vNode.textContent : null;
  const vm = numAttr(node, "vm");
  if (vm && context.metadata) {
    const meta = context.metadata.values[vm - 1];
    if (meta._type === "_error") {
      valueType = "e";
      if (meta.errorType === 8) {
        v = "#SPILL!";
      } else if (meta.errorType === 11) {
        v = "#UNKNOWN!";
      } else if (meta.errorType === 12) {
        v = "#FIELD!";
      } else if (meta.errorType === 13) {
        v = "#CALC!";
      }
    }
  }
  if (comments[address]) {
    cell.c = comments[address];
  }
  if (valueType === "inlineStr") {
    valueType = "str";
    v = node.querySelectorAll("is t").map((d) => d.textContent).join("");
  }
  if (v || valueType === "str") {
    if (valueType === "s") {
      cell.v = context.sst ? context.sst[toInt(v)] : "";
    } else if (valueType === "str") {
      valueType = "s";
      cell.v = v || "";
    } else if (valueType === "b") {
      cell.v = !!toInt(v);
    } else if (valueType === "e") {
      cell.v = v;
      cell.t = "e";
    } else if (valueType === "d") {
      if (!/[T ]/i.test(v) && v.includes(":")) {
        v = "1899-12-31T" + v;
      }
      cell.v = dateToSerial(new Date(Date.parse(v)));
    } else if (valueType === "n") {
      let val = toNum(v);
      if (context.workbook && context.workbook.epoch === 1904 && styleIndex) {
        const z = context.workbook.styles[styleIndex]?.["number-format"];
        if (z && isDateFormat(z)) {
          val += 1462;
        }
      }
      cell.v = val;
    } else {
      throw new Error("Missing support for data type: " + valueType);
    }
  }
  const fNode = node.querySelectorAll("> f")[0];
  if (fNode) {
    const formulaType = attr(fNode, "t", "normal");
    let f = null;
    if (formulaType === "array") {
      const cellsRange = attr(fNode, "ref");
      if (cellsRange && cellsRange !== address) {
        cell.F = cellsRange;
        arrayFormula.push(cellsRange);
      }
      f = fNode.textContent;
    } else if (formulaType === "shared") {
      const shareGroupIndex = attr(fNode, "si");
      if (!sharedF[shareGroupIndex]) {
        sharedF[shareGroupIndex] = new RelativeFormula(fNode.textContent, address);
      }
      f = sharedF[shareGroupIndex].translate(address);
    } else if (formulaType.toLowerCase() === "datatable") {
    } else {
      f = fNode.textContent;
    }
    if (f) {
      cell.f = normalizeFormula(f, context);
    }
  }
  if (typeof cell.v === "string") {
    cell.v = unescape(cell.v);
  }
  if (cell.v == null && cell.f == null && (!cell.si || !relevantStyle(context.workbook.styles[styleIndex]))) {
    return null;
  }
  return cell;
}

// src/handler/worksheet.ts
function handlerWorksheet(dom, context, rels) {
  const sheet = {
    name: "",
    cells: {},
    columns: [],
    rows: [],
    merged_cells: [],
    defaults: {
      col_width: 10,
      row_height: 16
    },
    // drawings: [],
    // show_grid_lines: true,
    hidden: false
  };
  const sheetView = dom.querySelector("sheetViews > sheetView");
  if (attr(sheetView, "showGridLines") === "0") {
    sheet.show_grid_lines = false;
  }
  const hyperLinks = /* @__PURE__ */ new Map();
  dom.querySelectorAll("hyperlinks > hyperlink").forEach((d) => {
    const relId = attr(d, "r:id");
    const rel = rels.find((item) => item.id === relId);
    hyperLinks.set(attr(d, "ref"), rel?.target);
  });
  const sheetFormatPr = dom.getElementsByTagName("sheetFormatPr")[0];
  if (sheetFormatPr) {
    sheet.defaults.col_width = numAttr(sheetFormatPr, "baseColWidth", sheet.defaults.col_width);
    sheet.defaults.row_height = numAttr(sheetFormatPr, "defaultRowHeight", sheet.defaults.row_height);
  }
  dom.getElementsByTagName("col").forEach((d) => {
    const min = numAttr(d, "min", 0);
    const max = numAttr(d, "max", 1e5);
    const hidden = numAttr(d, "hidden", 0);
    const width = hidden ? 0 : numAttr(d, "width");
    sheet.columns.push({
      begin: min,
      end: max,
      size: width
    });
  });
  context._shared = {};
  context._arrayFormula = [];
  context._merged = {};
  dom.getElementsByTagName("mergeCell").forEach((d) => {
    const ref = attr(d, "ref");
    const { top, left, bottom, right } = parseA1Ref2(ref).range;
    const anchor = stringifyA1Ref2({ range: { top, left } });
    for (let c = left; c <= right; c++) {
      for (let r = top; r <= bottom; r++) {
        context._merged[stringifyA1Ref2({ range: { top: r, left: c } })] = anchor;
      }
    }
    sheet.merged_cells.push(ref);
  });
  const row_heights = [];
  dom.querySelectorAll("row").forEach((row) => {
    const r = attr(row, "r");
    const isHidden = numAttr(row, "hidden");
    if (isHidden) {
      row_heights.push([+r, 0]);
    } else {
      const ht = attr(row, "ht");
      if (ht != null) {
        row_heights.push([+r, +ht]);
      }
    }
    row.querySelectorAll("> c").forEach((d) => {
      const id = attr(d, "r");
      if (context.options.skip_merged) {
        if (context._merged[id] && context._merged[id] !== id) {
          return;
        }
      }
      const c = handlerCell(d, context);
      if (c) {
        if (hyperLinks.has(id)) {
          c.href = hyperLinks.get(id);
        }
        sheet.cells[id] = c;
      }
    });
  });
  sheet.rows = rle(row_heights, sheet.defaults.row_height);
  context._arrayFormula.forEach((arrayRef) => {
    const { top, left, bottom, right } = parseA1Ref2(arrayRef).range;
    for (let r = top; r <= bottom; r++) {
      for (let c = left; c <= right; c++) {
        const ref = stringifyA1Ref2({ range: { top: r, left: c } });
        if (sheet.cells[ref]) {
          sheet.cells[ref].F = arrayRef;
        }
      }
    }
  });
  delete context._shared;
  delete context._arrayFormula;
  delete context._merged;
  return sheet;
}

// src/handler/external.ts
function handlerExternal(dom, fileName = "") {
  const external = {
    filename: fileName,
    sheets: [],
    names: []
  };
  dom.querySelectorAll("sheetNames > sheetName").forEach((sheetName) => {
    external.sheets.push({
      name: attr(sheetName, "val"),
      cells: {}
    });
  });
  const dummyContext = new ConversionContext();
  dom.querySelectorAll("sheetDataSet > sheetData").forEach((sheetData) => {
    const sheetIndex = numAttr(sheetData, "sheetId", 0);
    const externalCells = external.sheets[sheetIndex].cells;
    sheetData.querySelectorAll("row > cell").forEach((cell) => {
      const id = attr(cell, "r");
      const c = handlerCell(cell, dummyContext);
      if (c) {
        externalCells[id] = c;
      }
    });
  });
  dom.querySelectorAll("definedNames > definedName").forEach((definedName) => {
    external.names.push({
      name: attr(definedName, "name"),
      value: normalizeFormula(attr(definedName, "refersTo"), {})
    });
  });
  return external;
}

// src/handler/table.ts
function handlerTable(dom, context) {
  const tableElm = dom.getElementsByTagName("table")[0];
  if (!tableElm) {
    return;
  }
  const table = {
    name: attr(tableElm, "name"),
    sheet: "",
    ref: attr(tableElm, "ref"),
    header_row_count: numAttr(tableElm, "headerRowCount", 1),
    totals_row_count: numAttr(tableElm, "totalsRowCount", 0),
    // totalsRowShown
    columns: []
    // alt text: extLst>ext>table[altTextSummary]
  };
  tableElm.querySelectorAll("tableColumns > tableColumn").forEach((node) => {
    const column = {
      name: attr(node, "name")
      // totalsRowLabel: attr(node, 'totalsRowLabel'),
    };
    const f = node.getElementsByTagName("calculatedColumnFormula")[0];
    if (f) {
      column.formula = normalizeFormula(f.textContent, context);
    }
    table.columns.push(column);
  });
  return table;
}

// src/index.ts
var DEFAULT_OPTIONS = {
  // skip cells that are a part of merges
  skip_merged: true,
  // styles are attached to cells rather than being included separately
  cell_styles: false,
  // number format is set as z on cells (in addition to existing as
  // 'number-format' in styles) [always true when cell_styles=true]
  cell_z: false
};
async function convert(filename, options = DEFAULT_OPTIONS) {
  return convertBinary(await fs.readFile(filename), filename, options);
}
async function convertBinary(buffer, filename, options = DEFAULT_OPTIONS) {
  if (!(buffer instanceof ArrayBuffer || buffer instanceof Buffer)) {
    throw new Error("Input is not a valid binary");
  }
  const zip = new JSZip();
  const fdesc = await zip.loadAsync(buffer);
  const getFile = async (f) => {
    const fd = fdesc.file(f);
    return fd ? parseXML(await fd.async("string")) : null;
  };
  const getRels = async (f = "") => {
    const fDir = path2.dirname(f);
    const fBfn = path2.basename(f);
    const relsPath = path2.join(fDir, "_rels", `${fBfn}.rels`);
    return handlerRels(await getFile(relsPath), f);
  };
  async function maybeRead(context2, type, handler, fallback = null, rels = null) {
    const rel = (rels || context2.rels).find((d) => d.type === type);
    if (rel) {
      return handler(await getFile(rel.target), context2);
    }
    return fallback;
  }
  const baseRels = await getRels();
  const wbRel = baseRels.find((d) => d.type === "officeDocument");
  const context = new ConversionContext();
  context.rels = await getRels(wbRel.target);
  context.options = Object.assign({}, DEFAULT_OPTIONS, options);
  context.filename = path2.basename(filename);
  for (const rel of context.rels) {
    if (rel.type === "externalLink") {
      const extRels = await getRels(rel.target);
      const fileName = extRels.find((d) => d.id === "rId1").target;
      const exlink = handlerExternal(await getFile(rel.target), fileName);
      context.externalLinks.push(exlink);
    }
  }
  const wb = handlerWorkbook(await getFile(wbRel.target), context);
  context.workbook = wb;
  if (context.externalLinks.length) {
    wb.externals = context.externalLinks;
  }
  context.sst = await maybeRead(context, "sharedStrings", handlerSharedStrings, []);
  context.persons = await maybeRead(context, "person", handlerPersons);
  context.richStruct = await maybeRead(context, "rdRichValueStructure", handlerRDStruct);
  context.richValues = await maybeRead(context, "rdRichValue", handlerRDValue);
  context.metadata = await maybeRead(context, "sheetMetadata", handlerMetaData);
  context.theme = await maybeRead(context, "theme", handlerTheme);
  const styleDefs = await maybeRead(context, "styles", handlerStyles);
  wb.styles = convertStyles(styleDefs);
  await Promise.all(context.sheetLinks.map(async (sheetLink, index) => {
    const sheetRel = context.rels.find((d) => d.id === sheetLink.rId);
    if (sheetRel) {
      const sheetName = sheetLink.name || `Sheet${sheetLink.index}`;
      const sheetRels = await getRels(sheetRel.target);
      context.comments = await maybeRead(
        context,
        "threadedComment",
        handlerComments,
        {},
        sheetRels
      );
      const tableRels = sheetRels.filter((rel) => rel.type === "table");
      for (const tableRel of tableRels) {
        const tableDom = await getFile(tableRel.target);
        const table = handlerTable(tableDom, context);
        if (table) {
          table.sheet = sheetName;
          wb.tables.push(table);
        }
      }
      const sh = handlerWorksheet(await getFile(sheetRel.target), context, sheetRels);
      sh.name = sheetName;
      wb.sheets[index] = sh;
    } else {
      throw new Error("No rel found for sheet " + sheetLink.rId);
    }
  }));
  if (options.cell_styles) {
    wb.styles = [];
  }
  return wb;
}
export {
  convertBinary,
  convert as default
};
//# sourceMappingURL=index.js.map