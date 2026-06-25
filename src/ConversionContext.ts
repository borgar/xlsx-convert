import { INDEXED_COLORS, THEMES } from '@jsfkit/utils';
import type { Theme, DefinedName, External, Workbook } from '@jsfkit/types';
import type { MetaData } from './handler/metadata.ts';
import type { RDStruct } from './handler/rdstuct.ts';
import type { RDValue } from './handler/rdvalue.ts';
import type { Rel } from './handler/rels.ts';
import { DEFAULT_MDW } from './utils/mdw.ts';
import type { RelativeFormula } from './RelativeFormula.ts';
import type { ConversionOptions } from './index.ts';

type SheetLink = {
  name: string;
  rId: string;
  index: number;
  hidden: 0 | 1 | 2; // 0: visible, 1: hidden, 2: very hidden
};

type RefLink = {
  rel: Rel;
  sheetName?: string;
  type: string;
};

class FormulaList {
  container: Map<string, number>;

  constructor () {
    this.container = new Map<string, number>();
  }

  add (formula: string) {
    if (this.container.has(formula)) {
      return this.container.get(formula);
    }
    const index = this.container.size;
    this.container.set(formula, index);
    return index;
  }

  list () {
    return this.container.keys();
  }
}

export class ConversionContext {
  workbook: Workbook | null;
  sst: string[];
  options: ConversionOptions;
  rels: Rel[];
  drawingRels: Rel[];
  theme: Theme;
  indexedColors: string[];
  nameDefs: Map<string, DefinedName>;
  richStruct: RDStruct[];
  richValues: RDValue[];
  metadata: MetaData;
  sheetLinks: SheetLink[];
  externalLinks: External[];
  filename: string;
  _formulasR1C1: FormulaList;
  _shared?: Map<number, RelativeFormula>;
  _merged?: Record<string, string>;
  _arrayFormula?: string[];
  images: RefLink[];
  isLikelyGSExport: boolean;
  /**
   * Excel includes an undocumented number in the workbook properties that hints which
   * default theme to use if a theme is not included. Values include:
   * - 0 (or absent): no default theme override
   * - 123820: Office 2007 theme (uses Calibri)
   * - 124226: Office 2010 theme (uses Calibri)
   * - 164011: Office 2013 theme (uses Calibri)
   * - 166925: Office 2013–2022 theme (uses Calibri)
   * - 202300: Microsoft 365 (2023+) theme (uses Aptos Narrow)
   */
  defaultThemeVersion: string;
  charts: RefLink[];
  /** Max Digit Width of the workbook Normal font, used to convert column widths to pixels. */
  normalMdw: number;

  warn (message: string): void {
    this.options.warn?.(message);
  }

  constructor () {
    this.rels = [];
    this.options = {};
    this.workbook = null;
    this.defaultThemeVersion = '202300';
    this.theme = THEMES.default;
    this.nameDefs = new Map();
    this.indexedColors = [ ...INDEXED_COLORS ];
    this.richStruct = [];
    this.richValues = [];
    this.drawingRels = [];
    this.sst = [];
    this.metadata = { cells: [], values: [] };
    this.sheetLinks = [];
    this.externalLinks = [];
    this.filename = '';
    this._formulasR1C1 = new FormulaList();
    this.images = [];
    this.isLikelyGSExport = false;
    this.charts = [];
    this.normalMdw = DEFAULT_MDW;
  }
}
