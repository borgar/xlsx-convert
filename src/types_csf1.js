/**
 * @typedef {number} integer
 * @ignore
 */

/**
 * @typedef Workbook
 *
 * A workbook is a collection of worksheets, calculation directions, and other meta-data.
 *
 * @prop {string} filename
 *   Name of the workbook.
 *
 * @prop {1900 | 1904} [epoch=1900]
 *   Which of the two date systems the workbook uses.
 *   See: <https://learn.microsoft.com/en-us/office/troubleshoot/excel/1900-and-1904-date-system>
 *
 * @prop {Worksheet[]} sheets
 *   An ordered list of the worksheets in the workbook.
 *
 * @prop {NameDefinition[]} names
 *   A list of defined names.
 *
 * @prop {Table[]} tables
 *   A list of information about tables and their columns.
 *
 * @prop {CalcProps} [calculation_properties]
 *   Directions on how a spreadsheet application should run calculations in the workbook.
 *
 * @prop {Style[]} styles
 *   Styles for cells in the workbook.
 *
 * @prop {Chart[]} [charts=[]]
 *   Definitions of charts found in the workbook.
 *
 * @prop {External[]} [externals=[]]
 *   Captures of external cells referenced by the workbook.
 */

/**
 * @typedef Worksheet
 *
 * A worksheet is a collection of cells.
 *
 * @prop {string} name
 *   Name of the worksheet.
 *
 * @prop {Record<CellId, Cell>} cells
 *   The cells belonging to the worksheet that have any data attached.
 *
 * @prop {GridSize[]} columns
 *   Widths and styles of the columns in the worksheet.
 *
 * @prop {GridSize[]} rows
 *   Heights and styles of the rows in the worksheet.
 *
 * @prop {CellRange[]} merged_cells
 *   A list of ranges that capture which cells have been merged.
 *
 * @prop {SheetDefaults} defaults
 *   A collection of default properties that apply to cells, rows, or columns in the worksheet.
 *
 * @prop {boolean} hidden
 *   Whether or not the sheet should be shown to a user in a UI displaying the workbook.
 *
 * @prop {boolean} [show_grid_lines=true]
 *   Indicates whether a hairline-grid should be drawn when displaying the sheet.
 *
 * @prop {Drawing[]} [drawings=[]]
 *   An list of drawings used by the workbook.
 */

/**
 * @typedef Cell
 *
 * A spreadsheet cell.
 *
 * XXX: add constraint: use either si or f
 *
 * @prop {string | null | number | boolean} [v = null]
 *   The value of the cell, it is assumed to be derived from a formula if the cell has one, else it
 *   is safe to assume that it is user-entered.
 *
 * @prop {string} [f]
 *   A formula with A1-style references.
 *
 *   XXX: type as Formula and enforce = prefix?
 *
 * @prop {string} [z]
 *   A number format string associated with the cell. This should not be present if `si` is used.
 *
 * @prop {integer} [si = 0]
 *   An index to a style in the workbook styles list.
 * @min 1
 *
 * @prop {string} [href]
 *   A hyperlink URL address.
 *
 * @prop {string} [F]
 *   The range of enclosing array if formula is an array formula.
 */

/**
 * @typedef SheetDefaults
 *
 * A collection of default properties that apply to cells, rows, or columns in the worksheet.
 *
 * @prop {number} col_width
 *   Default width of the UI-grid column.
 * @min 0
 *
 * @prop {number} row_height
 *   Default height of the UI-grid height.
 * @min 0
 */

/**
 * @typedef GridSize
 *
 * A size of a UI-grid measure over a range of items.
 *
 * GridSize information is run-length encoded. The begin and end attributes indicate the range of
 * items that the `size` and `si` attributes affect. The range is expressed using integers, where
 * 1 corresponds to column A or row 1.
 *
 * GridSize may have a style-index (si) attribute like individual cells. The styling information on
 * the column should be used for all cells that are not present in the sheet's cell collection.
 *
 * @prop {integer} begin
 *   A 1-based inclusive start index.
 * @min 1
 *
 * @prop {integer} end
 *   A 1-based inclusive end index.
 * @min 1
 *
 * @prop {PixelValue} size
 *   The size of the grid item [in pixels].
 * @min 1
 *
 * @prop {integer} [si]
 *   An index to a style in the workbook styles list.
 * @min 0
 */

/**
 * @typedef NameDefinition
 *
 * Defined name
 *
 * A defined name (also called "named range") is a labeled reference to a cell, range, constant or
 * formula. Meaningful labels can make formula expressions more readable and more robust to
 * worksheet edits.
 *
 * ```json
 * { "name": "Rates",
 *   "scope": "Sheet1",
 *   "value": "Sheet1!B1:C1" }
 * ```
 *
 * @prop {string} name
 *   A case-sensitive name. Names must start with a letter or `_`, and may only be made up of
 *   letters as well as `\`, `_`, `.`, or `?`. Names must be a valid A1 or R1C1-style reference.
 *
 * @prop {string} value
 *   A formula expression, a reference, or value. Whatever the value is will be evaluated by a
 *   spreadsheet engine as if it were an expression.
 *
 * @prop {string} [scope]
 *   An optional worksheet name that defines the scope for this name. When this field is absent,
 *   the Defined Name should be considered to have a Workbook scope.
 *
 * @prop {string} [comment]
 *   An optional comment explaining the name.
 */

/**
 * @typedef Table
 *
 * Contains information about table structures and their columns. The information therein can be
 * used to resolve structured references and evaluate calculated columns.
 *
 * See: <https://support.microsoft.com/en-us/office/using-structured-references-with-excel-tables-f5ed2452-2337-4f71-bed3-c8ae6d2b276e>
 *
 * @prop {string} name
 *   The name of the table. This name must adhere to the same restrictions as defined names in
 *   Excel. In particular, it cannot contain spaces.
 *
 * @prop {string} sheet
 *   The name of the sheet on which the table is located.
 *
 * @prop {CellRange} ref
 *   An unprefixed range reference to the area containing the table. The range shall include the
 *   column headers.
 *
 * @prop {TableColumn[]} columns
 *   An array of column objects. They shall be ordered from left to right, so that the first column
 *   corresponds to the leftmost column in the referenced range and the last column corresponds to
 *   the rightmost column.
 *
 * @prop {integer} [totals_row_count=0]
 *   A non-negative integer specifying the number of Totals Rows at the bottom of the table.
 *   Default to 0 if absent.
 * @min 0
 *
 * @prop {integer} [header_row_count=1]
 *   A non-negative integer specifying the number of header rows at the top of the table.
 *   Default to 1 if absent.
 * @min 0
 */

/**
 * @typedef TableColumn
 *
 * Describes a column of a table.
 *
 * @prop {string} name
 *   The column name. It must be unique among column names in the same table when compared in a
 *   case-insensitive manner. Must be non-empty. May contain white-space characters but not
 *   exclusively.
 *
 * @prop {'text' | 'number' | 'boolean' | 'datetime' | 'unknown'} [data_type='unknown']
 *   Describes the type of values found in the cells of the column, when they are uniform.
 *
 * @prop {string} [formula]
 *   If the column is a calculated column, then this field must include the formula used.
 */

/**
 * @typedef CalcProps
 *
 * Directions on how a spreadsheet application should run calculations in the workbook.
 *
 * @prop {boolean} iterate
 *   Specifies whether an attempt should be made to calculate formulas that contain circular
 *   references. Defaults to `false` in Excel.
 *
 * @prop {integer} iterate_count
 *   The maximum number of calculation iterations, when `iterate` is `true`. Defaults to `100` in
 *   Excel.
 *
 * @prop {number} iterate_delta
 *   When a calculation iteration results in an absolute change that is less than iterate_delta,
 *   then no further iterations should be attempted. Defaults to `0.001` in Excel.
 */

/**
 * @typedef Style
 *
 * Captures the styles which apply to a cell.
 *
 * @prop {string} [font-name="Calibri"]
 *   The name of the font, e.g. `"Arial"`.
 *
 * @prop {PixelValue} [font-size=11]
 *   The font size in pixels.
 *
 * @prop {Color} [font-color="#000"]
 *   The font color.
 *
 * @prop {boolean} [bold=false]
 *   Indicates whether the text is bold.
 *
 * @prop {boolean} [italic=false]
 *   Indicates whether the text is italic.
 *
 * @prop {string} [underline="none"]
 *   Text underline decoration type.
 *
 * @prop {Color} [fill-color="#FFF"]
 *   The cell's background color.
 *
 * @prop {BorderStyle} [border-top-style="none"]
 *   Top border style.
 *
 * @prop {Color} [border-top-color]
 *   Top border color.
 *
 * @prop {BorderStyle} [border-left-style="none"]
 *   Left border style.
 *
 * @prop {Color} [border-left-color]
 *   Left border color.
 *
 * @prop {BorderStyle} [border-bottom-style="none"]
 *   Bottom border style.
 *
 * @prop {Color} [border-bottom-color]
 *   Bottom border color.
 *
 * @prop {BorderStyle} [border-right-style="none"]
 *   Right border style.
 *
 * @prop {Color} [border-right-color]
 *   Right border color.
 *
 * @prop {HAlign} [horizontal-alignment="general"]
 *   Horizontal alignment of the cells [text] content.
 *
 * @prop {VAlign} [vertical-alignment]
 *   Vertical alignment of the cells [text] content.
 *
 * @prop {boolean} [wrap-text]
 *   Indicates whether text should be wrapped when it exceeds the cell's width.
 *
 * @prop {boolean} [shrink-to-fit]
 *   Indicates whether the font-size should be automatically reduced in order to make the contents
 *   of the cell visible.
 *
 * @prop {string} [number-format]
 *   Formatting directions for rendering the cell's value to text.
 */

/**
 * @typedef Drawing
 *
 * Drawing describes the position and size of a visual asset on a worksheet.
 *
 * A drawing may be a chart or some other type of picture.
 *
 * @prop {AnchorAbs | AnchorCell | AnchorTwoCell} anchor
 *   Directions for where the drawing should be placed.
 *
 * @prop {string} [chart_id]
 *   Pointer to a chart to display.
 */

/**
 * @typedef AnchorAbs
 *
 * A single coordinate placement anchor.
 *
 * @prop {'absolute'} type
 *   The type of the anchor.
 *
 * @prop {Point} position
 *   The anchor point location.
 *
 * @prop {Point} extent
 *   The width and height dimensions.
 */

/**
 * @typedef AnchorCell
 *
 * A cell-contained placement anchor.
 *
 * @prop {'cell'} type
 *   The type of the anchor.
 *
 * @prop {CellOffset} top_left
 *   The top/left anchor point location.
 *
 * @prop {Point} extent
 *   The width and height dimensions.
 */

/**
 * @typedef AnchorTwoCell
 *
 * A coordinate placement defined by two corner points.
 *
 * @prop {'two_cell'} type
 *   The type of the anchor.
 *
 * @prop {CellOffset} top_left
 *   The top/left anchor point location.
 *
 * @prop {CellOffset} bottom_right
 *   The bottom/right anchor point location.
 */

/**
 * @typedef CellOffset
 *
 * Offset defined by a cell position and its inner
 *
 * @prop {integer} row
 *   The cell's row number (1 based?).
 *
 * @prop {integer} column
 *   The cell's column number (1 based?).
 *
 * @prop {PixelValue} row_offset
 *   The horizontal position within the cell in pixels.
 *
 * @prop {PixelValue} column_offset
 *   The vertical position within the cell in pixels.
 */

/**
 * @typedef Point
 *
 * A coordinate or dimensional sizes in a 2D euclidean space where positive Y increases downwards.
 *
 * @prop {PixelValue} x
 *   A vertical measure in pixels (0 based)
 *
 * @prop {PixelValue} y
 *   A horizontal measure in pixels (0 based)
 */

/**
 * @typedef Chart
 *
 * A chart is a generated data driven image that has the purpose of giving insight to its
 * underlying numerical values.
 *
 * When `title` field is empty or absent, and the chart has exactly 1 series, the series name
 * should be used as the chart title instead. Except, if `auto_title_deleted` is `true`, where
 * no title should be displayed.
 *
 * @prop {string} id
 *   An identifier for the chart, unique to the workbook.
 *
 * @prop {ChartType | 'combo'} type
 *   The type of the chart.
 *
 * @prop {ChartSeries[]} series
 *   The data series used to render plots.
 *
 * @prop {ChartAxis[]} [axes]
 *   Axes present in the chart.
 *
 * @prop {Formula | string} [title]
 *   The title of the chart.
 *
 * @prop {boolean} [auto_title_deleted=true]
 *   Indicates whether a title should be displayed (true = don't display).
 *
 * @prop {Formula} [labels]
 *   A cell range or formula indicating where chart labels should be read from.
 *
 * @prop {Side | 'top-right'} [legend='top-right']
 *   Positioning of a chart legend.
 *
 * @prop {DataLabels} [data_labels]
 *   Directions on how to display labels for values on plots.
 *
 * @prop {'standard' | 'stacked' | 'clustered' | 'percentStacked'} [grouping]
 *   Specifies the possible groupings for a chart that can be grouped (Bar)
 *   - `clustered` - Chart series should be drawn next to each other along the category axis.
 *   - `percentStacked` - Chart series should be drawn next to each other along the value axis and
 *      scaled to total 100%.
 *   - `stacked` - Chart series should be drawn next to each other on the value axis.
 *   - `standard` - Chart series should be drawn next to each other on the depth axis.
 *
 * @prop {boolean} [vary_colors]
 *   When `true`, the colors within a series should vary by point.
 */

/**
 * @typedef ChartAxis
 *
 * Describes a chart axis.
 *
 * XXX: axis restriction: min and max cannot cross 0 if log_base is present
 *
 * @prop {'category' | 'value' | 'date' | 'series'} type
 *   The type of the axis.
 *
 * @prop {Side} position
 *   The position of the axis against a plot area edge.
 *
 * @prop {Formula | string} [title]
 *   The title of the axis.
 *
 * @prop {string} [number_format]
 *   A number format to use to display any axis values.
 *
 * @prop {'minMax' | 'maxMin'} [orientation="minMax"]
 *   Indicates if the axis is "reversed". Assume minMax if absent (not reversed).
 *
 * @prop {number} [min]
 *   Minimum value to clip the axis too (do not render things outside this value).
 *
 * @prop {number} [max]
 *   Maximum value to clip the axis too (do not render things outside this value).
 *
 * @prop {integer} [log_base]
 *   Indicates that this is a logarithmic axis and what base it should use.
 * @min 2
 */

/**
 * @typedef ChartSeries
 *
 * Describes a data-series to be used to drive a plot in a chart.
 *
 * @prop {Formula | string} name
 *   The name of this series.
 *
 * @prop {Formula[]} values
 *   A list of cell ranges or formulas indicating where values of the series should be read from.
 *
 *   This is an array to accommodate multi-dimensional series for scatter and bubble charts
 *
 * @prop {ChartType} [chart_type]
 *   Type of chart that the series belongs to (only used in combo charts)
 */

/**
 * @typedef DataLabels
 *
 * Directions on how to display labels for data values on plots.
 *
 * @prop {boolean} values
 *   Should values be shown or not?
 */

/**
 * @typedef {'top' | 'bottom' | 'left' | 'right'} Side
 */

/**
 * @typedef {'area' | 'area3D' | 'bar' | 'bar3D' | 'bubble' | 'column' | 'column3D' | 'doughnut' |
 *           'line' | 'line3D' | 'ofPie' | 'pie' | 'pie3D' | 'radar' | 'scatter' | 'stock' |
 *           'surface' | 'surface3D'} ChartType
 *
 * The type of a chart describes what plot marks should be used to represent the data.
 */

/**
 * @typedef {string} Formula
 *
 * A Excel spreadsheet formula language expression in string form. Range references use A1-style.
 *
 * ```Excel
 * "=SUM(A1:C4)*COUNT(B:B)"
 * ````
 * @pattern ^=
 */

/**
 * @typedef {string} Color
 *
 * A hex-encoded RGBA value that conforms to the CSS4 color specification.
 *
 * ```
 * "#3cb371"
 * ````
 *
 * @see [CSS spec](https://www.w3.org/TR/css-color-4/#hex-notation)
 * @pattern ^#([a-fA-F0-9]{3,4}|([a-fA-F0-9][a-fA-F0-9]){3,4})$
 */

/**
 * @typedef {string} CellId
 *
 * A cell coordinate in an uppercase A1-style reference format.
 *
 * The lower top-left bounds of the reference are `A1` inclusive, and the upper
 * bottom-right bound are `XFD1048576` inclusive.
 *
 * ```
 * "AG14"
 * ````
 *
 * @pattern ^[A-Z]{1,3}[0-9]{1,3}$
 */

/**
 * @typedef {string} CellRange
 *
 * A cell coordinate range in an uppercase A1-style reference format.
 *
 * The range consists of two {@link CellId} surrounding a colon (`:`) character.
 *
 * ```
 * "H6:J36"
 * ````
 *
 * @pattern ^([A-Z]{1,3}[0-9]{1,3}):([A-Z]{1,3}[0-9]{1,3})$
 */

/**
 * @typedef {number} PixelValue
 *
 * A measure in pixels.
 *
 * @min 0
 */

/**
 * @typedef {'none' | 'dashDot' | 'dashDotDot' | 'dashed' | 'dotted' | 'double' | 'hair' |
 *           'medium' | 'mediumDashDot' | 'mediumDashDotDot' | 'mediumDashed' | 'slantDashDot' |
 *           'thick' | 'thin'} BorderStyle
 *
 * The style to use when drawing a cell border. If the worksheets zoom factor is changed the width
 * of the border is expected to stay the same.
 *
 * | Value | Description
 * | --- | ---
 * | `none` | No border is drawn.
 * | `dashDot` | Equivalent to SVG `stroke-dasharray="4 1 2 1"`, at a 1px width.
 * | `dashDotDot` | Equivalent to SVG `stroke-dasharray="4 1 2 1 2 1"`, at a 1px width.
 * | `dashed` | Equivalent to SVG `stroke-dasharray=""3 1`, at a 1px width.
 * | `dotted` | Equivalent to SVG `stroke-dasharray="1"`, at a 1px width.
 * | `double` | Draw two 1px wide continuous parallel lines with a 1px gap between them.
 * | `hair` | Draw a 1px wide pixel continuous hairline.
 * | `medium` | Draw a 2px wide pixel continuous line.
 * | `mediumDashDot` | Equivalent to SVG `stroke-dasharray="4 1 2 1"`, at a 2px width.
 * | `mediumDashDotDot` | Equivalent to SVG `stroke-dasharray="4 1 2 1 2 1"`, at a 2px width.
 * | `mediumDashed` | Equivalent to SVG `stroke-dasharray=""3 1`, at a 2px width.
 * | `slantDashDot` | Draw two 1px parallel dashed lines where the lower/left line 1px "behind" the other, creating a slant.
 * | `thick` | Draw a 3px wide pixel continuous line.
 * | `thin` | Draw a 1px wide pixel continuous line.
 */

/**
 * @typedef {'general' | 'left' | 'center' | 'right' | 'fill' | 'justify' | 'centerContinuous' |
 *           'distributed'} HAlign
 *
 * Specifies the horizontal alignment of content (text) within a container (cell).
 *
 * | Value | Description
 * | --- | ---
 * | `center` | The horizontal alignment is centered, meaning the text is centered across the cell.
 * | `centerContinuous` | The horizontal alignment is centered across multiple cells.
 * | `distributed` | Indicates that each 'word' in each line of text inside the cell is evenly distributed across the width of the cell, with flush right and left margins.
 * | `fill` | Indicates that the value of the cell should be filled across the entire width of the cell. If blank cells to the right also have the fill alignment, they are also filled with the value, using a convention similar to centerContinuous.
 * | `general` | The horizontal alignment is general-aligned. Text data is left-aligned. Numbers, dates, and times are right- aligned. Boolean types are centered.
 * | `justify` | For each line of text, aligns each line of the wrapped text in a cell to the right and left (except the last line).
 * | `left` | Aligns content at the left edge of the cell (even in RTL mode).
 * | `right` | Aligns content at the right edge of the cell (even in RTL mode).
 *
 * XXX: Not sure all of these needs to exist. I think some are automatic behavior MS are codifying. (ST_HorizontalAlignment 3.18.42)
 */

/**
 * @typedef {'bottom' | 'top' | 'center' | 'justify' | 'distributed'} VAlign
 *
 * Vertical alignment of a cell content.
 */

/**
 * @typedef {'none' | 'single' | 'singleAccounting' | 'double' | 'doubleAccounting'} Underline
 *
 * Which type of underline to use when rendering text.
 */

/**
 * @typedef External
 *
 * Captures of external cells referenced by the workbook.
 *
 * @prop {string} filename
 *   Filename being referenced.
 *
 * @prop {ExtSheet[]} sheets
 *   An list of the relevant worksheets from an external workbook.
 *
 *   These will only be a capture the subset of sheets needed to run calculations so indexes from
 *   the original workbooks will not be preserved.
 *
 * @prop {NameDefinition[]} names
 *   A list of relevant defined names from an external workbook.
 */

/**
 * @typedef ExtSheet
 *
 * A simple container sheet for cell values
 *
 * @prop {string} name
 *   Name of the worksheet.
 *
 * @prop {Record<CellId, Cell>} cells
 *   The cells belonging to the worksheet that have any data attached.
 *
 *   Typically, these will have only values and calculation directives attached as they will not
 *   be rendered by a spreadsheet application.
 */

// ensures this file is picked up
export default null;
