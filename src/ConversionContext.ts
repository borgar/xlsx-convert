import type { Theme } from '@jsfkit/types';
import type { MetaData } from './handler/metadata.ts';
import type { RDStruct } from './handler/rdstuct.ts';
import type { RDValue } from './handler/rdvalue.ts';
import type { Rel } from './handler/rels.ts';
import { COLOR_INDEX } from './constants.ts';
import { getBlankTheme } from './handler/theme.ts';
import type { RelativeFormula } from './RelativeFormula.ts';
import type { DefinedName, External, Workbook } from '@jsfkit/types';
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
  _shared: Map<number, RelativeFormula>;
  _merged: Record<string, string>;
  _arrayFormula: string[];
  images: RefLink[];
  isLikelyGSExport: boolean;
  charts: RefLink[];

  warn (message: string): void {
    this.options.warn?.(message);
  }

  constructor () {
    this.rels = [];
    this.options = {};
    this.workbook = null;
    this.theme = getBlankTheme();
    this.indexedColors = [ ...COLOR_INDEX ];
    this.nameDefs = new Map();
    this.richStruct = [];
    this.richValues = null;
    this.metadata = null;
    this.sheetLinks = [];
    this.externalLinks = [];
    this.filename = '';
    this._formulasR1C1 = new FormulaList();
    this._shared = new Map();
    this._merged = {};
    this._arrayFormula = [];
    this.images = [];
    this.isLikelyGSExport = false;
    this.charts = [];
  }
}
