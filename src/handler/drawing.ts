import type { Document, Element } from '@borgar/simple-xml';
import { attr, boolAttr, numAttr } from '../utils/attr.ts';
import { ConversionContext } from '../ConversionContext.ts';

/**
 * There are 914400 EMUs per inch.
 * EMUs can be converted to pixels by calculating EMUs * DPI / 914400.
 */
function emu2px (emu: number, precision = 1e3) {
  return Math.round(emu * 96 / 914400 * precision) / precision;
}

type GraphicAnchorAbsolute = {
  type: 'absolute',
  position: Position, // pos { x, y }
  // This element describes the length and width properties for how far a drawing element should extend for.
  extent: Extent, // ext { cx, cy }
};

/**
 * This element specifies a one cell anchor placeholder for a group,
 * a shape, or a drawing element.
 */
type GraphicAnchorOneCell = {
  type: 'oneCell',
  from: CellOffset,
  // This element describes the length and width properties for how far a drawing element should extend for.
  extent: Position, // { cx, cy }
};

type GraphicAnchorTwoCell = {
  type: 'twoCell',
  from: CellOffset,
  to: CellOffset,
};

type GraphicAnchor = GraphicAnchorAbsolute | GraphicAnchorOneCell | GraphicAnchorTwoCell;

type Position = { x: number, y: number };
type Extent = { x: number, y: number };

/**
 * This element specifies the first anchor point for the drawing element.
 * This will be used to anchor the top and left sides of the shape within the spreadsheet.
 * That is when the cell that is specified in the from element is adjusted, the shape will also be adjusted.
 */
type CellOffset = {
  row: number,
  rowOffset: number,
  column: number,
  columnOffset: number,
};

type Transform2D = {
  flipH?: boolean, // flipY?
  flipV?: boolean, // flipX?
  rotate?: number,
  offset?: Position, // translate?
  extent?: Extent, // scale?
};

type Drawing = {
  anchor: GraphicAnchor,
  content: GraphicObject[],
};

type GraphicObject = ChartRef | BitmapRef | GroupRef;

type GroupRef = {
  type: 'group',
  id: string,
  name: string,
  content: GraphicObject[],
  transform?: Transform2D,
};

type ChartRef = {
  type: 'chart',
  id: string,
  name: string,
  chartId: string,
  locked?: boolean,
  transform?: Transform2D,
};

type BitmapRef = {
  type: 'bitmap',
  id: string,
  name: string,
  desc?: string,
  bitmapId: string,
  noChangeAspect?: boolean,
  transform?: Transform2D,
};

// ---

function readCellPos (elm: Element | null): CellOffset {
  return {
    row: +(elm?.querySelector('row')?.textContent ?? 0),
    rowOffset: emu2px(+(elm?.querySelector('rowOff')?.textContent ?? 0)),
    column: +(elm?.querySelector('col')?.textContent ?? 0),
    columnOffset: emu2px(+(elm?.querySelector('colOff')?.textContent ?? 0)),
  };
}

function readExtent (elm: Element | null, nullIfZero = false): Extent | undefined {
  if (elm) {
    const r = {
      x: emu2px(numAttr(elm, 'cx', 0)),
      y: emu2px(numAttr(elm, 'cy', 0)),
    };
    if (nullIfZero && !r.x && !r.y) {
      return undefined;
    }
    return r;
  }
  return undefined;
}

function readPosition (elm: Element | null, nullIfZero = false): Position | undefined {
  if (elm) {
    const r = {
      x: emu2px(+(elm.getAttribute('x') ?? 0)),
      y: emu2px(+(elm.getAttribute('y') ?? 0)),
    };
    if (nullIfZero && !r.x && !r.y) {
      return undefined;
    }
    return r;
  }
  return undefined;
}

function readTransforms (elm: Element | null): Transform2D | undefined {
  if (elm) {
    const out: Transform2D = {};
    if (boolAttr(elm, 'flipH')) {
      out.flipH = true;
    }
    if (boolAttr(elm, 'flipV')) {
      out.flipV = true;
    }
    const rot = numAttr(elm, 'rot', 0);
    if (rot) {
      out.rotate = rot;
    }
    const off = readPosition(elm.querySelector('off'), true);
    if (off) {
      out.offset = off;
    }
    const extent = readPosition(elm.querySelector('ext'), true);
    if (extent) {
      out.offset = extent;
    }
    if (out.flipH || out.flipV || out.rotate || out.offset || out.extent) {
      return out;
    }
  }
}

function readAnchor (element: Element | null): GraphicAnchor | undefined {
  if (element?.tagName === 'absoluteAnchor') { // §5.6.2.1
    return {
      type: 'absolute',
      position: readPosition(element.querySelector('pos')),
      extent: readExtent(element.querySelector('ext')),
    };
  }
  else if (element?.tagName === 'oneCellAnchor') { // §5.6.2.23
    return {
      type: 'oneCell',
      from: readCellPos(element.querySelector('from')),
      extent: readExtent(element.querySelector('ext')),
    };
  }
  else if (element?.tagName === 'twoCellAnchor') { // §5.6.2.32
    return {
      type: 'twoCell',
      from: readCellPos(element.querySelector('from')),
      to: readCellPos(element.querySelector('to')),
    };
  }
}

function readGraphicContent (parent: Element): GraphicObject[] {
  const content = [];

  // Should support the following elements:
  // - cxnSp (Connection Shape) §5.8.2.9
  // - graphicFrame (Graphic Frame) §5.8.2.12
  // - grpSp (Group Shape) §5.8.2.13
  // - grpSpPr (Group Shape Properties) §5.8.2.14
  // - nvGrpSpPr (Non-Visual Group Shape Properties) §5.8.2.17
  // - pic (Picture) §5.8.2.20
  // - sp (Shape) §5.8.2.22

  parent.children.forEach((d: Element) => {
    // Group Shape
    if (d.tagName === 'grpSp') {
      const out: GroupRef = {
        type: 'group',
        id: '',
        name: '',
        // recurse for children, they should be read like other elements in the current list
        content: readGraphicContent(d),
      };
      // Non-Visual Properties
      const cNvPr = d.querySelector('cNvPr');
      if (cNvPr) {
        out.id = cNvPr.getAttribute('id'); // "16"
        out.name = cNvPr.getAttribute('name'); // "Group 15"
      }
      // 5.1.2.1.21 – Group Shape Locks
      // Groups can have a few lock properties which have been left for later:
      // <nvGrpSpPr> -- Non-Visual Group Shape Properties
      //   <cNvGrpSpPr>
      //     <grpSpLocks
      //       noChangeAspect=[bool]
      //       noGrp=[bool]
      //       noMove=[bool]
      //       noResize=[bool]
      //       noRot=[bool]
      //       noSelect=[bool]
      //       noUngrp=[bool]
      //       />

      // 5.8.2.14 – Group Shape Properties <grpSpPr bwMode=[ST_BlackWhiteMode]>
      //
      // This element specifies the properties that are to be common across all of the shapes
      // within the corresponding group. If there are any conflicting properties within the group
      // shape properties and the individual shape properties then the individual shape properties
      // should take precedence.
      //
      // Child elements:
      //   - blipFill (Picture Fill) §5.1.10.14
      //   - effectDag (Effect Container) §5.1.10.25
      //   - effectLst (Effect Container) §5.1.10.26
      //   - extLst (Extension List) §5.1.2.1.15
      //   - gradFill (Gradient Fill) §5.1.10.33
      //   - grpFill (Group Fill) §5.1.10.35
      //   - noFill (No Fill) §5.1.10.44
      //   - pattFill (Pattern Fill) §5.1.10.47
      //   - solidFill (Solid Fill) §5.1.10.54
      //   - scene3d (3D Scene Properties) §5.1.4.1.26
      //   - xfrm (2D Transform for Grouped Objects) §5.1.9.5
      const xfrm = readTransforms(d.querySelector('xfrm'));
      if (xfrm) { out.transform = xfrm; }

      // if group has no content, we don't need to add it
      if (out.content.length) {
        content.push(out);
      }
    }
    // Connection Shape
    else if (d.tagName === 'cxnSp') {
      // console.log(d.toString());
      // <cxnSp macro="">
      //   // Connector Non Visual Properties
      //   <nvCxnSpPr>
      //     <cNvPr id="12" name="Straight Arrow Connector 11">
      //       <extLst>
      //         <ext uri="{FF2B5EF4-FFF2-40B4-BE49-F238E27FC236}">
      //           <creationId xmlns:a16="http://schemas.microsoft.com/office/drawing/2014/main" id="{1E93247E-E71A-92F7-AF9F-14D84071B9F9}" />
      //         </ext>
      //       </extLst>
      //     </cNvPr>
      //     <cNvCxnSpPr />
      //   </nvCxnSpPr>
      //   // Shape Properties
      //   <spPr>
      //     <xfrm flipH="1" flipV="1">
      //       <off x="1007533" y="3496733" />
      //       <ext cx="2218267" cy="143934" />
      //     </xfrm>
      //     <prstGeom prst="straightConnector1">
      //       <avLst />
      //     </prstGeom>
      //     <ln w="19050" cap="flat" cmpd="sng" algn="ctr">
      //       <solidFill>
      //         <schemeClr val="dk1" />
      //       </solidFill>
      //       <prstDash val="solid" />
      //       <round />
      //       <headEnd type="none" w="med" len="med" />
      //       <tailEnd type="arrow" w="med" len="med" />
      //     </ln>
      //   </spPr>
      //   // style
      //   <style>
      //     <lnRef idx="0">
      //       <scrgbClr r="0" g="0" b="0" />
      //     </lnRef>
      //     <fillRef idx="0">
      //       <scrgbClr r="0" g="0" b="0" />
      //     </fillRef>
      //     <effectRef idx="0">
      //       <scrgbClr r="0" g="0" b="0" />
      //     </effectRef>
      //     <fontRef idx="minor">
      //       <schemeClr val="tx1" />
      //     </fontRef>
      //   </style>
      // </cxnSp>
    }
    // Shape
    else if (d.tagName === 'sp') {
      // nvSpPr (Non-Visual Shape Properties)
      // spPr (Shape Properties)
      // style (Shape Style)
      // txBody (Shape Text Body)

      // [ "xdr:sp", { "macro": "", "textlink": "" },
      //   [ "xdr:nvSpPr",
      //     [ "xdr:cNvPr", { "id": "15", "name": "TextBox 14" },
      //       [ "a:extLst",
      //         [ "a:ext", { "uri": "{FF2B-5EF4}" },
      //           [ "a16:creationId", { "xmlns:a16": "http://schemas...", "id": "{FA10-66F4}" } ] ] ] ],
      //     [ "xdr:cNvSpPr", { "txBox": "1" } ] ],
      //   [ "xdr:spPr",
      //     [ "a:xfrm", { "rot": "1283673" },
      //       [ "a:off", { "x": "2680759", "y": "3403666" } ],
      //       [ "a:ext", { "cx": "1640130", "cy": "296502" } ] ],
      //     [ "a:prstGeom", { "prst": "rect" },
      //       [ "a:avLst" ] ],
      //     [ "a:noFill" ] ],
      //   [ "xdr:style",
      //     [ "a:lnRef", { "idx": "0" },
      //       [ "a:scrgbClr", { "r": "0", "g": "0", "b": "0" } ] ],
      //     [ "a:fillRef", { "idx": "0" },
      //       [ "a:scrgbClr", { "r": "0", "g": "0", "b": "0" } ] ],
      //     [ "a:effectRef", { "idx": "0" },
      //       [ "a:scrgbClr", { "r": "0", "g": "0", "b": "0" } ] ],
      //     [ "a:fontRef", { "idx": "minor" },
      //       [ "a:schemeClr", { "val": "tx1" } ] ] ],
      //   [ "xdr:txBody",
      //     [ "a:bodyPr", { "vertOverflow": "clip", "horzOverflow": "clip", "wrap": "none", "rtlCol": "0", "anchor": "t" },
      //       [ "a:noAutofit" ] ],
      //     [ "a:lstStyle" ],
      //     [ "a:p",
      //       [ "a:pPr", { "algn": "ctr" } ],
      //       [ "a:r",
      //         [ "a:rPr", { "lang": "en-GB", "sz": "1600", "b": "0", "i": "1", "kern": "1200" } ],
      //         [ "a:t", "Image in a cell" ] ] ] ]
      // ]
    }
    else if (d.tagName === 'pic') {
      const out: BitmapRef = {
        type: 'bitmap',
        id: '',
        name: '',
        desc: '',
        bitmapId: '',
        noChangeAspect: false,
      };
      // Non-Visual Properties
      const cNvPr = d.querySelector('cNvPr');
      if (cNvPr) {
        out.id = cNvPr.getAttribute('id'); // "2"
        out.name = cNvPr.getAttribute('name'); // "Picture 2"
        out.desc = cNvPr.getAttribute('descr'); // "Spit Cat"
      }
      // Non-Visual Picture Drawing Properties
      //  todo: Support 5.8.2.6: cNvPicPr[preferRelativeResize]
      const picLocks = d.querySelector('cNvPicPr > picLocks');
      if (picLocks) {
        out.noChangeAspect = boolAttr(picLocks, 'noChangeAspect', false);
      }
      const blipFill = d.querySelector('blipFill');
      if (blipFill) {
        // blipFill.getAttribute('dpi'); // Specifies the DPI (dots per inch) used to calculate the size of the blip.
        // blipFill.getAttribute('rotWithShape'); // Specifies that the fill should rotate with the shape.
        const blip = d.querySelector('blip');
        out.bitmapId = blip.getAttribute('r:embed'); // "rId1"
        // <blip> may contain any of:
        // - alphaBiLevel (Alpha Bi-Level Effect) – §5.1.10.1
        // - alphaCeiling (Alpha Ceiling Effect) – §5.1.10.2
        // - alphaFloor (Alpha Floor Effect) – §5.1.10.3
        // - alphaInv (Alpha Inverse Effect) – §5.1.10.4
        // - alphaMod (Alpha Modulate Effect) – §5.1.10.5
        // - alphaModFix (Alpha Modulate Fixed Effect) – §5.1.10.6
        // - alphaRepl (Alpha Replace Effect) – §5.1.10.8
        // - biLevel (Bi-Level (Black/White) Effect) – §5.1.10.11
        // - blur (Blur Effect) – §5.1.10.15
        // - clrChange (Color Change Effect) – §5.1.10.16
        // - clrRepl (Solid Color Replacement) – §5.1.10.18
        // - duotone (Duotone Effect) – §5.1.10.23
        // - extLst (Extension List) – §5.1.2.1.15
        // - fillOverlay (Fill Overlay Effect) – §5.1.10.29
        // - grayscl (Gray Scale Effect) – §5.1.10.34
        // - hsl (Hue Saturation Luminance Effect) – §5.1.10.39
        // - lum (Luminance Effect) – §5.1.10.42
        // - tint (Tint Effect) – §5.1.10.60

        // <blipFill> may also contain:
        // - srcRect (Source Rectangle) – §5.1.10.55
        //   This element specifies the portion of the blip used for the fill.
        //   It has { t l b r } attributes as percentages

        // - stretch (Stretch) – §5.1.10.56
        //   This element specifies how the blip is stretched to fill the shape.
        //   It either includes a sub-element <fillRect> or image should be tiled.
        //     <fillRect> has { t l b r } attributes as percentages (25000=25%).
        //     Default (all unset) is { t:0, l:0, b:100000, r:100000 }.
      }

      if (!out.bitmapId) {
        return;
      }

      //   [ "xdr:blipFill",
      //     [ "a:blip", { "xmlns:r": "http://schemas...", "r:embed": "rId1" } ],
      //     [ "a:stretch", [ "a:fillRect" ] ] ],

      //   [ "xdr:spPr",
      //     [ "a:xfrm", { "rot": "435665" },
      //       [ "a:off", { "x": "1752600", "y": "1747322" } ],
      //       [ "a:ext", { "cx": "3987800", "cy": "3987800" } ]
      //     ],
      //     [ "a:prstGeom", { "prst": "rect" },
      //       [ "a:avLst" ] ] ] ]
      console.log(out);
    }
    else if (d.tagName === 'graphicFrame') {
      const out: ChartRef = { type: 'chart', id: '', name: '', chartId: '' };
      // Non-Visual Properties
      const cNvPr = d.querySelector('cNvPr');
      if (cNvPr) {
        out.id = cNvPr.getAttribute('id'); // "2"
        out.name = cNvPr.getAttribute('name'); // "Chart 1"
      }
      else {
        // un-require these?
        return;
      }
      const graphicFrameLocks = d.querySelector('graphicFrameLocks');
      if (graphicFrameLocks) { out.locked = true; }

      // Specifies a 2D transform to be applied to a Graphic Frame:
      const xfrm = readTransforms(d.querySelector('xfrm'));
      if (xfrm) { out.transform = xfrm; }

      // Chart data :)
      const chart = d.querySelector('graphicData > chart');
      if (chart) {
        out.chartId = chart.getAttribute('r:id');
        content.push(out);
      }
      else {
        // throw new Error('Support missing for Graphic Frame content');
        return;
      }
    }
  });
  return content;
}

export function handlerDrawing (dom: Document, context: ConversionContext): Record<string, Comment[]> {
  const drawings: Drawing[] = [];

  // loop across anchors
  dom.root.children.forEach((anchorElm: Element) => {
    let drawing: Drawing | null = null;

    const tagName = anchorElm.tagName;
    if (tagName === 'absoluteAnchor' || tagName === 'oneCellAnchor' || tagName === 'twoCellAnchor') {
      const anch = readAnchor(anchorElm);
      if (anch) {
        drawing = {
          anchor: anch,
          content: readGraphicContent(anchorElm),
        };
      }
    }

    console.dir(drawing, { depth: null });
    if (drawing?.content?.length) {
      drawings.push(drawing);
    }
  });

  return drawings;
}
