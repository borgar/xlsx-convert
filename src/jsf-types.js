/* eslint-disable max-len */

// This file is purposely written in JSDoc despite the rest of the project being TypeScript.
//
// This is so that it can contain things like default values and value restrictions,
// allowing it to be transformed to documentation and schema.

/**
 * @typedef JSFWorkbook
 *   A workbook is a collection of worksheets, calculation directions, and other meta-data.
 * @prop {string} filename
 *   Name of the workbook.
 * @prop {1900 | 1904} epoch
 *   Which of the two date systems the workbook uses.
 *   See: <https://learn.microsoft.com/en-us/office/troubleshoot/excel/1900-and-1904-date-system>
 * @prop {JSFWorksheet[]} sheets
 *   An ordered list of the worksheets in the workbook.
 * @prop {JSFNameDefinition[]} names
 *   A list of defined names.
 * @prop {JSFTable[]} tables
 *   A list of information about tables and their columns.
 * @prop {JSFCalcProps} [calculationProperties]
 *   Directions on how a spreadsheet application should run calculations in the workbook.
 * @prop {JSFStyle[]} styles
 *   Styles for cells in the workbook.
 * @prop {JSFChart[]} [charts]
 *   Definitions of charts found in the workbook.
 * @prop {JSFExternal[]} [externals]
 *   Captures of external cells referenced by the workbook.
 * @prop {string[]} [formulas]
 *   A list of formulas in R1C1-reference notation from the workbook.
 */

/**
 * @typedef JSFWorksheet
 *   A worksheet is a collection of cells.
 * @prop {string} name
 *   Name of the worksheet.
 * @prop {Record<JSFCellId, JSFCell>} cells
 *   The cells belonging to the worksheet that have any data attached.
 * @prop {JSFGridSize[]} columns
 *   Widths and styles of the columns in the worksheet.
 * @prop {JSFGridSize[]} rows
 *   Heights and styles of the rows in the worksheet.
 * @prop {string[]} merges
 *   A list of ranges that capture which cells have been merged.
 * @prop {JSFSheetDefaults} defaults
 *   A collection of default properties that apply to cells, rows, or columns in the worksheet.
 * @prop {boolean} hidden
 *   Whether or not the sheet should be shown to a user in a UI displaying the workbook.
 * @prop {boolean} [showGridLines]
 *   Indicates whether a hairline-grid should be drawn when displaying the sheet.
 * @prop {JSFDrawing} [drawings]
 *   An list of drawings used by the workbook.
 */

/**
 * @typedef JSFCell
 *   A spreadsheet cell.
 * @prop {string | null | number | boolean} [v=null]
 *   The value of the cell, it is assumed to be derived from a formula if the cell has one, else it
 *   is safe to assume that it is user-entered.
 * @prop {string | integer} [f]
 *   Cell formula expression. When the value is a string it will be a formula with A1-style references.
 *   When the value is a number is an index to a formula in the workbook formulas list
 * @prop {string} [href]
 *   A hyperlink URL address.
 * @prop {string} [F]
 *   The range of enclosing array if formula is an array formula.
 * @prop {integer} [s=0]
 *   An index to a style in the workbook styles list.
 * @prop {JSFComment[]} [c]
 *   A list of comments associated with the cell.
 * @prop {'b' | 'e' | 'n' | 'd' | 's' | 'z'} [t]
 *   The type of the value contained in the cell. The property is optional as the type may be
 *   inferred from the `v` property of the cell, except in the case of errors.
 *   - `b` = boolean
 *   - `e` = error
 *   - `n` = number
 *   - `d` = date
 *   - `s` = string
 *   - `z` = blank
 */

/**
 * @typedef JSFComment
 *   A cell comment.
 * @prop {string} a
 *   Author of the comment.
 * @prop {string} d
 *   Date of the comment (as an ISO formatted string).
 * @prop {string} t
 *   The text content of the comment.
 */

/**
 * @typedef JSFSheetDefaults
 *   A collection of default properties that apply to cells, rows, or columns in the worksheet.
 * @prop {number} colWidth
 *   Default width of the UI-grid column.
 * @prop {number} rowHeight
 *   Default height of the UI-grid height.
 */

/**
 * @typedef JSFGridSize
 * A size of a UI-grid measure over a range of items.
 *
 * GridSize information is run-length encoded. The begin and end attributes indicate the range of
 * items that the `size` and `s` attributes affect. The range is expressed using integers, where
 * 1 corresponds to column A or row 1.
 *
 * GridSize may have a style-index (s) attribute like individual cells. The styling information on
 * the column should be used for all cells that are not present in the sheet's cell collection.
 * @prop {integer} begin
 *   A 1-based inclusive start index.
 * @prop {integer} end
 *   A 1-based inclusive end index.
 * @prop {number} size
 *   The size of the grid item [in pixels].
 * @prop {integer} [s]
 *   An index to a style in the workbook styles list.
 */

/**
 * @typedef JSFTable
 * Contains information about table structures and their columns. The information therein can be
 * used to resolve structured references and evaluate calculated columns.
 *
 * See: <https://support.microsoft.com/en-us/office/using-structured-references-with-excel-tables-f5ed2452-2337-4f71-bed3-c8ae6d2b276e>
 * @prop {string} name
 *   The name of the table. This name must adhere to the same restrictions as defined names in
 *   Excel. In particular, it cannot contain spaces.
 * @prop {string} sheet
 *   The name of the sheet on which the table is located.
 * @prop {JSFCellRange} ref
 *   A non-prefixed range reference to the area containing the table. The range shall include the
 *   column headers.
 * @prop {JSFTableColumn[]} columns
 *   An array of column objects. They shall be ordered from left to right, so that the first column
 *   corresponds to the leftmost column in the referenced range and the last column corresponds to
 *   the rightmost column.
 * @prop {integer} [totalsRowCount=0]
 *   A non-negative integer specifying the number of Totals Rows at the bottom of the table.
 *   Default to 0 if absent.
 * @prop {integer} [headerRowCount=1]
 *   A non-negative integer specifying the number of header rows at the top of the table.
 *   Default to 1 if absent.
 */

/**
 * @typedef JSFNameDefinition
 * A defined name (also called "named range") is a labeled reference to a cell, range, constant or
 * formula. Meaningful labels can make formula expressions more readable and more robust to
 * worksheet edits.
 *
 * ```json
 * { "name": "Rates",
 *   "scope": "Sheet1",
 *   "value": "Sheet1!B1:C1" }
 * ```
 * @prop {string} name
 *   A case-sensitive name. Names must start with a letter or `_`, and may only be made up of
 *   letters as well as `\`, `_`, `.`, or `?`. Names must be a valid A1 or R1C1-style reference.
 * @prop {string} value
 *   A formula expression, a reference, or value. Whatever the value is will be evaluated by a
 *   spreadsheet engine as if it were an expression.
 * @prop {string} [scope]
 *   An optional worksheet name that defines the scope for this name. When this field is absent,
 *   the Defined Name should be considered to have a Workbook scope.
 * @prop {string} [comment]
 *   An optional comment explaining the name.
 */

/**
 * @typedef JSFTableColumn
 *   Describes a column of a table.
 * @prop {string} name
 *   The column name. It must be unique among column names in the same table when compared in a
 *   case-insensitive manner. Must be non-empty. May contain white-space characters but not
 *   exclusively.
 * @prop {'text' | 'number' | 'boolean' | 'datetime' | 'unknown'} [dataType='unknown']
 *   Describes the type of values found in the cells of the column, when they are uniform.
 * @prop {string} [formula]
 *   If the column is a calculated column, then this field must include the formula used.
 */

/**
 * @typedef JSFCalcProps
 *   Directions on how a spreadsheet application should run calculations in the workbook.
 * @prop {boolean} iterate
 *   Specifies whether an attempt should be made to calculate formulas that contain circular
 *   references. Defaults to `false` in Excel.
 * @prop {integer} iterateCount
 *   The maximum number of calculation iterations, when `iterate` is `true`. Defaults to `100` in
 *   Excel.
 * @prop {number} iterateDelta
 *   When a calculation iteration results in an absolute change that is less than iterateDelta,
 *   then no further iterations should be attempted. Defaults to `0.001` in Excel.
 */

/**
 * @typedef JSFStyle
 *   Captures the styles which apply to a cell.
 * @prop {string} [fontName="Calibri"]
 *   The name of the font, e.g. `"Arial"`.
 * @prop {JSFPixelValue} [fontSize=11]
 *   The font size in pixels.
 * @prop {JSFColor} [fontColor="#000"]
 *   The font color.
 * @prop {boolean} [bold=false]
 *   Indicates whether the text is bold.
 * @prop {boolean} [italic=false]
 *   Indicates whether the text is italic.
 * @prop {JSFUnderline} [underline="none"]
 *   Text underline decoration type.
 * @prop {JSFColor} [fillColor="#FFF"]
 *   The cell's background color.
 * @prop {JSFBorderStyle} [borderTopStyle="none"]
 *   Top border style.
 * @prop {JSFColor} [borderTopColor]
 *   Top border color.
 * @prop {JSFBorderStyle} [borderLeftStyle="none"]
 *   Left border style.
 * @prop {JSFColor} [borderLeftColor]
 *   Left border color.
 * @prop {JSFBorderStyle} [borderBottomStyle="none"]
 *   Bottom border style.
 * @prop {JSFColor} [borderBottomColor]
 *   Bottom border color.
 * @prop {JSFBorderStyle} [borderRightStyle="none"]
 *   Right border style.
 * @prop {JSFColor} [borderRightColor]
 *   Right border color.
 * @prop {JSFHAlign} [horizontalAlignment="general"]
 *   Horizontal alignment of the cells [text] content.
 * @prop {JSFVAlign} [verticalAlignment]
 *   Vertical alignment of the cells [text] content.
 * @prop {boolean} [wrapText]
 *   Indicates whether text should be wrapped when it exceeds the cell's width.
 * @prop {boolean} [shrinkToFit]
 *   Indicates whether the font-size should be automatically reduced in order to make the contents
 *   of the cell visible.
 * @prop {string} [numberFormat]
 *   Formatting directions for rendering the cell's value to text.
 */

/**
 * @typedef JSFDrawing
 *   Drawing describes the position and size of a visual asset on a worksheet. A drawing may be a
 *   chart or some other type of picture.
 * @prop {JSFAnchorAbs | JSFAnchorCell | JSFAnchorTwoCell} anchor
 *   Directions for where the drawing should be placed.
 * @prop {string} chartId
 *   Pointer to a chart to display.
 */

/**
 * @typedef JSFAnchorAbs
 *   A single coordinate placement anchor.
 * @prop {'absolute'} type
 *   The type of the anchor.
 * @prop {JSFPoint} position
 *   The anchor point location.
 * @prop {JSFPoint} extent
 *   The width and height dimensions.
 */

/**
 * @typedef JSFAnchorCell
 *   A cell-contained placement anchor.
 * @prop {'cell'} type
 *   The type of the anchor.
 * @prop {JSFCellOffset} topLeft
 *   The top/left anchor point location.
 * @prop {JSFPoint} extent
 *   The width and height dimensions.
 */

/**
 * @typedef JSFAnchorTwoCell
 *   A coordinate placement defined by two corner points.
 * @prop {'twoCell'} type
 *   The type of the anchor.
 * @prop {JSFCellOffset} topLeft
 *   The top/left anchor point location.
 * @prop {JSFCellOffset} bottomRight
 *   The bottom/right anchor point location.
 */

/**
 * @typedef JSFCellOffset
 *   Offset defined by a cell position and its inner
 * @prop {integer} row
 *   The cell's row number.
 * @prop {number} rowOffset
 *   The horizontal position within the cell in pixels.
 * @prop {integer} column
 *   The cell's column number.
 * @prop {number} columnOffset
 *   The vertical position within the cell in pixels.
 */

/**
 * @typedef JSFPoint
 *   A coordinate or dimensional sizes in a 2D euclidean space where positive Y increases downwards.
 * @prop {JSFPixelValue} x
 *   A vertical measure in pixels (0 based)
 * @prop {JSFPixelValue} y
 *   A horizontal measure in pixels (0 based)
 */

/**
 * @typedef JSFChart
 *   A chart is a generated data driven image that has the purpose of giving insight to its
 *   underlying numerical values.
 *
 *   When `title` field is empty or absent, and the chart has exactly 1 series, the series name
 *   should be used as the chart title instead. Except, if `autoTitleDeleted` is `true`, where
 *   no title should be displayed.
 * @prop {string} id
 *   An identifier for the chart, unique to the workbook.
 * @prop {JSFChartType | 'combo'} type
 *   The type of the chart.
 * @prop {JSFChartSeries[]} series
 *   The data series used to render plots.
 * @prop {JSFChartAxis[]} [axes]
 *   Axes present in the chart.
 * @prop {JSFFormula | string} [title]
 *   The title of the chart.
 * @prop {boolean} [autoTitleDeleted=true]
 *   Indicates whether a title should be displayed (true = don't display).
 * @prop {JSFFormula} [labels]
 *   A cell range or formula indicating where chart labels should be read from.
 * @prop {JSFSide | 'top-right'} [legend='top-right']
 *   Positioning of a chart legend.
 * @prop {JSFDataLabels} [dataLabels]
 *   Directions on how to display labels for values on plots.
 * @prop {'standard' | 'stacked' | 'clustered' | 'percentStacked'} [grouping]
 *   Specifies the possible groupings for a chart that can be grouped (Bar)
 *   - `clustered` - Chart series should be drawn next to each other along the category axis.
 *   - `percentStacked` - Chart series should be drawn next to each other along the value axis and
 *      scaled to total 100%.
 *   - `stacked` - Chart series should be drawn next to each other on the value axis.
 *   - `standard` - Chart series should be drawn next to each other on the depth axis.
 * @prop {boolean} [varyColors]
 *   When `true`, the colors within a series should vary by point.
 */

/**
 * @typedef JSFChartAxis
 *   Describes a chart axis.
 * @prop {'category' | 'value' | 'date' | 'series'} type
 *   The type of the axis.
 * @prop {JSFSide} position
 *   The position of the axis against a plot area edge.
 * @prop {JSFFormula | string} [title]
 *   The title of the axis.
 * @prop {string} [numberFormat]
 *   A number format to use to display any axis values.
 * @prop {'minMax' | 'maxMin'} [orientation="minMax"]
 *   Indicates if the axis is "reversed". Assume minMax if absent (not reversed).
 * @prop {number} [min]
 *   Minimum value to clip the axis too (do not render things outside this value).
 * @prop {number} [max]
 *   Maximum value to clip the axis too (do not render things outside this value).
 * @prop {integer} [logBase]
 *   Indicates that this is a logarithmic axis and what base it should use (minimum value = 2).
 */

/**
 * @typedef JSFChartSeries
 *   Describes a data-series to be used to drive a plot in a chart.
 * @prop {JSFFormula | string} name
 *   The name of this series.
 * @prop {JSFFormula[]} values
 *   A list of cell ranges or formulas indicating where values of the series should be read from.
 *
 *   This is an array to accommodate multi-dimensional series for scatter and bubble charts
 * @prop {JSFChartType} [chartType]
 *   Type of chart that the series belongs to (only used in combo charts)
 */

/**
 * @typedef JSFDataLabels
 *   Directions on how to display labels for data values on plots.
 * @prop {boolean} values
 *   Should values be shown or not?
 */

/**
 * @typedef {'top' | 'bottom' | 'left' | 'right'} JSFSide
 */

/**
 * @typedef {'area' | 'area3D' | 'bar' | 'bar3D' | 'bubble' | 'column' | 'column3D' | 'doughnut' |
 *           'line' | 'line3D' | 'ofPie' | 'pie' | 'pie3D' | 'radar' | 'scatter' | 'stock' |
 *           'surface' | 'surface3D'} JSFChartType
 * The type of a chart describes what plot marks should be used to represent the data.
 */

/**
 * @typedef {string} JSFFormula
 *   A Excel spreadsheet formula language expression in string form. Range references use A1-style.
 *
 *   ```Excel
 *   "=SUM(A1:C4)*COUNT(B:B)"
 *   ````
 * @pattern ^=
 */

/**
 * @typedef {`#${string}`} JSFColor
 *   A hex-encoded RGBA value that conforms to the CSS4 color specification (`"#3cb371"`).
 * @see [CSS spec](https://www.w3.org/TR/css-color-4/#hex-notation)
 * @pattern ^#([a-fA-F0-9]{3,4}|([a-fA-F0-9][a-fA-F0-9]){3,4})$
 */

/**
 * @typedef {string} JSFCellId
 *   A cell coordinate in an uppercase A1-style reference format (`"AG14"`).
 *
 *   The lower top-left bounds of the reference are `A1` inclusive, and the upper
 *   bottom-right bound are `XFD1048576` inclusive.
 * @pattern ^[A-Z]{1,3}[0-9]{1,3}$
 */

/**
 * @typedef {string} JSFCellRange
 *   A cell coordinate range in an uppercase A1-style reference format (`"H6:J36"`).
 *
 *   The range consists of two {@link CellId} surrounding a colon (`:`) character.
 * @pattern ^([A-Z]{1,3}[0-9]{1,3}):([A-Z]{1,3}[0-9]{1,3})$
 */

/**
 * @typedef {number} JSFPixelValue
 *   A measure in pixels.
 * @min 0
 */

/**
 * @typedef {'none' | 'dashDot' | 'dashDotDot' | 'dashed' | 'dotted' | 'double' | 'hair' |
 *           'medium' | 'mediumDashDot' | 'mediumDashDotDot' | 'mediumDashed' | 'slantDashDot' |
 *           'thick' | 'thin'} JSFBorderStyle
 *   The style to use when drawing a cell border. If the worksheets zoom factor is changed the width
 *   of the border is expected to stay the same.
 *
 *   | Value | Description
 *   | --- | ---
 *   | `none` | No border is drawn.
 *   | `dashDot` | Equivalent to SVG `stroke-dasharray="4 1 2 1"`, at a 1px width.
 *   | `dashDotDot` | Equivalent to SVG `stroke-dasharray="4 1 2 1 2 1"`, at a 1px width.
 *   | `dashed` | Equivalent to SVG `stroke-dasharray=""3 1`, at a 1px width.
 *   | `dotted` | Equivalent to SVG `stroke-dasharray="1"`, at a 1px width.
 *   | `double` | Draw two 1px wide continuous parallel lines with a 1px gap between them.
 *   | `hair` | Draw a 1px wide pixel continuous hairline.
 *   | `medium` | Draw a 2px wide pixel continuous line.
 *   | `mediumDashDot` | Equivalent to SVG `stroke-dasharray="4 1 2 1"`, at a 2px width.
 *   | `mediumDashDotDot` | Equivalent to SVG `stroke-dasharray="4 1 2 1 2 1"`, at a 2px width.
 *   | `mediumDashed` | Equivalent to SVG `stroke-dasharray=""3 1`, at a 2px width.
 *   | `slantDashDot` | Draw two 1px parallel dashed lines where the lower/left line 1px "behind" the other, creating a slant.
 *   | `thick` | Draw a 3px wide pixel continuous line.
 *   | `thin` | Draw a 1px wide pixel continuous line.
 */

/**
 * @typedef {'general' | 'left' | 'center' | 'right' | 'fill' | 'justify' | 'centerContinuous' |
 *           'distributed'} JSFHAlign
 *   Specifies the horizontal alignment of content (text) within a container (cell).
 *
 *   | Value | Description
 *   | --- | ---
 *   | `center` | The horizontal alignment is centered, meaning the text is centered across the cell.
 *   | `centerContinuous` | The horizontal alignment is centered across multiple cells.
 *   | `distributed` | Indicates that each 'word' in each line of text inside the cell is evenly distributed across the width of the cell, with flush right and left margins.
 *   | `fill` | Indicates that the value of the cell should be filled across the entire width of the cell. If blank cells to the right also have the fill alignment, they are also filled with the value, using a convention similar to centerContinuous.
 *   | `general` | The horizontal alignment is general-aligned. Text data is left-aligned. Numbers, dates, and times are right- aligned. Boolean types are centered.
 *   | `justify` | For each line of text, aligns each line of the wrapped text in a cell to the right and left (except the last line).
 *   | `left` | Aligns content at the left edge of the cell (even in RTL mode).
 *   | `right` | Aligns content at the right edge of the cell (even in RTL mode).
 */

/**
 * @typedef {'bottom' | 'top' | 'center' | 'justify' | 'distributed'} JSFVAlign
 *   Vertical alignment of a cell content.
 */

/**
 * @typedef {'none' | 'single' | 'singleAccounting' | 'double' | 'doubleAccounting'} JSFUnderline
 *   Which type of underline to use when rendering text.
 */

/**
 * @typedef JSFExternal
 *   Captures of external cells referenced by the workbook.
 * @prop {string} filename
 *   Filename being referenced.
 * @prop {JSFExtSheet[]} sheets
 *   A list of the relevant worksheets from an external workbook.
 *
 *   These will only be a capture the subset of sheets needed to run calculations so indexes from
 *   the original workbooks will not be preserved.
 * @prop {JSFNameDefinition[]} names
 *   A list of relevant defined names from an external workbook.
 */

/**
 * @typedef JSFExtSheet
 *   A simple container sheet for cell values
 * @prop {string} name
 *   Name of the worksheet.
 * @prop {Record<JSFCellId, JSFCell>} cells
 *   The cells belonging to the worksheet that have any data attached.
 *
 *   Typically, these will have only values and calculation directives attached as they will not
 *   be rendered by a spreadsheet application.
 */

/**
 * @typedef {number} integer
 * @ignore
 */

// ensures this file is picked up
export default null;
