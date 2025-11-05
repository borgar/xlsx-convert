export type GraphicAnchorAbsolute = {
  type: 'absolute',
  position: Position, // pos { x, y }
  // This element describes the length and width properties for how far a drawing element should extend for.
  extent: Extent, // ext { cx, cy }
};

/**
 * This element specifies a one cell anchor placeholder for a group,
 * a shape, or a drawing element.
 */
export type GraphicAnchorOneCell = {
  type: 'oneCell',
  from: CellOffset,
  // This element describes the length and width properties for how far a drawing element should extend for.
  extent: Position, // { cx, cy }
};

export type GraphicAnchorTwoCell = {
  type: 'twoCell',
  from: CellOffset,
  to: CellOffset,
};

export type GraphicAnchor = GraphicAnchorAbsolute | GraphicAnchorOneCell | GraphicAnchorTwoCell;

export type Position = { x: number, y: number };
export type Extent = { x: number, y: number };

/**
 * This element specifies the first anchor point for the drawing element.
 * This will be used to anchor the top and left sides of the shape within the spreadsheet.
 * That is when the cell that is specified in the from element is adjusted, the shape will also be adjusted.
 */
export type CellOffset = {
  row: number,
  rowOffset: number,
  column: number,
  columnOffset: number,
};

export type Transform2D = {
  flipH?: boolean, // flipY?
  flipV?: boolean, // flipX?
  rotate?: number,
  offset?: Position, // translate?
  extent?: Extent, // scale?
};

export type Drawing = {
  anchor: GraphicAnchor,
  content: GraphicObject[],
};

export type GraphicObject = ChartRef | BitmapRef | GroupRef;

export type GroupRef = {
  type: 'group',
  id: string,
  name: string,
  content: GraphicObject[],
  transform?: Transform2D,
};

export type ChartRef = {
  type: 'chart',
  id: string,
  name: string,
  chartId: string,
  locked?: boolean,
  transform?: Transform2D,
};

export type BitmapRef = {
  type: 'bitmap',
  id: string,
  name: string,
  desc?: string,
  mediaId: string,
  noChangeAspect?: boolean,
  transform?: Transform2D,
};
