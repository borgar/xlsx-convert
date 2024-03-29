# XLSX-convert

This is a Node.js utility to convert Excel XLSX files to JSON format. It supports only XLSX files and outputs a flavor of CSF ([see below](#output)).

This utility was developed as tooling for [GRID – The new face of spreadsheets](https://grid.is/), to which it owes a debt of gratitude.


## Installing

The library is also provided as an NPM package:

    $ npm install @borgar/xlsx-convert


## Usage


```js
// import the converter
const xlsxConvert = require('@borgar/xlsx-convert');

// read the file
const wb = await xlsxConvert('path/to/workbook.xlsx', options);

// emit results
const output = JSON.stringify(wb, null, 2);
console.log(output)
```

This will emit a structure like this:

```js
{
  "filename": "workbook.xlsx",
  "sheets": [
    {
      "cells": {
        "A1": { "v": 12 },
        "B1": { "v": 123.1 },
        "A2": { "v": "Total" },
        "B2": { "v": 135.1, "f": "SUM(A1:B1)", },
      },
      "merged_cells": [],
      "col_widths": {},
      "row_heights": {},
      "hidden": false,
      "name": "Sheet1"
    }
  ],
  "names": [],
  "styles": [
    { "font-size": 12 }
  ]
}
```

### <a name="output" href="#output">#</a> Output:

The format is similar to, but not 100% compatible with the [CSF structure](https://github.com/SheetJS/sheetjs#common-spreadsheet-format) emitted by the [`xlsx` package](https://github.com/SheetJS/sheetjs). Supported cell properties are:

| Cell. | Note |
|- |-
| `v` | Value of the cell in its correct type.
| `f` | Formula in A1 syntax.
| `F` | The A1-style range of enclosing array if the formula is an array formula.
| `c` | Comments attached to the cell.
| `z` (optional) | Number formatting string attached to the cell.
| `s` (optional) | Style information associated with the cell.
| `si` (optional) | Index of style information associated with the cell.

Only cells that have "relevant data" are emitted, which in praxis means cells that have such things as values, formula, and visible styles attached to them.



## API

<a name="xlsx-convert" href="#xlsx-convert">#</a> async **xlsxConvert**( _target [, options]_ )

Reads an Excel XLSX file into a consumable structure. The return value contains most of the data from the original file, although some details may be lost in the conversion process (and further will not be emitted when converting this structure to JSON).

* `target` can be either a filename which will be loaded, or a Buffer object should you wish to perform the loading externally.

* `options` are set as an object of keys: `convert(filename, { option: true })`. Supported options are:

  | name | default | effect |
  |- | - | -
  | `skip_merged` | `true` | De-activating this will emit _all_ cells that have any "relevant" data, regardless of them being part of merges. By default only the top-left cell will be emitted. 
  | `cell_styles` | `false` | Normally, styles are emitted as an indexed list per-workbook. This will instead inline styles per cell.
  | `cell_z` | `true` | Number formatting is emitted as a part of the cell (as cell.z) instead of as a part of styles as `number-format`

