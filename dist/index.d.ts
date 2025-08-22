/**
 * Describes a spreadsheet workbook.
 */
type JSFWorkbook = {
    /**
     *  Name of the workbook.
     */
    filename: string;
    /**
     *   Which of the two date system the workbook uses.
     *   https://learn.microsoft.com/en-us/office/troubleshoot/excel/1900-and-1904-date-system
     */
    epoch: 1900 | 1904;
    /**
     *   An ordered list of the worksheets in the workbook.
     */
    sheets: JSFWorksheet[];
    /**
     *   A list of named definitions.
     */
    names: JSFNameDef[];
    /**
     *   A list of tables
     */
    tables: JSFTable[];
    calculation_properties?: JSFCalcProps;
    styles: JSFStyle[];
    charts?: JSFChart[];
    externals?: JSFExternal[];
};
type JSFWorksheet = {
    name: string;
    cells: Record<Uppercase<string>, JSFCell>;
    columns: JSFGridSize[];
    rows: JSFGridSize[];
    merged_cells: string[];
    defaults: JSFSheetDefaults;
    hidden: boolean;
    show_grid_lines?: boolean;
    drawings?: JSFDrawing;
};
type JSFCell = {
    v?: string | null | number | boolean;
    si?: number;
    f?: string;
    href?: string;
    F?: string;
    t?: "e";
    c?: JSFComment[];
};
type JSFComment = {
    a: string;
    d: string;
    t: string;
};
type JSFSheetDefaults = {
    col_width: number;
    row_height: number;
};
type JSFGridSize = {
    begin: number;
    end: number;
    size: number;
    si?: number;
};
type JSFTable = {
    name: string;
    sheet: string;
    ref: string;
    columns: JSFTableColumn[];
    totals_row_count: number;
    header_row_count: number;
};
type JSFNameDef = {
    name: string;
    value: string;
    scope?: string;
};
type JSFTableColumn = {
    name: string;
    data_type?: "text" | "number" | "boolean" | "datetime" | "unknown";
    formula?: string;
};
type JSFCalcProps = {
    iterate: boolean;
    iterate_count: number;
    iterate_delta: number;
};
type JSFStyle = {
    "font-name"?: string;
    "font-size"?: number;
    "font-color"?: JSFColor;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    "fill-color"?: JSFColor;
    "border-top-style"?: JSFBorderStyle;
    "border-top-color"?: JSFColor;
    "border-left-style"?: JSFBorderStyle;
    "border-left-color"?: JSFColor;
    "border-bottom-style"?: JSFBorderStyle;
    "border-bottom-color"?: JSFColor;
    "border-right-style"?: JSFBorderStyle;
    "border-right-color"?: JSFColor;
    "horizontal-alignment"?: JSFhAlign;
    "vertical-alignment"?: JSFvAlign;
    "wrap-text"?: boolean;
    "shrink-to-fit"?: boolean;
    "number-format"?: string;
};
type JSFDrawing = {
    anchor: JSFAnchorAbs | JSFAnchorCell | JSFAnchorTwoCell;
    chart_id: string;
};
type JSFAnchorAbs = {
    type: "absolute";
    position: JSFPoint;
    extent: JSFPoint;
};
type JSFAnchorCell = {
    type: "cell";
    top_left: JSFCellOffset;
    extent: JSFPoint;
};
type JSFAnchorTwoCell = {
    type: "two_cell";
    top_left: JSFCellOffset;
    bottom_right: JSFCellOffset;
};
type JSFCellOffset = {
    row: number;
    row_offset: number;
    column: number;
    column_offset: number;
};
type JSFPoint = {
    x: number;
    y: number;
};
type JSFChart = {
    id: string;
    type: JSFChartType | "combo";
    series: JSFChartSeries[];
    axes?: JSFChartAxis[];
    title?: JSFFormula | string;
    auto_title_deleted?: boolean;
    labels?: JSFFormula;
    legend?: JSFLegend;
    data_labels?: JSFDataLabels;
    grouping?: "standard" | "stacked" | "clustered" | "percentStacked";
    vary_colors?: boolean;
};
type JSFChartAxis = {
    type: "category" | "value" | "date" | "series";
    position: "left" | "right" | "top" | "bottom";
    title?: JSFFormula | string;
    number_format?: string;
    orientation?: "minMax" | "maxMin";
    min?: number;
    max?: number;
    log_base?: number;
};
type JSFChartSeries = {
    name: JSFFormula | string;
    values: JSFFormula[];
    chart_type?: JSFChartType;
};
type JSFDataLabels = {
    values: boolean;
};
type JSFLegend = {
    position: "top" | "bottom" | "left" | "right" | "top-right";
};
type JSFChartType = "area" | "area3D" | "bar" | "bar3D" | "bubble" | "column" | "column3D" | "doughnut" | "line" | "line3D" | "ofPie" | "pie" | "pie3D" | "radar" | "scatter" | "stock" | "surface" | "surface3D";
type JSFFormula = `=${string}`;
type JSFColor = `#${string}`;
type JSFBorderStyle = "none" | "dashDot" | "dashDotDot" | "dashed" | "dotted" | "double" | "hair" | "medium" | "mediumDashDot" | "mediumDashDotDot" | "mediumDashed" | "slantDashDot" | "thick" | "thin";
type JSFhAlign = "general" | "left" | "center" | "right" | "fill" | "justify" | "centerContinuous" | "distributed";
type JSFvAlign = "bottom" | "top" | "center" | "justify" | "distributed";
type JSFExternal = {
    filename: string;
    sheets: JSFExtSheet[];
    names: JSFNameDef[];
};
type JSFExtSheet = {
    name: string;
    cells: Record<Uppercase<string>, JSFCell>;
};

/** Convertion options */
type ConversionOptions = {
    skip_merged?: boolean;
    cell_styles?: boolean;
    cell_z?: boolean;
};
/**
 * Convert an XLSX file into a JSON format.
 *
 * @param filename Target file to convert
 * @param options Conversion options
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

export { convertBinary, convert as default };
