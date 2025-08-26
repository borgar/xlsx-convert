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
 * @prop {0 | 1 | 2} hidden
 *   Whether or not the sheet should be shown to a user in a UI displaying the workbook.
 *   - 0 = sheet is visible
 *   - 1 = sheet is hidden
 *   - 2 = sheet is "extra hidden"
 * @prop {boolean} [showGridLines]
 *   Indicates whether a hairline-grid should be drawn when displaying the sheet.
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
 * @prop {string} [l]
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
 * GridSize information is run-length encoded. The start and end attributes indicate the range of
 * items that the `size` and `s` attributes affect. The range is expressed using integers, where
 * 1 corresponds to column A or row 1.
 *
 * GridSize may have a style-index (s) attribute like individual cells. The styling information on
 * the column should be used for all cells that are not present in the sheet's cell collection.
 * @prop {integer} start
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
 * @prop {1900 | 1904} [epoch]
 *   Which of the two date systems the workbook uses. 1900 is the deafult.
 *   See: <https://learn.microsoft.com/en-us/office/troubleshoot/excel/1900-and-1904-date-system>
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
 * @prop {JSFColor} [patternColor="#000"]
 *   The color of a cell's background fill.
 * @prop {JSFPatternStyle} [patternStyle="none"]
 *   The style of a cell's background fill.
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
 * @typedef {`=${string}`} JSFFormula
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
 * @typedef {'none' | 'solid' | 'mediumGray' | 'darkGray' | 'lightGray' | 'darkHorizontal' |
 *           'darkVertical' | 'darkDown' | 'darkUp' | 'darkGrid' | 'darkTrellis' | 'lightHorizontal' |
 *           'lightVertical' | 'lightDown' | 'lightUp' | 'lightGrid' | 'lightTrellis' | 'gray125' |
 *           'gray0625'} JSFPatternStyle
 *   The style of fill pattern used for a cell background. If the worksheets zoom factor is changed the pixel
 *   scale of the pattern is still expected to stay the same.
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
