export const REL_PREFIXES = [
  // standard
  'http://schemas.microsoft.com/office/2017/10/relationships/',
  'http://schemas.microsoft.com/office/2017/06/relationships/',
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships/',
  'http://schemas.openxmlformats.org/package/2006/relationships/',
  // strict
  'http://purl.oclc.org/ooxml/officeDocument/relationships/'
];

export const BUILTIN_FORMATS = {
  0: 'General',
  1: '0',
  2: '0.00',
  3: '#,##0',
  4: '#,##0.00',
  5: '"$"#,##0_);("$"#,##0)',
  6: '"$"#,##0_);[Red]("$"#,##0)',
  7: '"$"#,##0.00_);("$"#,##0.00)',
  8: '"$"#,##0.00_);[Red]("$"#,##0.00)',
  9: '0%',
  10: '0.00%',
  11: '0.00E+00',
  12: '# ?/?',
  13: '# ??/??',
  // 14: 'mm-dd-yy',
  14: 'm/d/yy',
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
  47: 'mmss.0',
  48: '##0.0E+0',
  49: '@'
};

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
  'System Background' // 65
];

// https://social.technet.microsoft.com/Forums/windows/en-US/ac76cc56-6ff2-4778-b260-8141d7170a3b/windows-7-highlight-text-color-or-selected-text-color-in-aero
export const NAMED_COLORS = {
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
  'windowtext': 'FF000000'
};
