/**
 * A workbook is a collection of worksheets, calculation directions, and other meta-data.
 */
type JSFWorkbook = {
    /**
     *   Name of the workbook.
     */
    filename: string;
    /**
     *   An ordered list of the worksheets in the workbook.
     */
    sheets: JSFWorksheet[];
    /**
     *   A list of defined names.
     */
    names: JSFNameDefinition[];
    /**
     *   A list of information about tables and their columns.
     */
    tables: JSFTable[];
    /**
     * Directions on how a spreadsheet application should run calculations in the workbook.
     */
    calculationProperties?: JSFCalcProps;
    /**
     *   Styles for cells in the workbook.
     */
    styles: JSFStyle[];
    /**
     * Captures of external cells referenced by the workbook.
     */
    externals?: JSFExternal[];
    /**
     * A list of formulas in R1C1-reference notation from the workbook.
     */
    formulas?: string[];
};
/**
 * A worksheet is a collection of cells.
 */
type JSFWorksheet = {
    /**
     *   Name of the worksheet.
     */
    name: string;
    /**
     *   The cells belonging to the worksheet that have any data attached.
     */
    cells: Record<JSFCellId, JSFCell>;
    /**
     *   Widths and styles of the columns in the worksheet.
     */
    columns: JSFGridSize[];
    /**
     *   Heights and styles of the rows in the worksheet.
     */
    rows: JSFGridSize[];
    /**
     *   A list of ranges that capture which cells have been merged.
     */
    merges: string[];
    /**
     *   A collection of default properties that apply to cells, rows, or columns in the worksheet.
     */
    defaults: JSFSheetDefaults;
    /**
     *   Whether or not the sheet should be shown to a user in a UI displaying the workbook.
     *   - 0 = sheet is visible
     *   - 1 = sheet is hidden
     *   - 2 = sheet is "extra hidden"
     */
    hidden: 0 | 1 | 2;
    /**
     * Indicates whether a hairline-grid should be drawn when displaying the sheet.
     */
    showGridLines?: boolean;
};
/**
 * A spreadsheet cell.
 */
type JSFCell = {
    /**
     * The value of the cell, it is assumed to be derived from a formula if the cell has one, else it
     * is safe to assume that it is user-entered.
     */
    v?: string | null | number | boolean;
    /**
     * Cell formula expression. When the value is a string it will be a formula with A1-style references.
     * When the value is a number is an index to a formula in the workbook formulas list
     */
    f?: string | integer;
    /**
     * A hyperlink URL address.
     */
    l?: string;
    /**
     * The range of enclosing array if formula is an array formula.
     */
    F?: string;
    /**
     * An index to a style in the workbook styles list.
     */
    s?: integer;
    /**
     * A list of comments associated with the cell.
     */
    c?: JSFComment[];
    /**
     * The type of the value contained in the cell. The property is optional as the type may be
     * inferred from the `v` property of the cell, except in the case of errors.
     * - `b` = boolean
     * - `e` = error
     * - `n` = number
     * - `d` = date
     * - `s` = string
     * - `z` = blank
     */
    t?: "b" | "e" | "n" | "d" | "s" | "z";
};
/**
 * A cell comment.
 */
type JSFComment = {
    /**
     *   Author of the comment.
     */
    a: string;
    /**
     *   Date of the comment (as an ISO formatted string).
     */
    d: string;
    /**
     *   The text content of the comment.
     */
    t: string;
};
/**
 * A collection of default properties that apply to cells, rows, or columns in the worksheet.
 */
type JSFSheetDefaults = {
    /**
     *   Default width of the UI-grid column.
     */
    colWidth: number;
    /**
     *   Default height of the UI-grid height.
     */
    rowHeight: number;
};
/**
 * A size of a UI-grid measure over a range of items.
 *
 * GridSize information is run-length encoded. The start and end attributes indicate the range of
 * items that the `size` and `s` attributes affect. The range is expressed using integers, where
 * 1 corresponds to column A or row 1.
 *
 * GridSize may have a style-index (s) attribute like individual cells. The styling information on
 * the column should be used for all cells that are not present in the sheet's cell collection.
 */
type JSFGridSize = {
    /**
     *   A 1-based inclusive start index.
     */
    start: integer;
    /**
     *   A 1-based inclusive end index.
     */
    end: integer;
    /**
     *   The size of the grid item [in pixels].
     */
    size: number;
    /**
     * An index to a style in the workbook styles list.
     */
    s?: integer;
};
/**
 * Contains information about table structures and their columns. The information therein can be
 * used to resolve structured references and evaluate calculated columns.
 *
 * See: <https://support.microsoft.com/en-us/office/using-structured-references-with-excel-tables-f5ed2452-2337-4f71-bed3-c8ae6d2b276e>
 */
type JSFTable = {
    /**
     *   The name of the table. This name must adhere to the same restrictions as defined names in
     *   Excel. In particular, it cannot contain spaces.
     */
    name: string;
    /**
     *   The name of the sheet on which the table is located.
     */
    sheet: string;
    /**
     *   A non-prefixed range reference to the area containing the table. The range shall include the
     *   column headers.
     */
    ref: JSFCellRange;
    /**
     *   An array of column objects. They shall be ordered from left to right, so that the first column
     *   corresponds to the leftmost column in the referenced range and the last column corresponds to
     *   the rightmost column.
     */
    columns: JSFTableColumn[];
    /**
     * A non-negative integer specifying the number of Totals Rows at the bottom of the table.
     * Default to 0 if absent.
     */
    totalsRowCount?: integer;
    /**
     * A non-negative integer specifying the number of header rows at the top of the table.
     * Default to 1 if absent.
     */
    headerRowCount?: integer;
};
/**
 * A defined name (also called "named range") is a labeled reference to a cell, range, constant or
 * formula. Meaningful labels can make formula expressions more readable and more robust to
 * worksheet edits.
 *
 * ```json
 * { "name": "Rates",
 * "scope": "Sheet1",
 * "value": "Sheet1!B1:C1" }
 * ```
 */
type JSFNameDefinition = {
    /**
     *   A case-sensitive name. Names must start with a letter or `_`, and may only be made up of
     *   letters as well as `\`, `_`, `.`, or `?`. Names must be a valid A1 or R1C1-style reference.
     */
    name: string;
    /**
     *   A formula expression, a reference, or value. Whatever the value is will be evaluated by a
     *   spreadsheet engine as if it were an expression.
     */
    value: string;
    /**
     * An optional worksheet name that defines the scope for this name. When this field is absent,
     * the Defined Name should be considered to have a Workbook scope.
     */
    scope?: string;
    /**
     * An optional comment explaining the name.
     */
    comment?: string;
};
/**
 * Describes a column of a table.
 */
type JSFTableColumn = {
    /**
     *   The column name. It must be unique among column names in the same table when compared in a
     *   case-insensitive manner. Must be non-empty. May contain white-space characters but not
     *   exclusively.
     */
    name: string;
    /**
     * Describes the type of values found in the cells of the column, when they are uniform.
     */
    dataType?: "text" | "number" | "boolean" | "datetime" | "unknown";
    /**
     * If the column is a calculated column, then this field must include the formula used.
     */
    formula?: string;
};
/**
 * Directions on how a spreadsheet application should run calculations in the workbook.
 */
type JSFCalcProps = {
    /**
     *   Specifies whether an attempt should be made to calculate formulas that contain circular
     *   references. Defaults to `false` in Excel.
     */
    iterate: boolean;
    /**
     *   The maximum number of calculation iterations, when `iterate` is `true`. Defaults to `100` in
     *   Excel.
     */
    iterateCount: integer;
    /**
     *   When a calculation iteration results in an absolute change that is less than iterateDelta,
     *   then no further iterations should be attempted. Defaults to `0.001` in Excel.
     */
    iterateDelta: number;
    /**
     * Which of the two date systems the workbook uses. 1900 is the deafult.
     * See: <https://learn.microsoft.com/en-us/office/troubleshoot/excel/1900-and-1904-date-system>
     */
    epoch?: 1900 | 1904;
};
/**
 * Captures the styles which apply to a cell.
 */
type JSFStyle = {
    /**
     * The name of the font, e.g. `"Arial"`.
     */
    fontName?: string;
    /**
     * The font size in pixels.
     */
    fontSize?: JSFPixelValue;
    /**
     * The font color.
     */
    fontColor?: JSFColor;
    /**
     * Indicates whether the text is bold.
     */
    bold?: boolean;
    /**
     * Indicates whether the text is italic.
     */
    italic?: boolean;
    /**
     * Text underline decoration type.
     */
    underline?: JSFUnderline;
    /**
     * The cell's background color.
     */
    fillColor?: JSFColor;
    /**
     * The color of a cell's background fill.
     */
    patternColor?: JSFColor;
    /**
     * The style of a cell's background fill.
     */
    patternStyle?: JSFPatternStyle;
    /**
     * Top border style.
     */
    borderTopStyle?: JSFBorderStyle;
    /**
     * Top border color.
     */
    borderTopColor?: JSFColor;
    /**
     * Left border style.
     */
    borderLeftStyle?: JSFBorderStyle;
    /**
     * Left border color.
     */
    borderLeftColor?: JSFColor;
    /**
     * Bottom border style.
     */
    borderBottomStyle?: JSFBorderStyle;
    /**
     * Bottom border color.
     */
    borderBottomColor?: JSFColor;
    /**
     * Right border style.
     */
    borderRightStyle?: JSFBorderStyle;
    /**
     * Right border color.
     */
    borderRightColor?: JSFColor;
    /**
     * Horizontal alignment of the cells [text] content.
     */
    horizontalAlignment?: JSFHAlign;
    /**
     * Vertical alignment of the cells [text] content.
     */
    verticalAlignment?: JSFVAlign;
    /**
     * Indicates whether text should be wrapped when it exceeds the cell's width.
     */
    wrapText?: boolean;
    /**
     * Indicates whether the font-size should be automatically reduced in order to make the contents
     * of the cell visible.
     */
    shrinkToFit?: boolean;
    /**
     * Formatting directions for rendering the cell's value to text.
     */
    numberFormat?: string;
};
/**
 * A Excel spreadsheet formula language expression in string form. Range references use A1-style.
 *
 * ```Excel
 * "=SUM(A1:C4)*COUNT(B:B)"
 * ````
 */
type JSFFormula = `=${string}`;
/**
 * A hex-encoded RGBA value that conforms to the CSS4 color specification (`"#3cb371"`).
 */
type JSFColor = `#${string}`;
/**
 * A cell coordinate in an uppercase A1-style reference format (`"AG14"`).
 *
 * The lower top-left bounds of the reference are `A1` inclusive, and the upper
 * bottom-right bound are `XFD1048576` inclusive.
 */
type JSFCellId = string;
/**
 * A cell coordinate range in an uppercase A1-style reference format (`"H6:J36"`).
 *
 * The range consists of two {@link CellId} surrounding a colon (`:`) character.
 */
type JSFCellRange = string;
/**
 * A measure in pixels.
 */
type JSFPixelValue = number;
/**
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
type JSFBorderStyle = "none" | "dashDot" | "dashDotDot" | "dashed" | "dotted" | "double" | "hair" | "medium" | "mediumDashDot" | "mediumDashDotDot" | "mediumDashed" | "slantDashDot" | "thick" | "thin";
/**
 * The style of fill pattern used for a cell background. If the worksheets zoom factor is changed the pixel
 * scale of the pattern is still expected to stay the same.
 */
type JSFPatternStyle = "none" | "solid" | "mediumGray" | "darkGray" | "lightGray" | "darkHorizontal" | "darkVertical" | "darkDown" | "darkUp" | "darkGrid" | "darkTrellis" | "lightHorizontal" | "lightVertical" | "lightDown" | "lightUp" | "lightGrid" | "lightTrellis" | "gray125" | "gray0625";
/**
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
 */
type JSFHAlign = "general" | "left" | "center" | "right" | "fill" | "justify" | "centerContinuous" | "distributed";
/**
 * Vertical alignment of a cell content.
 */
type JSFVAlign = "bottom" | "top" | "center" | "justify" | "distributed";
/**
 * Which type of underline to use when rendering text.
 */
type JSFUnderline = "none" | "single" | "singleAccounting" | "double" | "doubleAccounting";
/**
 * Captures of external cells referenced by the workbook.
 */
type JSFExternal = {
    /**
     *   Filename being referenced.
     */
    filename: string;
    /**
     *   A list of the relevant worksheets from an external workbook.
     *
     *   These will only be a capture the subset of sheets needed to run calculations so indexes from
     *   the original workbooks will not be preserved.
     */
    sheets: JSFExtSheet[];
    /**
     *   A list of relevant defined names from an external workbook.
     */
    names: JSFNameDefinition[];
};
/**
 * A simple container sheet for cell values
 */
type JSFExtSheet = {
    /**
     *   Name of the worksheet.
     */
    name: string;
    /**
     *   The cells belonging to the worksheet that have any data attached.
     *
     *   Typically, these will have only values and calculation directives attached as they will not
     *   be rendered by a spreadsheet application.
     */
    cells: Record<JSFCellId, JSFCell>;
};
type integer = number;

/** Convertion options */
type ConversionOptions = {
    skipMerged?: boolean;
    cellFormulas?: boolean;
};
/**
 * Convert an XLSX file into a JSON format.
 *
 * @param filename Target file to convert
 * @param options Conversion options
 * @param [options.skipMerged] Skip any cells that are a part of merges.
 * @param [options.cellFormulas] Formulas are attached to cells rather than being included separately.
 * @return A JSON spreadsheet object.
 */
declare function convert(filename: string, options?: ConversionOptions): Promise<JSFWorkbook>;
/**
 * Convert an XLSX file into a JSON format.
 *
 * @param buffer Buffer containing the file to convert
 * @param filename Name of the file being converted
 * @param [options] Conversion options
 * @return A JSON spreadsheet formatted object.
 */
declare function convertBinary(buffer: Buffer | ArrayBuffer, filename: string, options?: ConversionOptions): Promise<JSFWorkbook>;

export { type ConversionOptions, type JSFBorderStyle, type JSFCalcProps, type JSFCell, type JSFCellId, type JSFCellRange, type JSFColor, type JSFComment, type JSFExtSheet, type JSFExternal, type JSFFormula, type JSFGridSize, type JSFHAlign, type JSFNameDefinition, type JSFPatternStyle, type JSFPixelValue, type JSFSheetDefaults, type JSFStyle, type JSFTable, type JSFTableColumn, type JSFUnderline, type JSFVAlign, type JSFWorkbook, type JSFWorksheet, convertBinary, convert as default, type integer };
