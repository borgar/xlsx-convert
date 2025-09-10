
<a name="readmemd"></a>

# @borgar/xlsx-convert

## Type Aliases

- [ConversionOptions](#type-aliasesconversionoptionsmd)
- [JSFBorderStyle](#type-aliasesjsfborderstylemd)
- [JSFCalcProps](#type-aliasesjsfcalcpropsmd)
- [JSFCell](#type-aliasesjsfcellmd)
- [JSFCellId](#type-aliasesjsfcellidmd)
- [JSFCellRange](#type-aliasesjsfcellrangemd)
- [JSFCellValueType](#type-aliasesjsfcellvaluetypemd)
- [JSFColor](#type-aliasesjsfcolormd)
- [JSFComment](#type-aliasesjsfcommentmd)
- [JSFExternal](#type-aliasesjsfexternalmd)
- [JSFExtSheet](#type-aliasesjsfextsheetmd)
- [JSFGridSize](#type-aliasesjsfgridsizemd)
- [JSFHAlign](#type-aliasesjsfhalignmd)
- [JSFNameDefinition](#type-aliasesjsfnamedefinitionmd)
- [JSFPatternStyle](#type-aliasesjsfpatternstylemd)
- [JSFPixelValue](#type-aliasesjsfpixelvaluemd)
- [JSFSheetDefaults](#type-aliasesjsfsheetdefaultsmd)
- [JSFStyle](#type-aliasesjsfstylemd)
- [JSFTable](#type-aliasesjsftablemd)
- [JSFTableColumn](#type-aliasesjsftablecolumnmd)
- [JSFUnderline](#type-aliasesjsfunderlinemd)
- [JSFVAlign](#type-aliasesjsfvalignmd)
- [JSFWorkbook](#type-aliasesjsfworkbookmd)
- [JSFWorksheet](#type-aliasesjsfworksheetmd)

## Functions

- [convert](#functionsconvertmd)
- [convertBinary](#functionsconvertbinarymd)

## References

### default

Renames and re-exports [convert](#functionsconvertmd)


<a name="functionsconvertmd"></a>

# convert()

```ts
function convert(filename: string, options?: ConversionOptions): Promise<JSFWorkbook>;
```

Load and convert an XLSX file into a JSON format.

The returned JSF structure contains most of the data from the original file, although some details
may be lost in the conversion process.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filename` | `string` | Target filename to convert |
| `options?` | [`ConversionOptions`](#type-aliasesconversionoptionsmd) | Conversion options |

## Returns

`Promise`\<[`JSFWorkbook`](#type-aliasesjsfworkbookmd)\>

A JSON spreadsheet object.


<a name="functionsconvertbinarymd"></a>

# convertBinary()

```ts
function convertBinary(
   buffer: ArrayBuffer | Buffer<ArrayBufferLike>, 
   filename: string, 
options?: ConversionOptions): Promise<JSFWorkbook>;
```

Convert an XLSX binary into a JSON format.

The returned JSF structure contains most of the data from the original file, although some details
may be lost in the conversion process.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `buffer` | `ArrayBuffer` \| `Buffer`\<`ArrayBufferLike`\> | Buffer containing the file to convert |
| `filename` | `string` | Name of the file being converted |
| `options?` | [`ConversionOptions`](#type-aliasesconversionoptionsmd) | Conversion options |

## Returns

`Promise`\<[`JSFWorkbook`](#type-aliasesjsfworkbookmd)\>

A JSON spreadsheet formatted object.


<a name="type-aliasesconversionoptionsmd"></a>

# ConversionOptions

```ts
type ConversionOptions = {
  cellFormulas?: boolean;
  skipMerged?: boolean;
};
```

Convertion options

## Properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="cellformulas"></a> `cellFormulas?` | `boolean` | `false` | Formulas are attached to cells rather than being included as a separate list. |
| <a id="skipmerged"></a> `skipMerged?` | `boolean` | `true` | Skip cells that are a part of merges. |


<a name="type-aliasesjsfborderstylemd"></a>

# JSFBorderStyle

```ts
type JSFBorderStyle = 
  | "none"
  | "dashDot"
  | "dashDotDot"
  | "dashed"
  | "dotted"
  | "double"
  | "hair"
  | "medium"
  | "mediumDashDot"
  | "mediumDashDotDot"
  | "mediumDashed"
  | "slantDashDot"
  | "thick"
  | "thin";
```

The style to use when drawing a cell border. If the worksheets zoom factor is changed the width
of the border is expected to stay the same.

| Value | Description
| --- | ---
| `none` | No border is drawn.
| `dashDot` | Equivalent to SVG `stroke-dasharray="4 1 2 1"`, at a 1px width.
| `dashDotDot` | Equivalent to SVG `stroke-dasharray="4 1 2 1 2 1"`, at a 1px width.
| `dashed` | Equivalent to SVG `stroke-dasharray=""3 1`, at a 1px width.
| `dotted` | Equivalent to SVG `stroke-dasharray="1"`, at a 1px width.
| `double` | Draw two 1px wide continuous parallel lines with a 1px gap between them.
| `hair` | Draw a 1px wide pixel continuous hairline.
| `medium` | Draw a 2px wide pixel continuous line.
| `mediumDashDot` | Equivalent to SVG `stroke-dasharray="4 1 2 1"`, at a 2px width.
| `mediumDashDotDot` | Equivalent to SVG `stroke-dasharray="4 1 2 1 2 1"`, at a 2px width.
| `mediumDashed` | Equivalent to SVG `stroke-dasharray=""3 1`, at a 2px width.
| `slantDashDot` | Draw two 1px parallel dashed lines where the lower/left line 1px "behind" the other, creating a slant.
| `thick` | Draw a 3px wide pixel continuous line.
| `thin` | Draw a 1px wide pixel continuous line.


<a name="type-aliasesjsfcalcpropsmd"></a>

# JSFCalcProps

```ts
type JSFCalcProps = {
  epoch?: 1900 | 1904;
  iterate: boolean;
  iterateCount: integer;
  iterateDelta: number;
};
```

Directions on how a spreadsheet application should run calculations in the workbook.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="epoch"></a> `epoch?` | `1900` \| `1904` | Which of the two date systems the workbook uses. 1900 is the default. See: <https://learn.microsoft.com/en-us/office/troubleshoot/excel/1900-and-1904-date-system> |
| <a id="iterate"></a> `iterate` | `boolean` | Specifies whether an attempt should be made to calculate formulas that contain circular references. Defaults to `false` in Excel. |
| <a id="iteratecount"></a> `iterateCount` | `integer` | The maximum number of calculation iterations, when `iterate` is `true`. Defaults to `100` in Excel. |
| <a id="iteratedelta"></a> `iterateDelta` | `number` | When a calculation iteration results in an absolute change that is less than iterateDelta, then no further iterations should be attempted. Defaults to `0.001` in Excel. |


<a name="type-aliasesjsfcellmd"></a>

# JSFCell

```ts
type JSFCell = {
  c?: JSFComment[];
  f?: string | integer;
  F?: string;
  l?: string;
  s?: integer;
  t?: JSFCellValueType;
  v?: string | null | number | boolean;
};
```

A spreadsheet cell.

## Properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="c"></a> `c?` | [`JSFComment`](#type-aliasesjsfcommentmd)[] | `undefined` | A list of comments associated with the cell. |
| <a id="f"></a> `f?` | `string` \| `integer` | `undefined` | Cell formula expression. When the value is a string it will be a formula with A1-style references. When the value is a number is an index to a formula in the workbook formulas list |
| <a id="f-1"></a> `F?` | `string` | `undefined` | The range of enclosing array if formula is an array formula. |
| <a id="l"></a> `l?` | `string` | `undefined` | A hyperlink URL address. |
| <a id="s"></a> `s?` | `integer` | `0` | An index to a style in the workbook styles list. |
| <a id="t"></a> `t?` | [`JSFCellValueType`](#type-aliasesjsfcellvaluetypemd) | `undefined` | The type of the value contained in the cell. The property is optional as the type may be inferred from the `v` property of the cell, except in the case of errors (and dates). |
| <a id="v"></a> `v?` | `string` \| `null` \| `number` \| `boolean` | `null` | The value of the cell, it is assumed to be derived from a formula if the cell has one, else it is safe to assume that it is user-entered. |


<a name="type-aliasesjsfcellidmd"></a>

# JSFCellId

```ts
type JSFCellId = string;
```

A cell coordinate in an uppercase A1-style reference format (`"AG14"`).

The lower top-left bounds of the reference are `A1` inclusive, and the upper
bottom-right bound are `XFD1048576` inclusive.


<a name="type-aliasesjsfcellrangemd"></a>

# JSFCellRange

```ts
type JSFCellRange = string;
```

A cell coordinate range in an uppercase A1-style reference format (`"H6:J36"`).

The range consists of two [JSFCellId](#type-aliasesjsfcellidmd) surrounding a colon (`:`) character.


<a name="type-aliasesjsfcellvaluetypemd"></a>

# JSFCellValueType

```ts
type JSFCellValueType = "b" | "e" | "n" | "d" | "s" | "z";
```

Signifies type of value contained in a cell.
- `b` = boolean
- `e` = error
- `n` = number
- `d` = date
- `s` = string
- `z` = blank


<a name="type-aliasesjsfcolormd"></a>

# JSFColor

```ts
type JSFColor = `#${string}`;
```

A hex-encoded RGBA value that conforms to the CSS4 color specification (`"#3cb371"`).

See [CSS spec](https://www.w3.org/TR/css-color-4/#hex-notation)


<a name="type-aliasesjsfcommentmd"></a>

# JSFComment

```ts
type JSFComment = {
  a: string;
  d: string;
  t: string;
};
```

A cell comment.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="a"></a> `a` | `string` | Author of the comment. |
| <a id="d"></a> `d` | `string` | Date of the comment (as an ISO formatted string). |
| <a id="t"></a> `t` | `string` | The text content of the comment. |


<a name="type-aliasesjsfextsheetmd"></a>

# JSFExtSheet

```ts
type JSFExtSheet = {
  cells: Record<JSFCellId, JSFCell>;
  name: string;
};
```

A simple container sheet for cell values

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="cells"></a> `cells` | `Record`\<[`JSFCellId`](#type-aliasesjsfcellidmd), [`JSFCell`](#type-aliasesjsfcellmd)\> | The cells belonging to the worksheet that have any data attached. Typically, these will have only values and calculation directives attached as they will not be rendered by a spreadsheet application. |
| <a id="name"></a> `name` | `string` | Name of the worksheet. |


<a name="type-aliasesjsfexternalmd"></a>

# JSFExternal

```ts
type JSFExternal = {
  filename: string;
  names: JSFNameDefinition[];
  sheets: JSFExtSheet[];
};
```

Captures of external cells referenced by the workbook.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="filename"></a> `filename` | `string` | Filename being referenced. |
| <a id="names"></a> `names` | [`JSFNameDefinition`](#type-aliasesjsfnamedefinitionmd)[] | A list of relevant defined names from an external workbook. |
| <a id="sheets"></a> `sheets` | [`JSFExtSheet`](#type-aliasesjsfextsheetmd)[] | A list of the relevant worksheets from an external workbook. These will only be a capture the subset of sheets needed to run calculations so indexes from the original workbooks will not be preserved. |


<a name="type-aliasesjsfgridsizemd"></a>

# JSFGridSize

```ts
type JSFGridSize = {
  end: integer;
  s?: integer;
  size: JSFPixelValue;
  start: integer;
};
```

A size of a UI-grid measure over a range of items.

GridSize information is run-length encoded. The start and end attributes indicate the range of
items that the `size` and `s` attributes affect. The range is expressed using integers, where
1 corresponds to column A or row 1.

GridSize may have a style-index (s) attribute like individual cells. The styling information on
the column should be used for all cells that are not present in the sheet's cell collection.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="end"></a> `end` | `integer` | A 1-based inclusive end index. |
| <a id="s"></a> `s?` | `integer` | An index to a style in the workbook styles list. |
| <a id="size"></a> `size` | [`JSFPixelValue`](#type-aliasesjsfpixelvaluemd) | The size of the grid item [in pixels]. |
| <a id="start"></a> `start` | `integer` | A 1-based inclusive start index. |


<a name="type-aliasesjsfhalignmd"></a>

# JSFHAlign

```ts
type JSFHAlign = 
  | "general"
  | "left"
  | "center"
  | "right"
  | "fill"
  | "justify"
  | "centerContinuous"
  | "distributed";
```

Specifies the horizontal alignment of content (text) within a container (cell).

| Value | Description
| --- | ---
| `center` | The horizontal alignment is centered, meaning the text is centered across the cell.
| `centerContinuous` | The horizontal alignment is centered across multiple cells.
| `distributed` | Indicates that each 'word' in each line of text inside the cell is evenly distributed across the width of the cell, with flush right and left margins.
| `fill` | Indicates that the value of the cell should be filled across the entire width of the cell. If blank cells to the right also have the fill alignment, they are also filled with the value, using a convention similar to centerContinuous.
| `general` | The horizontal alignment is general-aligned. Text data is left-aligned. Numbers, dates, and times are right- aligned. Boolean types are centered.
| `justify` | For each line of text, aligns each line of the wrapped text in a cell to the right and left (except the last line).
| `left` | Aligns content at the left edge of the cell (even in RTL mode).
| `right` | Aligns content at the right edge of the cell (even in RTL mode).


<a name="type-aliasesjsfnamedefinitionmd"></a>

# JSFNameDefinition

```ts
type JSFNameDefinition = {
  comment?: string;
  name: string;
  scope?: string;
  value: string;
};
```

A defined name (also called "named range") is a labeled reference to a cell, range, constant or
formula. Meaningful labels can make formula expressions more readable and more robust to
worksheet edits.

```json
{ "name": "Rates",
  "scope": "Sheet1",
  "value": "Sheet1!B1:C1" }
```

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="comment"></a> `comment?` | `string` | An optional comment explaining the name. |
| <a id="name"></a> `name` | `string` | A case-sensitive name. Names must start with a letter or `_`, and may only be made up of letters as well as `\`, `_`, `.`, or `?`. Names must be a valid A1 or R1C1-style reference. |
| <a id="scope"></a> `scope?` | `string` | An optional worksheet name that defines the scope for this name. When this field is absent, the Defined Name should be considered to have a Workbook scope. |
| <a id="value"></a> `value` | `string` | A formula expression, a reference, or value. Whatever the value is will be evaluated by a spreadsheet engine as if it were an expression. |


<a name="type-aliasesjsfpatternstylemd"></a>

# JSFPatternStyle

```ts
type JSFPatternStyle = 
  | "none"
  | "solid"
  | "mediumGray"
  | "darkGray"
  | "lightGray"
  | "darkHorizontal"
  | "darkVertical"
  | "darkDown"
  | "darkUp"
  | "darkGrid"
  | "darkTrellis"
  | "lightHorizontal"
  | "lightVertical"
  | "lightDown"
  | "lightUp"
  | "lightGrid"
  | "lightTrellis"
  | "gray125"
  | "gray0625";
```

The style of fill pattern used for a cell background. If the worksheets zoom factor is changed the pixel
scale of the pattern is still expected to stay the same.


<a name="type-aliasesjsfpixelvaluemd"></a>

# JSFPixelValue

```ts
type JSFPixelValue = number;
```

A measure in pixels.


<a name="type-aliasesjsfsheetdefaultsmd"></a>

# JSFSheetDefaults

```ts
type JSFSheetDefaults = {
  colWidth: JSFPixelValue;
  rowHeight: JSFPixelValue;
};
```

A collection of default properties that apply to cells, rows, or columns in the worksheet.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="colwidth"></a> `colWidth` | [`JSFPixelValue`](#type-aliasesjsfpixelvaluemd) | Default width of the UI-grid column. |
| <a id="rowheight"></a> `rowHeight` | [`JSFPixelValue`](#type-aliasesjsfpixelvaluemd) | Default height of the UI-grid height. |


<a name="type-aliasesjsfstylemd"></a>

# JSFStyle

```ts
type JSFStyle = {
  bold?: boolean;
  borderBottomColor?: JSFColor;
  borderBottomStyle?: JSFBorderStyle;
  borderLeftColor?: JSFColor;
  borderLeftStyle?: JSFBorderStyle;
  borderRightColor?: JSFColor;
  borderRightStyle?: JSFBorderStyle;
  borderTopColor?: JSFColor;
  borderTopStyle?: JSFBorderStyle;
  color?: JSFColor;
  fillColor?: JSFColor;
  fontFamily?: string;
  fontSize?: JSFPixelValue;
  horizontalAlignment?: JSFHAlign;
  italic?: boolean;
  numberFormat?: string;
  patternColor?: JSFColor;
  patternStyle?: JSFPatternStyle;
  shrinkToFit?: boolean;
  underline?: JSFUnderline;
  verticalAlignment?: JSFVAlign;
  wrapText?: boolean;
};
```

Captures the styles which apply to a cell.

## Properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="bold"></a> `bold?` | `boolean` | `false` | Indicates whether the text is bold. |
| <a id="borderbottomcolor"></a> `borderBottomColor?` | [`JSFColor`](#type-aliasesjsfcolormd) | `undefined` | Bottom border color. |
| <a id="borderbottomstyle"></a> `borderBottomStyle?` | [`JSFBorderStyle`](#type-aliasesjsfborderstylemd) | `"none"` | Bottom border style. |
| <a id="borderleftcolor"></a> `borderLeftColor?` | [`JSFColor`](#type-aliasesjsfcolormd) | `undefined` | Left border color. |
| <a id="borderleftstyle"></a> `borderLeftStyle?` | [`JSFBorderStyle`](#type-aliasesjsfborderstylemd) | `"none"` | Left border style. |
| <a id="borderrightcolor"></a> `borderRightColor?` | [`JSFColor`](#type-aliasesjsfcolormd) | `undefined` | Right border color. |
| <a id="borderrightstyle"></a> `borderRightStyle?` | [`JSFBorderStyle`](#type-aliasesjsfborderstylemd) | `"none"` | Right border style. |
| <a id="bordertopcolor"></a> `borderTopColor?` | [`JSFColor`](#type-aliasesjsfcolormd) | `undefined` | Top border color. |
| <a id="bordertopstyle"></a> `borderTopStyle?` | [`JSFBorderStyle`](#type-aliasesjsfborderstylemd) | `"none"` | Top border style. |
| <a id="color"></a> `color?` | [`JSFColor`](#type-aliasesjsfcolormd) | `"#000"` | The color used to render text. |
| <a id="fillcolor"></a> `fillColor?` | [`JSFColor`](#type-aliasesjsfcolormd) | `"#FFFFFF"` | The cell's background color. |
| <a id="fontfamily"></a> `fontFamily?` | `string` | `"Calibri"` | The name of the font family used to render text, e.g. `"Arial"`. |
| <a id="fontsize"></a> `fontSize?` | [`JSFPixelValue`](#type-aliasesjsfpixelvaluemd) | `11` | The font size in pixels. |
| <a id="horizontalalignment"></a> `horizontalAlignment?` | [`JSFHAlign`](#type-aliasesjsfhalignmd) | `"general"` | Horizontal alignment of the cells [text] content. |
| <a id="italic"></a> `italic?` | `boolean` | `false` | Indicates whether the text is italic. |
| <a id="numberformat"></a> `numberFormat?` | `string` | `undefined` | Formatting directions for rendering the cell's value to text. |
| <a id="patterncolor"></a> `patternColor?` | [`JSFColor`](#type-aliasesjsfcolormd) | `"#000000"` | The color of a cell's background fill. |
| <a id="patternstyle"></a> `patternStyle?` | [`JSFPatternStyle`](#type-aliasesjsfpatternstylemd) | `"none"` | The style of a cell's background fill. |
| <a id="shrinktofit"></a> `shrinkToFit?` | `boolean` | `undefined` | Indicates whether the font-size should be automatically reduced in order to make the contents of the cell visible. |
| <a id="underline"></a> `underline?` | [`JSFUnderline`](#type-aliasesjsfunderlinemd) | `"none"` | Text underline decoration type. |
| <a id="verticalalignment"></a> `verticalAlignment?` | [`JSFVAlign`](#type-aliasesjsfvalignmd) | `"bottom"` | Vertical alignment of the cells [text] content. |
| <a id="wraptext"></a> `wrapText?` | `boolean` | `false` | Indicates whether text should be wrapped when it exceeds the cell's width. |


<a name="type-aliasesjsftablemd"></a>

# JSFTable

```ts
type JSFTable = {
  columns: JSFTableColumn[];
  headerRowCount?: integer;
  name: string;
  ref: JSFCellRange;
  sheet: string;
  totalsRowCount?: integer;
};
```

Contains information about table structures and their columns. The information therein can be
used to resolve structured references and evaluate calculated columns.

See: <https://support.microsoft.com/en-us/office/using-structured-references-with-excel-tables-f5ed2452-2337-4f71-bed3-c8ae6d2b276e>

## Properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="columns"></a> `columns` | [`JSFTableColumn`](#type-aliasesjsftablecolumnmd)[] | `undefined` | An array of column objects. They shall be ordered from left to right, so that the first column corresponds to the leftmost column in the referenced range and the last column corresponds to the rightmost column. |
| <a id="headerrowcount"></a> `headerRowCount?` | `integer` | `1` | A non-negative integer specifying the number of header rows at the top of the table. Default to 1 if absent. |
| <a id="name"></a> `name` | `string` | `undefined` | The name of the table. This name must adhere to the same restrictions as defined names in Excel. In particular, it cannot contain spaces. |
| <a id="ref"></a> `ref` | [`JSFCellRange`](#type-aliasesjsfcellrangemd) | `undefined` | A non-prefixed range reference to the area containing the table. The range shall include the column headers. |
| <a id="sheet"></a> `sheet` | `string` | `undefined` | The name of the sheet on which the table is located. |
| <a id="totalsrowcount"></a> `totalsRowCount?` | `integer` | `0` | A non-negative integer specifying the number of Totals Rows at the bottom of the table. Default to 0 if absent. |


<a name="type-aliasesjsftablecolumnmd"></a>

# JSFTableColumn

```ts
type JSFTableColumn = {
  dataType?: "text" | "number" | "boolean" | "datetime" | "unknown";
  formula?: string;
  name: string;
};
```

Describes a column of a table.

## Properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="datatype"></a> `dataType?` | `"text"` \| `"number"` \| `"boolean"` \| `"datetime"` \| `"unknown"` | `"unknown"` | Describes the type of values found in the cells of the column, when they are uniform. |
| <a id="formula"></a> `formula?` | `string` | `undefined` | If the column is a calculated column, then this field must include the formula used. |
| <a id="name"></a> `name` | `string` | `undefined` | The column name. It must be unique among column names in the same table when compared in a case-insensitive manner. Must be non-empty. May contain white-space characters but not exclusively. |


<a name="type-aliasesjsfunderlinemd"></a>

# JSFUnderline

```ts
type JSFUnderline = "none" | "single" | "singleAccounting" | "double" | "doubleAccounting";
```

Which type of underline to use when rendering text.


<a name="type-aliasesjsfvalignmd"></a>

# JSFVAlign

```ts
type JSFVAlign = "bottom" | "top" | "center" | "justify" | "distributed";
```

Vertical alignment of a cell content.


<a name="type-aliasesjsfworkbookmd"></a>

# JSFWorkbook

```ts
type JSFWorkbook = {
  calculationProperties?: JSFCalcProps;
  externals?: JSFExternal[];
  formulas?: string[];
  name: string;
  names: JSFNameDefinition[];
  sheets: JSFWorksheet[];
  styles: JSFStyle[];
  tables: JSFTable[];
};
```

A workbook is a collection of worksheets, calculation directions, and other meta-data.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="calculationproperties"></a> `calculationProperties?` | [`JSFCalcProps`](#type-aliasesjsfcalcpropsmd) | Directions on how a spreadsheet application should run calculations in the workbook. |
| <a id="externals"></a> `externals?` | [`JSFExternal`](#type-aliasesjsfexternalmd)[] | Captures of external cells referenced by the workbook. |
| <a id="formulas"></a> `formulas?` | `string`[] | A list of formulas in R1C1-reference notation from the workbook. |
| <a id="name"></a> `name` | `string` | Name of the workbook, in the case of xlsx it will be the filename. |
| <a id="names"></a> `names` | [`JSFNameDefinition`](#type-aliasesjsfnamedefinitionmd)[] | A list of defined names. |
| <a id="sheets"></a> `sheets` | [`JSFWorksheet`](#type-aliasesjsfworksheetmd)[] | An ordered list of the worksheets in the workbook. |
| <a id="styles"></a> `styles` | [`JSFStyle`](#type-aliasesjsfstylemd)[] | Styles for cells in the workbook. |
| <a id="tables"></a> `tables` | [`JSFTable`](#type-aliasesjsftablemd)[] | A list of information about tables and their columns. |


<a name="type-aliasesjsfworksheetmd"></a>

# JSFWorksheet

```ts
type JSFWorksheet = {
  cells: Record<JSFCellId, JSFCell>;
  columns: JSFGridSize[];
  defaults: JSFSheetDefaults;
  hidden: 0 | 1 | 2;
  merges: string[];
  name: string;
  rows: JSFGridSize[];
  showGridLines?: boolean;
};
```

A worksheet is a collection of cells.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="cells"></a> `cells` | `Record`\<[`JSFCellId`](#type-aliasesjsfcellidmd), [`JSFCell`](#type-aliasesjsfcellmd)\> | The cells belonging to the worksheet that have any data attached. |
| <a id="columns"></a> `columns` | [`JSFGridSize`](#type-aliasesjsfgridsizemd)[] | Widths and styles of the columns in the worksheet. |
| <a id="defaults"></a> `defaults` | [`JSFSheetDefaults`](#type-aliasesjsfsheetdefaultsmd) | A collection of default properties that apply to cells, rows, or columns in the worksheet. |
| <a id="hidden"></a> `hidden` | `0` \| `1` \| `2` | Whether or not the sheet should be shown to a user in a UI displaying the workbook. - 0 = sheet is visible - 1 = sheet is hidden - 2 = sheet is "extra hidden" |
| <a id="merges"></a> `merges` | `string`[] | A list of ranges that capture which cells have been merged. |
| <a id="name"></a> `name` | `string` | Name of the worksheet. |
| <a id="rows"></a> `rows` | [`JSFGridSize`](#type-aliasesjsfgridsizemd)[] | Heights and styles of the rows in the worksheet. |
| <a id="showgridlines"></a> `showGridLines?` | `boolean` | Indicates whether a hairline-grid should be drawn when displaying the sheet. |
