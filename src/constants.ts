/* eslint-disable @stylistic/array-element-newline */

import type { PageMargins } from '@jsfkit/types';

export const REL_PREFIXES = [
  // standard
  'http://schemas.microsoft.com/office/2006/relationships/',
  'http://schemas.microsoft.com/office/2011/relationships/',
  'http://schemas.microsoft.com/office/2014/relationships/',
  'http://schemas.microsoft.com/office/2017/06/relationships/',
  'http://schemas.microsoft.com/office/2017/10/relationships/',
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships/',
  'http://schemas.openxmlformats.org/package/2006/relationships/',
  'http://schemas.microsoft.com/office/2023/09/relationships/',
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
  22: 'm/d/yy h:mm',
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
[ [ 23, 21 ], [ 24, 21 ], [ 25, 21 ], [ 26, 14 ],
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

// Canonical default page margins (inches), per `Worksheet.pageMargins`'s defaults in JSF
export const DEFAULT_PAGE_MARGINS: PageMargins = {
  left: 0.7,
  right: 0.7,
  top: 0.75,
  bottom: 0.75,
  header: 0.3,
  footer: 0.3,
};

// Tags for features that the converter recognizes but does not convert.
export const MISSING_ASSET_3D = 'asset-3d';
export const MISSING_ASSET_EXT = 'asset-ext';
export const MISSING_ASSET_OO = 'asset-oo';
export const MISSING_ASSET_PQ = 'asset-pq';
export const MISSING_ASSET_PY = 'asset-py';
export const MISSING_ASSET_SVG = 'asset-svg';
export const MISSING_ASSET_VBA = 'asset-vba';
export const MISSING_ASSET_VML = 'asset-vml';
export const MISSING_BORDER_DIAGONAL = 'border-diagonal';
export const MISSING_CALC_PRECISION = 'calc-precision';
export const MISSING_CELL_CHECKBOX = 'cell-checkbox';
export const MISSING_CELL_HIDE = 'cell-hide';
export const MISSING_CELL_INDENT = 'cell-indent';
export const MISSING_CELL_LOCK = 'cell-lock';
export const MISSING_CELL_RTF = 'cell-rtf';
export const MISSING_CHART = 'chart';
export const MISSING_CHART_CHARTEX = 'chart-chartex';
export const MISSING_CHART_PIVOT = 'chart-pivot';
export const MISSING_COL_GROUP = 'col-group';
export const MISSING_DATA_VALIDATION = 'data-validation';
export const MISSING_DYNAMIC_STYLE = 'dynamic-style';
export const MISSING_NOTE_RTF = 'note-rtf';
export const MISSING_PRINT_GRIDLINES = 'print-gridlines';
export const MISSING_PRINT_HEADINGS = 'print-headings';
export const MISSING_PRINT_SETUP = 'print-setup';
export const MISSING_ROW_GROUP = 'row-group';
export const MISSING_SCENARIO = 'scenario';
export const MISSING_SHAPE_DIAGRAM = 'shape-diagram';
export const MISSING_SHAPE_EFFECT = 'shape-effect';
export const MISSING_SHAPE_MATH = 'shape-math';
export const MISSING_SHAPE_TEXTEFFECT = 'shape-texteffect';
export const MISSING_SHEET_AUTOFILTER = 'sheet-autofilter';
export const MISSING_SHEET_BACKGROUND = 'sheet-background';
export const MISSING_SHEET_LOCK = 'sheet-lock';
export const MISSING_SHEET_RTL = 'sheet-rtl';
export const MISSING_SHEET_TABCOLOR = 'sheet-tabcolor';
export const MISSING_SPARKLINE = 'sparkline';
export const MISSING_TABLE_FILTER_BUTTON = 'table-filter-button';
export const MISSING_TABLE_INSERTROW = 'table-insertrow';
export const MISSING_TABLE_SLICER = 'table-slicer';
export const MISSING_TABLE_SORTSTATE = 'table-sortstate';
export const MISSING_TABLE_STYLE_CUSTOM = 'table-style-custom';
export const MISSING_TIME_SLICER = 'time-slicer';
export const MISSING_VIEW_CUSTOM = 'view-custom';
export const MISSING_VIEW_FORMULAS = 'view-formulas';
export const MISSING_VIEW_GRIDLINES_COLOR = 'view-gridlines-color';
export const MISSING_VIEW_HEADINGS = 'view-headings';
export const MISSING_VIEW_OUTLINE_SYMBOLS = 'view-outline-symbols';
export const MISSING_VIEW_PANE_SPLIT = 'view-pane-split';
export const MISSING_VIEW_TABSELECTED = 'view-tabselected';
export const MISSING_VIEW_ZEROS = 'view-zeros';
export const MISSING_WORKBOOK_LOCK = 'workbook-lock';
export const MISSING_WORKBOOK_META = 'workbook-meta';
export const MISSING_WORKBOOK_META_CUSTOM = 'workbook-meta-custom';

export type MissingFeature =
  typeof MISSING_ASSET_3D |
  typeof MISSING_ASSET_EXT |
  typeof MISSING_ASSET_OO |
  typeof MISSING_ASSET_PQ |
  typeof MISSING_ASSET_PY |
  typeof MISSING_ASSET_SVG |
  typeof MISSING_ASSET_VBA |
  typeof MISSING_ASSET_VML |
  typeof MISSING_BORDER_DIAGONAL |
  typeof MISSING_CALC_PRECISION |
  typeof MISSING_CELL_CHECKBOX |
  typeof MISSING_CELL_HIDE |
  typeof MISSING_CELL_INDENT |
  typeof MISSING_CELL_LOCK |
  typeof MISSING_CELL_RTF |
  typeof MISSING_CHART |
  typeof MISSING_CHART_CHARTEX |
  typeof MISSING_CHART_PIVOT |
  typeof MISSING_COL_GROUP |
  typeof MISSING_DATA_VALIDATION |
  typeof MISSING_DYNAMIC_STYLE |
  typeof MISSING_NOTE_RTF |
  typeof MISSING_PRINT_GRIDLINES |
  typeof MISSING_PRINT_HEADINGS |
  typeof MISSING_PRINT_SETUP |
  typeof MISSING_ROW_GROUP |
  typeof MISSING_SCENARIO |
  typeof MISSING_SHAPE_DIAGRAM |
  typeof MISSING_SHAPE_EFFECT |
  typeof MISSING_SHAPE_MATH |
  typeof MISSING_SHAPE_TEXTEFFECT |
  typeof MISSING_SHEET_AUTOFILTER |
  typeof MISSING_SHEET_BACKGROUND |
  typeof MISSING_SHEET_LOCK |
  typeof MISSING_SHEET_RTL |
  typeof MISSING_SHEET_TABCOLOR |
  typeof MISSING_SPARKLINE |
  typeof MISSING_TABLE_FILTER_BUTTON |
  typeof MISSING_TABLE_INSERTROW |
  typeof MISSING_TABLE_SLICER |
  typeof MISSING_TABLE_SORTSTATE |
  typeof MISSING_TABLE_STYLE_CUSTOM |
  typeof MISSING_TIME_SLICER |
  typeof MISSING_VIEW_CUSTOM |
  typeof MISSING_VIEW_FORMULAS |
  typeof MISSING_VIEW_GRIDLINES_COLOR |
  typeof MISSING_VIEW_HEADINGS |
  typeof MISSING_VIEW_OUTLINE_SYMBOLS |
  typeof MISSING_VIEW_PANE_SPLIT |
  typeof MISSING_VIEW_TABSELECTED |
  typeof MISSING_VIEW_ZEROS |
  typeof MISSING_WORKBOOK_LOCK |
  typeof MISSING_WORKBOOK_META |
  typeof MISSING_WORKBOOK_META_CUSTOM;
