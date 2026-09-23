
<a name="readmemd"></a>

# @borgar/xlsx-convert

## Classes

- [EncryptionError](#classesencryptionerrormd)
- [InvalidFileError](#classesinvalidfileerrormd)
- [MissingSheetError](#classesmissingsheeterrormd)
- [UnsupportedError](#classesunsupportederrormd)

## Type Aliases

- [ConversionOptions](#type-aliasesconversionoptionsmd)
- [CSVConversionOptions](#type-aliasescsvconversionoptionsmd)
- [MdwResolver](#type-aliasesmdwresolvermd)
- [Workbook](#type-aliasesworkbookmd)

## Functions

- [convert](#functionsconvertmd)
- [convertBinary](#functionsconvertbinarymd)
- [convertCSV](#functionsconvertcsvmd)


<a name="classesencryptionerrormd"></a>

# EncryptionError

Reading encrypted files is not supported. This error is thrown
when the converter encounters one.

## Extends

- `Error`

## Constructors

### Constructor

```ts
new EncryptionError(message?: string): EncryptionError;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `message?` | `string` |

#### Returns

`EncryptionError`

#### Inherited from

```ts
Error.constructor
```

### Constructor

```ts
new EncryptionError(message?: string, options?: ErrorOptions): EncryptionError;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `message?` | `string` |
| `options?` | `ErrorOptions` |

#### Returns

`EncryptionError`

#### Inherited from

```ts
Error.constructor
```


<a name="classesinvalidfileerrormd"></a>

# InvalidFileError

Thrown when the file is not a valid XLSX file. Usually because
the zip file container has become corrupted.

## Extends

- `Error`

## Constructors

### Constructor

```ts
new InvalidFileError(message?: string): InvalidFileError;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `message?` | `string` |

#### Returns

`InvalidFileError`

#### Inherited from

```ts
Error.constructor
```

### Constructor

```ts
new InvalidFileError(message?: string, options?: ErrorOptions): InvalidFileError;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `message?` | `string` |
| `options?` | `ErrorOptions` |

#### Returns

`InvalidFileError`

#### Inherited from

```ts
Error.constructor
```


<a name="classesmissingsheeterrormd"></a>

# MissingSheetError

This error is throw when the XLSX file references a sheet that
is not found in the container.

## Extends

- `Error`

## Constructors

### Constructor

```ts
new MissingSheetError(message?: string): MissingSheetError;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `message?` | `string` |

#### Returns

`MissingSheetError`

#### Inherited from

```ts
Error.constructor
```

### Constructor

```ts
new MissingSheetError(message?: string, options?: ErrorOptions): MissingSheetError;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `message?` | `string` |
| `options?` | `ErrorOptions` |

#### Returns

`MissingSheetError`

#### Inherited from

```ts
Error.constructor
```


<a name="classesunsupportederrormd"></a>

# UnsupportedError

Thrown if the converter encounters a cell data type it does not
support.

## Extends

- `Error`

## Constructors

### Constructor

```ts
new UnsupportedError(message?: string): UnsupportedError;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `message?` | `string` |

#### Returns

`UnsupportedError`

#### Inherited from

```ts
Error.constructor
```

### Constructor

```ts
new UnsupportedError(message?: string, options?: ErrorOptions): UnsupportedError;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `message?` | `string` |
| `options?` | `ErrorOptions` |

#### Returns

`UnsupportedError`

#### Inherited from

```ts
Error.constructor
```


<a name="functionsconvertmd"></a>

# convert()

```ts
function convert(filename: string, options?: ConversionOptions): Promise<Workbook>;
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

`Promise`\<[`Workbook`](#type-aliasesworkbookmd)\>

A JSON spreadsheet object.


<a name="functionsconvertbinarymd"></a>

# convertBinary()

```ts
function convertBinary(
   buffer: ArrayBuffer | Buffer<ArrayBufferLike>, 
   filename: string, 
options?: ConversionOptions): Promise<Workbook>;
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

`Promise`\<[`Workbook`](#type-aliasesworkbookmd)\>

A JSON spreadsheet formatted object.


<a name="functionsconvertcsvmd"></a>

# convertCSV()

```ts
function convertCSV(
   csvStream: string, 
   name: string, 
   options?: CSVConversionOptions): Workbook;
```

Convert a CSV/TSV into JSF format.

The returned JSF structure contains all the data table found in the file presented as
a spreadsheet table.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `csvStream` | `string` | A string of CSV data |
| `name` | `string` | Name of the file being converted, to be used as the workbook name |
| `options?` | [`CSVConversionOptions`](#type-aliasescsvconversionoptionsmd) | Conversion options |

## Returns

[`Workbook`](https://jsfkit.github.io/types/Workbook)

A JSON spreadsheet formatted object.


<a name="type-aliasescsvconversionoptionsmd"></a>

# CSVConversionOptions

```ts
type CSVConversionOptions = {
  delimiter?: null | "," | ";" | "\t";
  escapeChar?: null | "\" | "\"";
  locale?: string;
  sheetName?: string;
  skipEmptyLines?: boolean;
  table?: boolean;
};
```

CSV convertion options.

## Properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="delimiter"></a> `delimiter?` | `null` \| `","` \| `";"` \| "\t" | `null` | The delimiter to use to parse the CSV. Normally this is auto-detected. |
| <a id="escapechar"></a> `escapeChar?` | `null` \| "\\" \| "\"" | `'"'` | The character used to escape quotation marks in strings. |
| <a id="locale"></a> `locale?` | `string` | `'en-US'` | The locale (as a BCP 47 string) to use when parsing dates and numbers. **See** |
| <a id="sheetname"></a> `sheetName?` | `string` | `'Sheet1'` | The name of the sheet to create in the resulting workbook. |
| <a id="skipemptylines"></a> `skipEmptyLines?` | `boolean` | `true` | Skip empty lines instead of creating empty rows. |
| <a id="table"></a> `table?` | `boolean` | `false` | Create a table descriptor object for the data in the sheet. |


<a name="type-aliasesconversionoptionsmd"></a>

# ConversionOptions

```ts
type ConversionOptions = {
  cellFormulas?: boolean;
  imageCallback?: (data?: ArrayBuffer, filename?: string) => Promise<string | void> | string | void;
  reportUnsupported?: boolean;
  resolveMdw?: MdwResolver;
  skipMerged?: boolean;
  skipStyledEmptyCells?: boolean;
  warn?: (message: string) => void;
};
```

Convertion options

## Properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="cellformulas"></a> `cellFormulas?` | `boolean` | `false` | Formulas are attached to cells rather than being included as a separate list. |
| <a id="imagecallback"></a> `imageCallback?` | (`data?`: `ArrayBuffer`, `filename?`: `string`) => `Promise`\<`string` \| `void`\> \| `string` \| `void` | `undefined` | Image reading callback. All read images are passed through this callback if it is provided. This is useful, for example, for extracting the images to disk. If the return value is a string, the value will be used in the images record on the workbook instead of the standard data-URI conversion. |
| <a id="reportunsupported"></a> `reportUnsupported?` | `boolean` | `true` | Include a list of features found on the workbook that the application did not convert to JSF |
| <a id="resolvemdw"></a> `resolveMdw?` | [`MdwResolver`](#type-aliasesmdwresolvermd) | `undefined` | Resolve the Max Digit Width (in pixels) for the workbook's Normal font, used to convert column widths from OOXML character units to pixels. Returning null/undefined defers to the built-in table (Aptos Narrow, Calibri, Arial); unknown fonts then fall back to MDW 6 (and warn). Supply this to size columns correctly for fonts outside the table. |
| <a id="skipmerged"></a> `skipMerged?` | `boolean` | `true` | Skip cells that are a part of merges. |
| <a id="skipstyledemptycells"></a> `skipStyledEmptyCells?` | `boolean` | `false` | Drop cells that have a style but no value or formula, unless the style is visible (fill, border, etc.). |
| <a id="warn"></a> `warn?` | (`message`: `string`) => `void` | `undefined` | Warning callback. If provided, warnings are passed to this function; otherwise they are silently discarded. |


<a name="type-aliasesmdwresolvermd"></a>

# MdwResolver

```ts
type MdwResolver = (fontFamily: string, fontSizePt: number) => number | null | undefined;
```

Resolve an MDW for an arbitrary font. Returning null/undefined defers to the built-in table.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `fontFamily` | `string` |
| `fontSizePt` | `number` |

## Returns

`number` \| `null` \| `undefined`


<a name="type-aliasesworkbookmd"></a>

# Workbook

```ts
type Workbook = JSFWorkbook & {
  unsupported?: string[];
};
```

This is the same structure as a [JSF Workbook](https://jsfkit.github.io/types/Workbook/) but
with a property added: `unsupported`. It is a list of tags for feature that the converter encountered
during the reading process but did not handle.

The tags emitted are as follows:

| Tag | Feature
|--- |---
| `asset-3d` | 3D image
| `asset-ext` | Extension object (likely Office Script)
| `asset-oo` | Office Object
| `asset-pq` | Power Query
| `asset-py` | Python
| `asset-svg` | SVG image
| `asset-vba` | VBA project
| `asset-vml` | VML drawing
| `border-diagonal` | Diagonal border
| `calc-precision` | "Set precision as displayed" setting
| `cell-checkbox` | Cell checkbox
| `cell-hide` | Hidden cell (formula)
| `cell-indent` | Cell indentation
| `cell-lock` | Protected cells
| `cell-rtf` | Rich text in cells
| `chart` | Basic charts
| `chart-chartex` | Extended charts
| `chart-pivot` | Pivot charts
| `col-group` | Grouped columns
| `data-validation` | Data validation
| `dynamic-style` | Conditional formatting of cells
| `note-rtf` | Rich text in notes
| `print-gridlines` | Print sheet gridlines
| `print-headings` | Print sheet headings
| `print-setup` | Print page setup
| `row-group` | Grouped rows
| `scenario` | Scenarios
| `shape-diagram` | Diagram / SmartArt
| `shape-effect` | Shadow, Reflection, 3D effects, ...
| `shape-math` | Equations
| `shape-texteffect` | Shadow, Reflection, 3D effects, ...
| `sheet-autofilter` | Sheet autofilter
| `sheet-background` | Sheet background image
| `sheet-lock` | Protected sheets
| `sheet-rtl` | Right-to-left sheet view
| `sheet-tabcolor` | Sheet tab color
| `sparkline` | Sparklines
| `table-filter-button` | Hide/show table filter buttons
| `table-insertrow` | Table insert row
| `table-slicer` | Table slicer
| `table-sortstate` | Table sort-state
| `table-style-custom` | Custom table style
| `time-slicer` | Time slicer
| `view-custom` | Custom views
| `view-formulas` | Show formulas in a sheet
| `view-gridlines-color` | Changed gridlines color
| `view-headings` | Hide/show headings on sheet
| `view-outline-symbols` | Hide/Show grouped row/col UI
| `view-pane-split` | Split panes
| `view-tabselected` | Selected tabs
| `view-zeros` | Hide zero results
| `workbook-lock` | Protected workbook
| `workbook-meta` | Workbook properties
| `workbook-meta-custom` | Workbook custom properties

As the capabilities of xlsx-convert grow, this list is expected to get smaller and eventually disappear.

## Type Declaration

### unsupported?

```ts
optional unsupported?: string[];
```

A list of tags idenifying xlsx features that the converter encountered in a workbook
but did not handle.
