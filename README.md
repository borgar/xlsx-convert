# XLSX-convert

This is a utility to convert Excel XLSX files to JSON format. It supports only XLSX files and outputs JSF, [JSON spreadsheet format](https://github.com/jsfkit/types) ([see below](#output)).

The library will run in a browser as well as in server environments (Node, Deno, Bun, etc.).

This utility was developed as tooling for [GRID – The new face of spreadsheets](https://grid.is/), to which it owes a debt of gratitude.


## Installing

The library is also provided as an NPM package:

    $ npm install @borgar/xlsx-convert


## Usage


```js
// import the converter
import xlsxConvert from '@borgar/xlsx-convert';

// read the file
const jsf = await xlsxConvert('path/to/workbook.xlsx', options);

// emit results
console.log(jsf);
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
      "merges": [],
      "colWidths": [],
      "rowHeights": [],
      "hidden": 0,
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

The [JSON spreadsheet format](https://jsfkit.github.io/types/) is similar to, but not compatible with the [CSF structure](https://github.com/SheetJS/sheetjs#common-spreadsheet-format) used by the [`xlsx` package](https://github.com/SheetJS/sheetjs).

Supported cell properties are:

| Cell. | Note |
|- |-
| `v` | Value of the cell in its correct type.
| `f` | An integer index into a list of formula expressions in R1C1-syntax, or an expression string in A1-syntax.
| `F` | The A1-style range of enclosing array if the formula is an array formula.
| `c` | A list of comments attached to the cell.
| `s` (optional) | Index of style information associated with the cell.
| `t` (optional) | A type for the value in the cell (this library only emits an `"e"` when the value is an error).
| `l` (optional) | A URL attached to the cell.

Only cells that have "relevant data" are emitted, which in praxis means cells that have such things as values, formula, and visible styles attached to them.


## Documentation

Documentation can be found under [docs/](./docs/):

* The API is documented in [docs/API.md](./docs/API.md).
* The JSF output is documented at [jsfkit.github.io](https://jsfkit.github.io/types/).
