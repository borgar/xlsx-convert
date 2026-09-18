import type { CellRange, Paragraph, Percentage, Shape, Xfrm } from '@jsfkit/types';
type integer = number;

// These are mostly based on the OpenDocument format, which is really nice.
// https://docs.oasis-open.org/office/OpenDocument/v1.4/part3-schema/OpenDocument-v1.4-os-part3-schema.html
//
// The main differences are:
// - We use DML Shape for graphical properties
// - We use DML Text properties for text properties
// - We use DML Xfrm for positional properties
//

export type ChartProps = Partial<{
  /**
   * Specifies a counter-clockwise rotation of a polar coordinate in a circle, ring or polar chart.
   * The attribute value is an angle. The default value is 90deg.
   */
  angleOffset: number;
  /**
   * Specifies if an object should be positioned automatically.
   *
   * The default value is true if x and y attributes are not specified.
   * It is false if the x and y attributes are specified.
   */
  autoPosition: boolean;
  /**
   * Specifies if the size of an object should be chosen automatically.
   *
   * The default value is true if x and y attributes are not specified.
   * It is false if the x and y attributes are specified.
   */
  autoSize: boolean;
  /**
   * Specifies the position of the axis labels.
   *
   * The defined values for the chart:axis-label-position attribute are:
   *
   * - near-axis:
   *    labels are placed adjacent to the axis line.
   *    On which side of the line the labels are placed depends on the axisPosition attribute.
   *    If the axisPosition attribute has the value start or end, the labels are placed outside
   *    the coordinate system. Otherwise, the labels are placed adjacent to the axis on the side
   *    that belongs to the lower values on the crossing axis.
   * - near-axis-other-side:
   *    labels are placed adjacent to the axis on the opposite side as for near-axis.
   * - outside-end:
   *    labels are placed outside the coordinate region on that side where the crossing axis has
   *    its maximum value.
   * - outside-start: labels are placed outside the coordinate region on that side where the
   *    crossing axis has its minimum value.
   *
   * @default "near-axis"
   */
  axisLabelPosition: 'near-axis' | 'near-axis-other-side' | 'outside-start' | 'outside-end';
  /**
   * Specifies the position of the axis line on the scale of the crossing axis.
   */
  axisPosition: 'start' | 'end' | number;
  /**
   * Specifies if bars in a bar chart that belong to the same series are connected by lines.
   */
  connectBars: boolean;
  /**
   * Specifies whether the value or the percentage of a data point or both, should be displayed
   * within a data label. By default, neither the value nor a percentage is displayed.
   */
  dataLabelNumber: 'none' | 'percentage' | 'value' | 'value-and-percentage';
  /**
   * Determines whether or not to display the series name of the corresponding series in the data label.
   */
  dataLabelSeries: boolean;
  /**
   * Specifies whether to display a legend symbol within the data label of a data point.
   */
  dataLabelSymbol: boolean;
  /**
   * Specifies whether to display the category within the data label of a data point.
   */
  dataLabelText: boolean;
  /**
   * Specifies whether data series are displayed behind each other along the z-axis or not.
   * The deep attribute is ignored unless a threeDimensional attribute is present and has the value true.
   */
  deep: boolean;
  /**
   * Specifies whether labels are displayed on an axis or not.
   */
  displayLabel: boolean;
  /**
   * Used to determine which function is used to calculate error indicators at data points.
   * @default "none"
   */
  errorCategory:
    'none' |
    'variance' |
    'standard-deviation' |
    'percentage' |
    'error-margin' |
    'constant' |
    'standard-error' |
    'cell-range';
  /**
    * Specifies whether negative error indicators are displayed (the error value is subtracted
    * from the data point value).
    *
    * This attribute should be used together with the errorCategory attribute.
    */
  errorLowerIndicator: boolean;
  /**
   * Specifies the absolute value in the negative direction that is used to display error indicators
   * if a errorCategory attribute has the value constant.
   */
  errorLowerLimit: number;
  /**
   * Specifies the cell range used for negative error indicators when a errorCategory attribute has
   * a value of "cell-range".
   *
   * VALUE: A cell range address list is a list of cell range addresses and cell addresses.
   * Each item in the list is separated by white space. If any table name used in the list contains
   * a “ “ (U+0020, SPACE) character, the table name is quoted within apostrophes “'” ( U+0027, APOSTROPHE).
   */
  errorLowerRange: CellRange[];
  /**
   * Specifies the percentage of the largest value in a series used in the display of error indicators
   * for each data point of a series.
   *
   * This attribute should be used together with the errorCategory attribute if it has
   * the value "error-margin".
   */
  errorMargin: number;
  /**
   * Specifies the percentage that is used in the display of error indicators for each data point of a series.
   *
   * This attribute should be used together with a errorCategory attribute if the errorCategory attribute
   * has the value percentage.
   */
  errorPercentage: number;
  /**
   * Specifies whether positive error indicators should be displayed (the error value is added to
   * the data point value).
   */
  errorUpperIndicator: boolean;
  /**
   * Specifies the absolute value in the positive direction that is used to display error indicator
   * if the errorCategory 20.14 attribute has the value "constant".
   */
  errorUpperLimit: number;
  /**
   * Specifies the cell range used for positive error indicators when the errorCategory attribute has
   * a value of "cell-range".
   */
  errorUpperRange: number;
  /**
   * Specifies a gap between neighboring groups of bars in a bar chart (that is the distance between
   * the last bar in one category and the first bar in the following category).
   * It is specified as an integer percentage relative to the width of a single bar.
   *
   * This attribute is evaluated for chart styles that are applied to a <axis> element with Dimension
   * attribute set to y.
   *
   * Note: Bars attached to different axis can be arranged differently as long as they are grouped
   * per axis (groupBarsPerAxis attribute has the value true).
   */
  gapWidth: integer;
  /**
   * Specifies whether bars in a bar chart are displayed side by side or behind each other when they
   * are attached to different y-axes.
   *
   * - false: all bars on the same x-axis are handled as one group and are displayed side by side.
   * - true: only bars attached to the same x- and y-axis are handled as one group.
   */
  groupBarsPerAxis: boolean;
  /**
   * Specifies the diameter of the inner hole of a ring chart as a percentage of the outer diameter
   * of the outermost ring.
   */
  holeSize: Percentage;
  /**
   * Specifies whether data points in hidden cells are plotted in a chart.
   *
   * @default true
   */
  includeHiddenCells: boolean;
  /**
   * Specifies interpolations for line and scatter charts.
   *
   * See: https://docs.oasis-open.org/office/OpenDocument/v1.4/part3-schema/OpenDocument-v1.4-os-part3-schema.html#property-chart_interpolation
   */
  interpolation: 'none' | 'cubic-spline' | 'b-spline' | 'step-start' | 'step-end' | 'step-center-x' | 'step-center-y';
  /**
   * Specifies major intervals on an axis
   */
  intervalMajor: number;
  /**
   * Specifies a divisor for the intervalMajor value, the division of which determines the minor interval.
   *
   * @min 0
   */
  intervalMinorDivisor: integer;
  /**
   * specifies the display of opening and closing values in a stock chart
   */
  japaneseCandleStick: boolean;
  /**
   * specifies the arrangement of labels on an axis.
   *
   * - side-by-side: Labels are not staggered, they are aligned on one line.
   * - stagger-even: Even labels are aligned on the same line as used for side by side arrangement.
   *                 Counting starts with one, so the first label is odd.
   * - stagger-odd: All odd labels are aligned on the line used for side by side arrangement.
   *                Counting starts with one, so the first label is odd.
   */
  labelArrangement: 'side-by-side' | 'stagger-even' | 'stagger-odd';
  /**
   * specifies where data labels are placed
   */
  labelPosition:
    'avoid-overlap' |
    'center' |
    'top' |
    'top-right' |
    'right' |
    'bottom-right' |
    'bottom' |
    'bottom-left' |
    'left' |
    'top-left' |
    'inside' |
    'outside' |
    'near-origin';
  /**
   * If the labelPositionNegative attribute is set in addition to a labelPosition attribute, it is
   * used for all labels that belong to data points with negative values. Otherwise, the position set
   * in a labelPosition attribute is used for positive and negative values. If a labelPositionNegative
   * attribute is used without a labelPosition attribute it is ignored.
   *
   * See: https://docs.oasis-open.org/office/OpenDocument/v1.4/part3-schema/OpenDocument-v1.4-os-part3-schema.html#property-chart_label-position-negative
   */
  labelPositionNegative:
    'avoid-overlap' |
    'center' |
    'top' |
    'top-right' |
    'right' |
    'bottom-right' |
    'bottom' |
    'bottom-left' |
    'left' |
    'top-left' |
    'inside' |
    'outside' |
    'near-origin';
  // specifies whether connecting lines between data points are shown -- @deprecated
  // lines: boolean;
  /**
   * Can only be used in chart documents that are part of a document that provides the data for the chart.
   */
  linkDataStyleToSource: boolean;
  /**
   * Specifies whether logarithmic scaling will be used on an axis.
   * By default, proportional scaling is used.
   */
  logarithmic: boolean;
  /**
   * specifies the location of one major tick
   */
  majorOrigin: number;
  /**
   * specifies the maximum value of an axis
   */
  maximum: number;
  /**
   * specifies whether to display a line that represents the statistical mean value of all data points of a series.
   */
  meanValue: boolean;
  /**
   * specifies the minimum value of an axis
   */
  minimum: boolean;
  /**
   * Specifies whether the minor ticks are spaced equally after the logarithmic transformation.
   * If this value is false they are spaced equally before the transformation.
   */
  minorLogarithmic: boolean;
  /**
   * defines the origin of the graphical representation of a data series attached to an axis
   *
   * Note: For example, the beginning of the bars in a bar chart or the base line in an area chart can
   * be set by the origin attribute in the style of the y-axis to which the data series is attached.
   *
   * If the first x-axis has a axisPosition attribute, that position is taken to indicate the origin
   * of the data points attached to the first y-axis. It overrides the origin attribute of the first y-axis.
   */
  origin: number;
  /**
   * Specifies how much bars within the same category in a bar chart overlap.
   * The attribute value is an integer that is interpreted as a percentage relative to the width of a single bar.
   * Negative values specify gaps between bars.
   */
  overlap: integer;
  /**
   * specifies a percentage accumulation of values per category
   */
  percentage: boolean;
  /**
   * Specifies the distance of a segment from the center of the circle in case of circle charts.
   * The offset is given as an integer which is interpreted as a percentage of the radius of the circle.
   *
   * In the case of ring charts the pieOffset attribute specifies an additional distance of a segment
   * from the center of the circle. The distance is given as a percentage of the thickness of the ring.
   *
   * @min 0
   */
  pieOffset: integer;
  /**
   * specifies whether a regression curve of type linear, exponential or polynomial intercepts the y-axis
   * at a certain value.
   */
  regressionForceIntercept: boolean;
  /**
   * Specifies where a regression curve intercepts the y-axis if attribute.
   * This attribute is only evaluated together with the regressionForceIntercept attribute.
   *
   * @default 0
   */
  regressionInterceptValue: integer;
  /**
   * specifies the maximum degree of a polynomial regression curve.
   * This attribute is only evaluated together with the attribute regressionType and if that has the value "polynomial".
   *
   * @min 2
   */
  regressionMaxDegree: boolean;
  /**
   * Specifies the type of a regression curve of type moving-average.
   * This attribute is only evaluated together with the attribute regressionType and if that has the value "prior".
   */
  regressionMovingType: 'prior' | 'central' | 'averaged-abscissa';
  /**
   * specifies the name of a regression curve
   *
   * @default ""
   */
  regressionName: string;
  /**
   * specifies the number of points to be used to calculate a point of the regression curve.
   * This attribute is only evaluated together with the attribute regressionType and if that has the
   * value "moving-average".
   *
   * @min 2
   */
  regressionPeriod: integer;
  /**
   * Specifies the regression function for a series. A regression function can be used to approximate
   * the data points in a series.
   */
  regressionType: 'none' | 'linear' | 'logarithmic' | 'moving-average' | 'exponential' | 'power' | 'polynomial';
  /**
   * Specifies whether the direction of an axis follows the Cartesian coordinate system or the reverse.
   * @default false
   */
  reverseDirection: boolean;
  /**
   * Specifies a modification of the projection of a 3D chart. In a Cartesian coordinate system, the projections
   * of x and y-axis are horizontal and vertical.
   */
  rightAngledAxes: boolean;
  /**
   * specifies that the text contained in an object should be scaled whenever the size of the chart changes.
   * This attribute can appear at all chart objects that contain text.
   */
  scaleText: boolean;
  // specifies whether a tabular data for a chart contains all the data series in columns or rows
  // @deprecated
  // seriesSource: XXX;
  /**
   * specifies the rendering of bars in three-dimensional bar charts
   */
  solidType: 'cuboid' | 'cylinder' | 'cone' | 'pyramid';
  /**
   * Specifies whether the data points of a data series should be displayed in ascending order of the x values,
   * or in the order they are contained in the underlying data.
   */
  sortByXValues: boolean;
  /**
   * specifies the degree of the polynomials used as part of the spline
   * This attribute should be used together with interpolation attribute when it has the value "b-spline".
   * @min 0
   */
  splineOrder: integer;
  /**
   * Specifies the number of straight line segments used between any two data points.
   * This attribute should be used together with interpolation attribute when it has a value other than "none".
   * @min 0
   */
  splineResolution: integer;
  /**
   * Specifies the accumulation of the series values per category.
   * Each value is in addition to the other values in the same category.
   */
  stacked: boolean;
  /**
   * Specifies the height of a symbol to be used for a data point in a chart.
   * This attribute should be used when symbolType attribute has a value other than "none".
   * @min 0
   */
  symbolHeight: number;
  /**
   * Specifies a symbol to be used for a data point in a chart.
   */
  symbolName:
    'square' |
    'diamond' |
    'arrow-down' |
    'arrow-up' |
    'arrow-right' |
    'arrow-left' |
    'bow-tie' |
    'hourglass' |
    'circle' |
    'star' |
    'x' |
    'plus' |
    'asterisk' |
    'horizontal-bar' |
    'vertical-bar';
  /**
   * Specifies if a symbol is used for a data point in a chart, and if so, which type of symbol is to be used.
   * @default "none"
   */
  symbolType:
    'automatic' |
    'named-symbol' |
    'none' |
    'image';
  /**
   * Specifies the width of a symbol to be used for a data point in a chart.
   * @min 0
   */
  symbolWidth: number;
  /**
   * Specifies whether axis labels may overlap each other.
   */
  textOverlap: boolean;
  /**
   * Specifies whether a chart is displayed as a 3D scene.
   */
  threeDimensional: boolean;
  /**
   * specifies the existence of major inner tick marks on an axis.
   */
  tickMarksMajorInner: boolean;
  /**
   * specifies the existence of major outer tick marks on an axis.
   */
  tickMarksMajorOuter: boolean;
  /**
   * specifies the existence of minor inner tick marks on an axis
   */
  tickMarksMinorInner: boolean;
  /**
   * specifies the existence of minor outer tick marks on an axis
   */
  tickMarksMinorOuter: boolean;
  /**
   * specifies the position of the interval marks
   */
  tickMarkPosition: 'at-labels' | 'at-axis' | 'at-labels-and-axis';
  /**
   * specifies how missing and invalid values are plotted in a chart
   */
  treatEmptyCells: 'ignore' | 'leave-gap' | 'use-zero';
  /**
   * Specifies whether the x-axis in a Cartesian coordinate system is oriented horizontally or vertically.
   *
   * Note: This attribute is used to distinguish bar (vertical=”true”) and column (vertical=”false”) charts.
   */
  vertical: boolean;
  /**
   * Specifies if an object in a chart is visible or not. By default, objects are visible.
   * @default true
   */
  visible: boolean;
  /**
   * Specifies the direction of characters.
   */
  direction: 'ltr' | 'ttb';
  /**
   * specifies the rotation angle of content. The attribute value is an angle.
   */
  rotationAngle: number;
  /**
   * specifies whether word wrapping is allowed for axis labels
   */
  lineBreak: boolean;
  /**
   * specifies text that is used for separating different parts of a textual data label.
   * These parts can be the value as number, the value as a percentage, and the label text.
   * @default " "
   */
  labelSeparator: string;
  /**
   * specifies an image to be used for a data point in a chart
   */
  symbolImage: string; // xlink:href
}>;

export type TextProps = Partial<{
  fontSize: number;
  fontFamily: string;
  color: string;
}>;

// Pick<> from TextBody?
export type TextContent = {
  /** Array of paragraphs containing the text content. */
  p: Paragraph[];
};

export type ChartShape = {
  chPr?: ChartProps;
  txPr?: TextProps;
  shPr?: Shape;
};

export type Chart = ChartShape & {
  class: 'bar' | 'line'; // ...
  xfrm: Xfrm;
  title: ChartTitle;
  /**
   * The <chart:legend> element represents a legend for a chart.
   * If there is no <chart:legend> element for a chart, no legend is displayed.
   *
   * The labels used by a legend are defined by the <chart:categories> 11.10 element on the x-axis.
   * They are paired with matching data points in the order in which they appear.
   *
   * The <chart:legend> element may contain a <text:p> element. If present, it defines a title for
   * the legend.
   */
  legend?: ChartLegend;
  plotArea: PlotArea;
};

export type ChartTitle = ChartShape & {
  xfrm: Xfrm;
  text: TextContent;
};

export type ChartLegend = ChartShape & {
  xfrm: Xfrm;
  /**
   * Specifies the alignment of a legend with the plot area
   */
  align: 'center' | 'end' | 'start';
  /**
   * Specifies the placement of a legend.
   *
   * The defined values for the chart:legend-position attribute, to specify the location of a legend
   * in one of the corners of a chart outside the plot area, are:
   *
   * - bottom-end: place legend in the bottom right corner.
   * - bottom-start: place the legend in the bottom left corner.
   * - top-end: place legend in the top right corner.
   * - top-start: place legend in the top left corner.
   *
   * The defined values for the chart:legend-position attribute, to specify the location of a legend
   * next to the plot area, are:
   *
   * - bottom: place legend below the plot area.
   * - end: place legend on the right side of the plot area.
   * - start: place legend on the left side of the plot area.
   * - top: place legend above the plot area.
   *
   * The legend position can also be given in absolute coordinates with svg:x and svg:y attributes,
   * as with any drawing object. If both absolute coordinates and the legend-position attribute are
   * given, the chart:legend-position attribute shall be used.
   */
  position:
    'bottom-end' |
    'bottom-start' |
    'top-end' |
    'top-start' |
    'bottom' |
    'end' |
    'start' |
    'top';
  /**
   * Specifies the direction in which a legend expands.
   *
   * Pair custom with expansionAspectRatio.
   */
  expansion?: 'balanced' | 'custom' | 'high' | 'wide';
  /**
   * Specifies the ratio between width and height for a legendExpansion attribute with value "custom".
   */
  expansionAspectRatio?: number;
  /**
   */
  text?: TextContent;
};

export type PlotArea = ChartShape & {
  xfrm: Xfrm;

  axes: ChartAxis[];
  coordinateRegion: CoordinateRegion;
  /**
   * Specifies the floor of a chart.
   * For three-dimensional charts, the <floor> element shall be present in addition to the <wall> element.
   */
  floor?: ChartShape & { width: number };
  /**
   * Specifies the wall of a chart.
   * For two-dimensional charts, the wall spans the entire plot area.
   * For three-dimensional charts, the wall consists of two perpendicular rectangles.
   */
  wall?: ChartShape & { width: number };
  /**
   * Represents a data series in a chart. If the chart requires more input data, it is the case
   * for scatter and bubble charts, Domain sub-elements shall be defined that contain the
   * cell range addresses of the corresponding data.
   */
  series: Series[];
  /**
   * Specifies a style for candlestick-bars in a stock chart that have a higher closing value than opening value.
   */
  stockGainMarker: ChartShape;
  /**
   * Specifies the style for candlestick-bars in a stock chart that have a lower closing value than opening value.
   */
  stockLossMarker: ChartShape;
  /**
   * Specifies a style for the range-lines 19.15.1 in a stock chart.
   * A range-line is a line connecting the minimum value with the maximum value.
   */
  stockRangeLine: ChartShape;

  // dr3d:ambient-color: unknown;
  // dr3d:distance: unknown;
  // dr3d:focal-length: unknown;
  // dr3d:lighting-mode: unknown;
  // dr3d:projection: unknown;
  // dr3d:shade-mode: unknown;
  // dr3d:shadow-slant: unknown;
  // dr3d:transform: unknown;
  // r3d:vpn: unknown;
  // dr3d:vrp: unknown;
  // dr3d:vup: unknown;
  // dr3d:light: unknown;
};

export type ChartAxis = ChartShape & {
  /**
   * Specifies a dimension in a coordinate system.
   *
   * For charts with less than three axes the chart:dimension attribute may appear with values for
   * the x-axis and y-axis only.
   */
  dimension: 'x' | 'y' | 'z';
  /**
   * Specifies a name for an axis
   */
  name: string;
  /**
   * Specifies a grid for an axis
   */
  grid?: ChartGrid;
  /**
   * labels that are displayed on a category-axis
   */
  categories?: Categories;

  // OOO extensions:
  axisType?: 'auto'; // OOO
  dateScale?: boolean; // OOO
};

/**
 * The <chart:categories> element represents labels that are displayed on a category-axis.
 *
 * This element may have a cellRangeAddress attribute that specifies a range from which category
 * labels are taken. If this attribute or the Categories element itself is omitted, the
 * dataSourceHasLabels attribute of the PlotArea element should be evaluated for labels to
 * display on a category-axis.
 */
export type Categories = {
  cellRangeAddress: CellRange;
};

/**
 * The <chart:coordinate-region> element specifies a positioning rectangle.
 *
 * For charts with a two-dimensional Cartesian coordinate system, the used intervals on the axes
 * span a rectangular coordinate-region. Axis labels, tick marks, axis titles and data labels are
 * not considered in determining the coordinate-region. The coordinate system is scaled so that
 * the coordinate-region matches width and height of the positioning rectangle. The entire chart
 * is located so that the coordinate-region matches the positioning rectangle.
 *
 * Charts of the predefined classes chart:radar, chart:filled-radar, chart:circle and chart:ring
 * do not have a Cartesian coordinate system. For such charts the smallest bounding circle is
 * considered ignoring all axis labels, tick marks, axis titles and data labels. The rectangular
 * bounding box of this circle is the coordinate-region. Where single data points have a
 * chart:pie-offset greater than zero that offset shall not contribute to an expansion of the
 * coordinate-region; thus a pulled out pie segment is allowed to protrude from the
 * coordinate-region. A chart:pie-offset at the series element in contrast shall contribute to
 * the coordinate region.
 *
 * Circle or ring or the polar coordinate system of radar-charts respectively is uniformly scaled
 * so that the coordinate-region has maximal size, but does not exceed the size of the positioning
 * rectangle. The entire chart is located so that the coordinate-region is centered in the
 * positioning rectangle. Producers should specify a square positioning rectangle for charts
 * of these classes.
 */
export type CoordinateRegion = { // XXX: how does this work in an Xfrm world?
  height: number;
  width: number;
  x: number;
  y: number;
};

export type ChartGrid = ChartShape & {
  class: 'major' | 'minor';
};

// 19.15 chart:class
export type ChartClass =
  'area' |
  'bar' |
  'bubble' |
  'circle' | // pie
  'filled-radar' |
  'gantt' |
  'line' |
  'radar' |
  'ring' | // doughnut
  'scatter' |
  'stock' |
  'surface';

export type Series = ChartShape & {
  class: ChartClass;
  /**
   * Specifies an axis to be used with a series.
   * The value shall be the name of an axis as defined with the `name`` attribute on a ChartAxis element.
   */
  attachedAxis?: string;
  /**
   * Specifies a cell range list that contains the name for a series.
   */
  labelCellAddress: CellRange;
  /**
   * Specifies a cell range that contains the values for a data series
   */
  valuesCellRangeAddress: CellRange;
  /**
   * Data point defaults.
   */
  dataLabel: ChartDataLabel;
  /**
   * Specifies a style for a single data point in a data series
   */
  dataPoints: ChartDataPoint[]; // how this works is basically an RLE of the points;
  /**
   * Specifies coordinate values required by particular chart types.
   *
   * For scatter charts, one <domain> element shall exist.
   * Its table:cell-range-address attribute references the x-coordinate values for the scatter chart.
   *
   * For bubble charts, two <domain> elements shall exist.
   * The values for the y-coordinates are given by the first <domain> element.
   * The values for the x-coordinates are given by the second <domain> element.
   *
   * For surface charts, up to two <domain> elements are allowed to exist.
   * The values for the y-coordinates are given by the first <domain> element.
   * The values for the x-coordinates are given by the second <domain> element.
   *
   * At least one <series> element of a given class shall have the necessary number
   * of <domain> sub-elements. All other <series> elements with the same class
   * may omit the <domain> sub-elements and use the previously-defined values for the same
   * class value.
   */
  domain: ChartDomain[];
  /**
   * Specifies a style for error indicators
   */
  errorIndicator: ChartErrorIndicator;
  /**
   * Specifies a style for a mean-value line.
   */
  meanValues: ChartShape;
  /**
   * Specifies the properties of regression curves
   */
  regressionCurve: RegressionCurve[]; // Unsure if only 1 or many may exist?
};

export type ChartDataPoint = ChartShape & {
  /**
   * How many consecutive data points have the same style
   */
  repeated: number;
};

/**
 * Represents the data label of a data point.
 *
 * This can also be a sub-element of a data series.
 * In that case, the data label serves as default for all the data points.
 */
export type ChartDataLabel = ChartShape & {
  xfrm: Xfrm; // x & y are used
  text: TextContent;
};

export type ChartDomain = ChartShape & {
  cellRangeAddress: CellRange;
};

export type ChartErrorIndicator = ChartShape & {
  dimension: Dimension;
};

/**
 * The chart:dimension attribute specifies a dimension in a coordinate system.
 *
 * For charts with less than three axes the chart:dimension attribute may appear
 * with values for the x-axis and y-axis only.
 *
 * The defined values for the chart:dimension attribute are:
 *
 * - x: dimension represented by the x-axis of a chart.
 * - y: dimension represented by the y-axis of a chart.
 * - z: dimension represented by the z-axis of a chart.
 */
export type Dimension = {
  x: number; // XXX: are these all required?
  y: number;
  z: number;
};

export type RegressionCurve = ChartShape & {
  equation: Equation;
};

export type Equation = ChartShape & {
  xfrm: Xfrm; // x & y are used
  /**
   * Specifies if an equation to be displayed should be calculated automatically or if
   * text given within a <p> element should be used instead.
   *
   * If no <p> element is provided, the automaticContent attribute is assumed to be true.
   */
  automaticContent?: boolean;
  text?: TextContent;
  /**
   * Specifies whether the equation itself should be displayed or not.
   * It is only evaluated if the value of the automaticContent attribute is true.
   */
  displayEquation?: boolean;
  /**
   * Specifies whether an R-square value should be displayed or not.
   * It is only evaluated if the value of the automaticContent attribute is true.
   */
  displayRSquare?: boolean;
};
