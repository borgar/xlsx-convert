/**
 * Describes a spreadsheet workbook.
 *
 * @typedef JSFWorkbook
 * @prop {string} filename
 *  Name of the workbook.
 * @prop {1900 | 1904} epoch
 *   Which of the two date system the workbook uses.
 *   https://learn.microsoft.com/en-us/office/troubleshoot/excel/1900-and-1904-date-system
 * @prop {JSFWorksheet[]} sheets
 *   An ordered list of the worksheets in the workbook.
 * @prop {JSFNameDef[]} names
 *   A list of named definitions.
 * @prop {JSFTable[]} tables
 *   A list of tables
 * @prop {JSFCalcProps} [calculation_properties]
 * @prop {JSFStyle[]} styles
 * @prop {JSFChart[]} [charts]
 * @prop {JSFExternal[]} [externals]
 */

/**
 * @typedef JSFWorksheet
 * @prop {string} name
 * @prop {Record<Uppercase<string>, JSFCell>} cells
 * @prop {JSFGridSize[]} columns
 * @prop {JSFGridSize[]} rows
 * @prop {string[]} merged_cells
 * @prop {JSFSheetDefaults} defaults
 * @prop {boolean} hidden
 * @prop {boolean} [show_grid_lines]
 * @prop {JSFDrawing} [drawings]
 */

/**
 * @typedef JSFCell
 * @prop {string | null | number | boolean} [v=null]
 * @prop {number} [si=0]
 * @prop {string} [f]
 * @prop {number} [si]
 * @prop {string} [href]
 * @prop {string} [F]
 */

/**
 * @typedef JSFSheetDefaults
 * @prop {number} col_width
 * @prop {number} row_height
 */

/**
 * @typedef JSFGridSize
 * @prop {number} begin
 * @prop {number} end
 * @prop {number} size
 * @prop {number} [si]
 */

/**
 * @typedef JSFTable
 * @prop {string} name
 * @prop {string} sheet
 * @prop {string} ref
 * @prop {JSFTableColumn[]} columns
 * @prop {number} totals_row_count
 * @prop {number} header_row_count
 */

/**
 * @typedef JSFNameDef
 * @prop {string} name
 * @prop {string} value
 * @prop {string} [scope]
 */

/**
 * @typedef JSFTableColumn
 * @prop {string} name
 * @prop {'text' | 'number' | 'boolean' | 'datetime' | 'unknown'} [data_type]
 * @prop {string} [formula]
 */

/**
 * @typedef JSFCalcProps
 * @prop {boolean} iterate
 * @prop {number} iterate_count
 * @prop {number} iterate_delta
 */

/**
 * @typedef JSFStyle
 * @prop {string} [font-name]
 * @prop {number} [font-size]
 * @prop {JSFColor} [font-color]
 * @prop {boolean} [bold]
 * @prop {boolean} [italic]
 * @prop {boolean} [underline]
 * @prop {JSFColor} [fill-color]
 * @prop {JSFBorderStyle} [border-top-style]
 * @prop {JSFColor} [border-top-color]
 * @prop {JSFBorderStyle} [border-left-style]
 * @prop {JSFColor} [border-left-color]
 * @prop {JSFBorderStyle} [border-bottom-style]
 * @prop {JSFColor} [border-bottom-color]
 * @prop {JSFBorderStyle} [border-right-style]
 * @prop {JSFColor} [border-right-color]
 * @prop {JSFhAlign} [horizontal-alignment]
 * @prop {JSFvAlign} [vertical-alignment]
 * @prop {boolean} [wrap-text]
 * @prop {boolean} [shrink-to-fit]
 * @prop {string} [number-format]
 */

/**
 * @typedef JSFDrawing
 * @prop {JSFAnchorAbs | JSFAnchorCell | JSFAnchorTwoCell} anchor
 * @prop {string} chart_id
 */

/**
 * @typedef JSFAnchorAbs
 * @prop {'absolute'} type
 * @prop {JSFPoint} position
 * @prop {JSFPoint} extent
 */

/**
 * @typedef JSFAnchorCell
 * @prop {'cell'} type
 * @prop {JSFCellOffset} top_left
 * @prop {JSFPoint} extent
 */

/**
 * @typedef JSFAnchorTwoCell
 * @prop {'two_cell'} type
 * @prop {JSFCellOffset} top_left
 * @prop {JSFCellOffset} bottom_right
 */

/**
 * @typedef JSFCellOffset
 * @prop {number} row
 * @prop {number} row_offset
 * @prop {number} column
 * @prop {number} column_offset
 */

/**
 * @typedef JSFPoint
 * @prop {number} x
 * @prop {number} y
 */

/**
 * @typedef JSFChart
 * @prop {string} id
 * @prop {JSFChartType | 'combo'} type
 * @prop {JSFChartSeries[]} series
 * @prop {JSFChartAxis[]} [axes]
 * @prop {JSFFormula | string} [title]
 * @prop {boolean} [auto_title_deleted]
 * @prop {JSFFormula} [labels]
 * @prop {JSFLegend} [legend]
 * @prop {JSFDataLabels} [data_labels]
 * @prop {'standard' | 'stacked' | 'clustered' | 'percentStacked'} [grouping]
 * @prop {boolean} [vary_colors]
 */

/**
 * @typedef JSFChartAxis
 * @prop {'category' | 'value' | 'date' | 'series'} type
 * @prop {'left' | 'right' | 'top' | 'bottom'} position
 * @prop {JSFFormula | string} [title]
 * @prop {string} [number_format]
 * @prop {'minMax' | 'maxMin'} [orientation]
 * @prop {number} [min]
 * @prop {number} [max]
 * @prop {number} [log_base]
 */

/**
 * @typedef JSFChartSeries
 * @prop {JSFFormula | string} name
 * @prop {JSFFormula[]} values
 * @prop {JSFChartType} [chart_type]
 */

/**
 * @typedef JSFDataLabels
 * @prop {boolean} values
 */

/**
 * @typedef JSFLegend
 * @prop {'top' | 'bottom' | 'left' | 'right' | 'top-right'} position
 */

/**
 * @typedef {'area' | 'area3D' | 'bar' | 'bar3D' | 'bubble' | 'column' | 'column3D' | 'doughnut' | 'line' | 'line3D' | 'ofPie' | 'pie' | 'pie3D' | 'radar' | 'scatter' | 'stock' | 'surface' | 'surface3D'} JSFChartType
 */

/**
 * @typedef {`=${string}`} JSFFormula
 */

/**
 * @typedef {`#${string}`} JSFColor
 */

/**
 * @typedef {'none' | 'dashDot' | 'dashDotDot' | 'dashed' | 'dotted' | 'double' | 'hair' | 'medium' | 'mediumDashDot' | 'mediumDashDotDot' | 'mediumDashed' | 'slantDashDot' | 'thick' | 'thin'} JSFBorderStyle
 */

// "general"? can that be right?
/**
 * @typedef {'general' | 'left' | 'center' | 'right' | 'fill' | 'justify' | 'centerContinuous' | 'distributed'} JSFhAlign
 */

/**
 * @typedef {'bottom' | 'top' | 'center' | 'justify' | 'distributed'} JSFvAlign
 */

/**
 * @typedef JSFExternal
 * @prop {string} filename
 * @prop {JSFExtSheet[]} sheets
 * @prop {JSFNameDef[]} names
 */

/**
 * @typedef JSFExtSheet
 * @prop {string} name
 * @prop {Record<Uppercase<string>, JSFCell>} cells
 */

// ensures this file is picked up
export default null;
