/* eslint-disable @stylistic/array-element-newline */

export const REL_PREFIXES = [
  // standard
  'http://schemas.microsoft.com/office/2017/10/relationships/',
  'http://schemas.microsoft.com/office/2017/06/relationships/',
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships/',
  'http://schemas.openxmlformats.org/package/2006/relationships/',
  // strict
  'http://purl.oclc.org/ooxml/officeDocument/relationships/',
];

// switching to UK english has moved all $ to kr.
export const BUILTIN_FORMATS: Record<number, string> = {
  0: 'General',
  1: '0',
  2: '0.00',
  3: '#,##0',
  4: '#,##0.00',
  // These next four are locale dependent. For example the Icelandic locale uses `#,##0 "kr.";-#,##0 "kr."`
  5: '"$"#,##0_);("$"#,##0)',
  6: '"$"#,##0_);[Red]("$"#,##0)',
  7: '"$"#,##0.00_);("$"#,##0.00)',
  8: '"$"#,##0.00_);[Red]("$"#,##0.00)',
  9: '0%',
  10: '0.00%',
  11: '0.00E+00',
  12: '# ?/?',
  13: '# ??/??',
  // Format 14, Excel's default "Short Date" is very locale dependent:
  // It seem to use OS short date format: "1/2/09", "2.1.1909", "02-01-1909"
  14: 'm/d/yy',
  // Next three have locale dependent delimiter, and possibly more:
  15: 'd-mmm-yy',
  16: 'd-mmm',
  17: 'mmm-yy',
  18: 'h:mm AM/PM',
  19: 'h:mm:ss AM/PM',
  20: 'h:mm',
  21: 'h:mm:ss',
  37: '#,##0_);(#,##0)',
  38: '#,##0_);[Red](#,##0)',
  39: '#,##0.00_);(#,##0.00)',
  40: '#,##0.00_);[Red](#,##0.00)',
  41: '_(* #,##0_);_(* \\(#,##0\\);_(* "-"_);_(@_)',
  42: '_("$"* #,##0_);_("$"* \\(#,##0\\);_("$"* "-"_);_(@_)',
  43: '_(* #,##0.00_);_(* \\(#,##0.00\\);_(* "-"??_);_(@_)',
  44: '_("$"* #,##0.00_);_("$"* \\(#,##0.00\\);_("$"* "-"??_);_(@_)',
  45: 'mm:ss',
  46: '[h]:mm:ss',
  47: 'mm:ss.0',
  48: '##0.0E+0',
  49: '@',
  55: 'yyyy/mm/dd',
};

// formats IDs that point to other IDs
[ [ 22, 21 ], [ 23, 21 ], [ 24, 21 ], [ 25, 21 ], [ 26, 14 ],
  [ 27, 37 ], [ 28, 38 ], [ 29, 39 ], [ 30, 40 ], [ 31, 41 ],
  [ 32, 42 ], [ 33, 43 ], [ 34, 44 ], [ 35, 45 ], [ 36, 46 ] ]
  .forEach(([ to, from ]) => {
    BUILTIN_FORMATS[to] = BUILTIN_FORMATS[from];
  });

// Default Color Index as per 18.8.27 of ECMA Part 4
export const COLOR_INDEX = [
  'FF000000', 'FFFFFFFF', 'FFFF0000', 'FF00FF00', 'FF0000FF', // 0-4
  'FFFFFF00', 'FFFF00FF', 'FF00FFFF', 'FF000000', 'FFFFFFFF', // 5-9
  'FFFF0000', 'FF00FF00', 'FF0000FF', 'FFFFFF00', 'FFFF00FF', // 10-14
  'FF00FFFF', 'FF800000', 'FF008000', 'FF000080', 'FF808000', // 15-19
  'FF800080', 'FF008080', 'FFC0C0C0', 'FF808080', 'FF9999FF', // 20-24
  'FF993366', 'FFFFFFCC', 'FFCCFFFF', 'FF660066', 'FFFF8080', // 25-29
  'FF0066CC', 'FFCCCCFF', 'FF000080', 'FFFF00FF', 'FFFFFF00', // 30-34
  'FF00FFFF', 'FF800080', 'FF800000', 'FF008080', 'FF0000FF', // 35-39
  'FF00CCFF', 'FFCCFFFF', 'FFCCFFCC', 'FFFFFF99', 'FF99CCFF', // 40-44
  'FFFF99CC', 'FFCC99FF', 'FFFFCC99', 'FF3366FF', 'FF33CCCC', // 45-49
  'FF99CC00', 'FFFFCC00', 'FFFF9900', 'FFFF6600', 'FF666699', // 50-54
  'FF969696', 'FF003366', 'FF339966', 'FF003300', 'FF333300', // 55-59
  'FF993300', 'FF993366', 'FF333399', 'FF333333', 'System Foreground', // 60-64
  'System Background', // 65
];

// https://social.technet.microsoft.com/Forums/windows/en-US/ac76cc56-6ff2-4778-b260-8141d7170a3b/windows-7-highlight-text-color-or-selected-text-color-in-aero
export const SYSTEM_COLORS = {
  // not sure why this is reversed?
  'system foreground': 'FF000000',
  'system background': 'FFFFFFFF',
  // 'system foreground': 'FFFFFFFF',
  // 'system background': 'FF000000',
  'activeborder': 'FFB4B4B4',
  'activetitle': 'FF99B4D1',
  'appworkspace': 'FFABABAB',
  'background': 'FF000000',
  'buttonalternateface': 'FF000000',
  'buttondkshadow': 'FF696969',
  'buttonface': 'FFF0F0F0',
  'buttonhilight': 'FFFFFFFF',
  'buttonlight': 'FFE3E3E3',
  'buttonshadow': 'FFA0A0A0',
  'buttontext': 'FF000000',
  'gradientactivetitle': 'FFB9D1EA',
  'gradientinactivetitle': 'FFD7E4F2',
  'graytext': 'FF6D6D6D',
  'hilight': 'FF3399FF',
  'hilighttext': 'FFFFFFFF',
  'hottrackingcolor': 'FF0066CC',
  'inactiveborder': 'FFF4F7FC',
  'inactivetitle': 'FFBFCDDB',
  'inactivetitletext': 'FF000000',
  'infotext': 'FF000000',
  'infowindow': 'FFFFFFE1',
  'menu': 'FFF0F0F0',
  'menubar': 'FFF0F0F0',
  'menuhilight': 'FF3399FF',
  'menutext': 'FF000000',
  'scrollbar': 'FFC8C8C8',
  'titletext': 'FF000000',
  'window': 'FFFFFFFF',
  'windowframe': 'FF646464',
  'windowtext': 'FF000000',
};

// The values here defined by the ST_PresetColorVal simple type §5.1.12.48.
export const PRESET_COLORS = {
  aliceBlue: 'FFF0F8FF',
  antiqueWhite: 'FFFAEBD7',
  aqua: 'FF00FFFF',
  aquamarine: 'FF7FFFD4',
  azure: 'FFF0FFFF',
  beige: 'FFF5F5DC',
  bisque: 'FFFFE4C4',
  black: 'FF000000',
  blanchedAlmond: 'FFFFEBCD',
  blue: 'FF0000FF',
  blueViolet: 'FF8A2BE2',
  brown: 'FFA52A2A',
  burlyWood: 'FFDEB887',
  cadetBlue: 'FF5F9EA0',
  chartreuse: 'FF7FFF00',
  chocolate: 'FFD2691E',
  coral: 'FFFF7F50',
  cornflowerBlue: 'FF6495ED',
  cornsilk: 'FFFFF8DC',
  crimson: 'FFDC143C',
  cyan: 'FF00FFFF',
  deepPink: 'FFFF1493',
  deepSkyBlue: 'FF00BFFF',
  dimGray: 'FF696969',
  dkBlue: 'FF00008B', // CSS color equivalent is "darkblue"
  dkCyan: 'FF008B8B', // CSS color equivalent is "darkcyan"
  dkGoldenrod: 'FFB8860B', // CSS color equivalent is "darkgoldenrod"
  dkGray: 'FFA9A9A9', // CSS color equivalent is "darkgray"
  dkGreen: 'FF006400', // CSS color equivalent is "darkgreen"
  dkKhaki: 'FFBDB76B', // CSS color equivalent is "darkkhaki"
  dkMagenta: 'FF8B008B', // CSS color equivalent is "darkmagenta"
  dkOliveGreen: 'FF556B2F', // CSS color equivalent is "darkolivegreen"
  dkOrange: 'FFFF8C00', // CSS color equivalent is "darkorange"
  dkOrchid: 'FF9932CC', // CSS color equivalent is "darkorchid"
  dkRed: 'FF8B0000', // CSS color equivalent is "darkred"
  dkSalmon: 'FFE9967A', // CSS color equivalent is "darksalmon"
  dkSeaGreen: 'FF8FBC8B', // CSS color equivalent is "darkseagreen"
  dkSlateBlue: 'FF483D8B', // CSS color equivalent is "darkslateblue"
  dkSlateGray: 'FF2F4F4F', // CSS color equivalent is "darkslategray"
  dkTurquoise: 'FF00CED1', // CSS color equivalent is "darkturquoise"
  dkViolet: 'FF9400D3', // CSS color equivalent is "darkviolet"
  dodgerBlue: 'FF1E90FF',
  firebrick: 'FFB22222',
  floralWhite: 'FFFFFAF0',
  forestGreen: 'FF228B22',
  fuchsia: 'FFFF00FF',
  gainsboro: 'FFDCDCDC',
  ghostWhite: 'FFF8F8FF',
  gold: 'FFFFD700',
  goldenrod: 'FFDAA520',
  gray: 'FF808080',
  green: 'FF008000',
  greenYellow: 'FFADFF2F',
  honeydew: 'FFF0FFF0',
  hotPink: 'FFFF69B4',
  indianRed: 'FFCD5C5C',
  indigo: 'FF4B0082',
  ivory: 'FFFFFFF0',
  khaki: 'FFF0E68C',
  lavender: 'FFE6E6FA',
  lavenderBlush: 'FFFFF0F5',
  lawnGreen: 'FF7CFC00',
  lemonChiffon: 'FFFFFACD',
  lime: 'FF00FF00',
  limeGreen: 'FF32CD32',
  linen: 'FFFAF0E6',
  ltBlue: 'FFADD8E6', // CSS color equivalent is "lightblue"
  ltCoral: 'FFF08080', // CSS color equivalent is "lightcoral"
  ltCyan: 'FFE0FFFF', // CSS color equivalent is "lightcyan"
  ltGoldenrodYellow: 'FFFAFA78', // CSS color equivalent is "lightgoldenrodyellow"
  ltGray: 'FFD3D3D3', // CSS color equivalent is "lightgray"
  ltGreen: 'FF90EE90', // CSS color equivalent is "lightgreen"
  ltPink: 'FFFFB6C1', // CSS color equivalent is "lightpink"
  ltSalmon: 'FFFFA07A', // CSS color equivalent is "lightsalmon"
  ltSeaGreen: 'FF20B2AA', // CSS color equivalent is "lightseagreen"
  ltSkyBlue: 'FF87CEFA', // CSS color equivalent is "lightskyblue"
  ltSlateGray: 'FF778899', // CSS color equivalent is "lightslategray"
  ltSteelBlue: 'FFB0C4DE', // CSS color equivalent is "lightsteelblue"
  ltYellow: 'FFFFFFE0', // CSS color equivalent is "lightyellow"
  magenta: 'FFFF00FF',
  maroon: 'FF800000',
  medAquamarine: 'FF66CDAA', // CSS color equivalent is "mediumaquamarine"
  medBlue: 'FF0000CD', // CSS color equivalent is "mediumblue"
  medOrchid: 'FFBA55D3', // CSS color equivalent is "mediumorchid"
  medPurple: 'FF9370DB', // CSS color equivalent is "mediumpurple"
  medSeaGreen: 'FF3CB371', // CSS color equivalent is "mediumseagreen"
  medSlateBlue: 'FF7B68EE', // CSS color equivalent is "mediumslateblue"
  medSpringGreen: 'FF00FA9A', // CSS color equivalent is "mediumspringgreen"
  medTurquoise: 'FF48D1CC', // CSS color equivalent is "mediumturquoise"
  medVioletRed: 'FFC71585', // CSS color equivalent is "mediumvioletred"
  midnightBlue: 'FF191970',
  mintCream: 'FFF5FFFA',
  mistyRose: 'FFFFE4E1',
  moccasin: 'FFFFE4B5',
  navajoWhite: 'FFFFDEAD',
  navy: 'FF000080',
  oldLace: 'FFFDF5E6',
  olive: 'FF808000',
  oliveDrab: 'FF6B8E23',
  orange: 'FFFFA500',
  orangeRed: 'FFFF4500',
  orchid: 'FFDA70D6',
  paleGoldenrod: 'FFEEE8AA',
  paleGreen: 'FF98FB98',
  paleTurquoise: 'FFAFEEEE',
  paleVioletRed: 'FFDB7093',
  papayaWhip: 'FFFFEFD5',
  peachPuff: 'FFFFDAB9',
  peru: 'FFCD853F',
  pink: 'FFFFC0CB',
  plum: 'FFDDA0DD',
  powderBlue: 'FFB0E0E6',
  purple: 'FF800080',
  red: 'FFFF0000',
  rosyBrown: 'FFBC8F8F',
  royalBlue: 'FF4169E1',
  saddleBrown: 'FF8B4513',
  salmon: 'FFFA8072',
  sandyBrown: 'FFF4A460',
  seaGreen: 'FF2E8B57',
  seaShell: 'FFFFF5EE',
  sienna: 'FFA0522D',
  silver: 'FFC0C0C0',
  skyBlue: 'FF87CEEB',
  slateBlue: 'FF6A5ACD',
  slateGray: 'FF708090',
  snow: 'FFFFFAFA',
  springGreen: 'FF00FF7F',
  steelBlue: 'FF4682B4',
  tan: 'FFD2B48C',
  teal: 'FF008080',
  thistle: 'FFD8BFD8',
  tomato: 'FFFF6347',
  turquoise: 'FF40E0D0',
  violet: 'FFEE82EE',
  wheat: 'FFF5DEB3',
  white: 'FFFFFFFF',
  whiteSmoke: 'FFF5F5F5',
  yellow: 'FFFFFF00',
  yellowGreen: 'FF9ACD32',
};

// 5.1.12.54 ST_SchemeColorVal (Scheme Color)
export const SCHEME_COLORS = {
  lt1: 0,       // Light Color 1: Main Light Color 1
  dk1: 1,       // Dark Color 1: Main dark color 1
  lt2: 2,       // Light Color 2: Main Light Color 2
  dk2: 3,       // Dark Color 2: Main dark color 2
  accent1: 4,   // Accent Color 1: Extra scheme color 1
  accent2: 5,   // Accent Color 2: Extra scheme color 2
  accent3: 6,   // Accent Color 3: Extra scheme color 3
  accent4: 7,   // Accent Color 4: Extra scheme color 4
  accent5: 8,   // Accent Color 5: Extra scheme color 5
  accent6: 9,   // Accent Color 6: Extra scheme color 6
  hlink: 10,    // Hyperlink Color: Regular Hyperlink Color
  folHlink: 11, // Followed Hyperlink Color: Followed Hyperlink Color
  // FIXME: we need to determine the indexes of these colors:
  bg1: 0,       // Background Color 1: Semantic background color
  bg2: 0,       // Background Color 2: Semantic additional background color
  tx1: 0,       // Text Color 1: Semantic text color
  tx2: 0,       // Text Color 2: Semantic additional text color
  phClr: 0,     // Style Color: A color used in theme definitions which means to use the color of the style.
};

export const ERROR_NAMES = [
  '#BLOCKED!',
  '#CALC!',
  '#DIV/0!',
  '#FIELD!',
  '#GETTING_DATA',
  '#N/A',
  '#NAME?',
  '#NULL!',
  '#NUM!',
  '#REF!',
  '#SPILL!',
  '#UNKNOWN!',
  '#VALUE!',
];
