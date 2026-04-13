/* eslint-disable @stylistic/array-element-newline */

export const REL_PREFIXES = [
  // standard
  'http://schemas.microsoft.com/office/2017/10/relationships/',
  'http://schemas.microsoft.com/office/2017/06/relationships/',
  'http://schemas.microsoft.com/office/2006/relationships/',
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
  bg1: 0,       // Background Color 1: Semantic background color
  bg2: 2,       // Background Color 2: Semantic additional background color
  tx1: 1,       // Text Color 1: Semantic text color
  tx2: 3,       // Text Color 2: Semantic additional text color
  phClr: 0,     // Style Color: A color used in theme definitions which means to use the color of the style.
};

/** Inverse of {@link SCHEME_COLORS}: maps a zero-based index to the canonical scheme key name. */
export const INDEX_TO_SCHEME = [
  'lt1',      //  0: Light 1
  'dk1',      //  1: Dark 1
  'lt2',      //  2: Light 2
  'dk2',      //  3: Dark 2
  'accent1',  //  4: Accent 1
  'accent2',  //  5: Accent 2
  'accent3',  //  6: Accent 3
  'accent4',  //  7: Accent 4
  'accent5',  //  8: Accent 5
  'accent6',  //  9: Accent 6
  'hlink',    // 10: Hyperlink
  'folHlink', // 11: Followed Hyperlink
];

/**
 * Semantic scheme aliases that map to canonical scheme keys. Used when resolving theme colours
 * to RGBA, since ThemeColorScheme only has the canonical twelve properties.
 */
export const SCHEME_ALIASES: Record<string, string> = {
  bg1: 'lt1',
  bg2: 'lt2',
  tx1: 'dk1',
  tx2: 'dk2',
  phClr: 'lt1',
};

// ST_ShapeType simple type (§5.1.12.56).
export const SHAPE_TYPE = [
  'line',
  'lineInv',
  'triangle',
  'rtTriangle',
  'rect',
  'diamond',
  'parallelogram',
  'trapezoid',
  'nonIsoscelesTrapezoid',
  'pentagon',
  'hexagon',
  'heptagon',
  'octagon',
  'decagon',
  'dodecagon',
  'star4',
  'star5',
  'star6',
  'star7',
  'star8',
  'star10',
  'star12',
  'star16',
  'star24',
  'star32',
  'roundRect',
  'round1Rect',
  'round2SameRect',
  'round2DiagRect',
  'snipRoundRect',
  'snip1Rect',
  'snip2SameRect',
  'snip2DiagRect',
  'plaque',
  'ellipse',
  'teardrop',
  'homePlate',
  'chevron',
  'pieWedge',
  'pie',
  'blockArc',
  'donut',
  'noSmoking',
  'rightArrow',
  'leftArrow',
  'upArrow',
  'downArrow',
  'stripedRightArrow',
  'notchedRightArrow',
  'bentUpArrow',
  'leftRightArrow',
  'upDownArrow',
  'leftUpArrow',
  'leftRightUpArrow',
  'quadArrow',
  'leftArrowCallout',
  'rightArrowCallout',
  'upArrowCallout',
  'downArrowCallout',
  'leftRightArrowCallout',
  'upDownArrowCallout',
  'quadArrowCallout',
  'bentArrow',
  'uturnArrow',
  'circularArrow',
  'leftCircularArrow',
  'leftRightCircularArrow',
  'curvedRightArrow',
  'curvedLeftArrow',
  'curvedUpArrow',
  'curvedDownArrow',
  'swooshArrow',
  'cube',
  'can',
  'lightningBolt',
  'heart',
  'sun',
  'moon',
  'smileyFace',
  'irregularSeal1',
  'irregularSeal2',
  'foldedCorner',
  'bevel',
  'frame',
  'halfFrame',
  'corner',
  'diagStripe',
  'chord',
  'arc',
  'leftBracket',
  'rightBracket',
  'leftBrace',
  'rightBrace',
  'bracketPair',
  'bracePair',
  'straightConnector1',
  'bentConnector2',
  'bentConnector3',
  'bentConnector4',
  'bentConnector5',
  'curvedConnector2',
  'curvedConnector3',
  'curvedConnector4',
  'curvedConnector5',
  'callout1',
  'callout2',
  'callout3',
  'accentCallout1',
  'accentCallout2',
  'accentCallout3',
  'borderCallout1',
  'borderCallout2',
  'borderCallout3',
  'accentBorderCallout1',
  'accentBorderCallout2',
  'accentBorderCallout3',
  'wedgeRectCallout',
  'wedgeRoundRectCallout',
  'wedgeEllipseCallout',
  'cloudCallout',
  'cloud',
  'ribbon',
  'ribbon2',
  'ellipseRibbon',
  'ellipseRibbon2',
  'leftRightRibbon',
  'verticalScroll',
  'horizontalScroll',
  'wave',
  'doubleWave',
  'plus',
  'flowChartProcess',
  'flowChartDecision',
  'flowChartInputOutput',
  'flowChartPredefinedProcess',
  'flowChartInternalStorage',
  'flowChartDocument',
  'flowChartMultidocument',
  'flowChartTerminator',
  'flowChartPreparation',
  'flowChartManualInput',
  'flowChartManualOperation',
  'flowChartConnector',
  'flowChartPunchedCard',
  'flowChartPunchedTape',
  'flowChartSummingJunction',
  'flowChartOr',
  'flowChartCollate',
  'flowChartSort',
  'flowChartExtract',
  'flowChartMerge',
  'flowChartOfflineStorage',
  'flowChartOnlineStorage',
  'flowChartMagneticTape',
  'flowChartMagneticDisk',
  'flowChartMagneticDrum',
  'flowChartDisplay',
  'flowChartDelay',
  'flowChartAlternateProcess',
  'flowChartOffpageConnector',
  'actionButtonBlank',
  'actionButtonHome',
  'actionButtonHelp',
  'actionButtonInformation',
  'actionButtonForwardNext',
  'actionButtonBackPrevious',
  'actionButtonEnd',
  'actionButtonBeginning',
  'actionButtonReturn',
  'actionButtonDocument',
  'actionButtonSound',
  'actionButtonMovie',
  'gear6',
  'gear9',
  'funnel',
  'mathPlus',
  'mathMinus',
  'mathMultiply',
  'mathDivide',
  'mathEqual',
  'mathNotEqual',
  'cornerTabs',
  'squareTabs',
  'plaqueTabs',
  'chartX',
  'chartStar',
  'chartPlus',
];

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
