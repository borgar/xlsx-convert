import type { Comment } from './handler/comments.ts';
import type { MetaData } from './handler/metadata.ts';
import type { RDStruct } from './handler/rdstuct.ts';
import type { RDValue } from './handler/rdvalue.ts';
import type { Rel } from './handler/rels.ts';
import type { Theme } from './handler/theme.ts';
import type { RelativeFormula } from './RelativeFormula.ts';
import type { External, Workbook } from '@jsfkit/types';
import type { ConversionOptions } from './index.ts';

type SheetLink = {
  name: string;
  rId: string;
  index: number;
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
  persons: Record<string, string>;
  options: ConversionOptions;
  rels: Rel[];
  theme: Theme;
  richStruct: RDStruct[];
  richValues: RDValue[];
  metadata: MetaData;
  sheetLinks: SheetLink[];
  comments: Map<string, Comment[]>;
  externalLinks: External[];
  filename: string;
  _formulasR1C1: FormulaList;
  _shared: Map<number, RelativeFormula>;
  _merged: Record<string, string>;
  _arrayFormula: string[];

  constructor () {
    this.rels = [];
    this.options = {};
    this.workbook = null;
    this.sst = [];
    this.persons = {};
    this.theme = { scheme: {}, indexedColors: [] };
    this.richStruct = [];
    this.richValues = null;
    this.metadata = null;
    this.sheetLinks = [];
    this.comments = new Map();
    this.externalLinks = [];
    this.filename = '';
    this._formulasR1C1 = new FormulaList();
    this._shared = new Map();
    this._merged = {};
    this._arrayFormula = [];
  }
}
