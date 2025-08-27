import type { Comment } from './handler/comments.ts';
import type { MetaData } from './handler/metadata.ts';
import type { RDStruct } from './handler/rdstuct.ts';
import type { RDValue } from './handler/rdvalue.ts';
import type { Rel } from './handler/rels.ts';
import type { Theme } from './handler/theme.ts';
import type { RelativeFormula } from './RelativeFormula.ts';
import type { JSFExternal, JSFWorkbook } from './jsf-types.js';
import type { ConversionOptions } from './index.ts';

type SheetLink = {
  name: string;
  rId: string;
  index: number;
};

export class ConversionContext {
  workbook: JSFWorkbook | null;
  sst: string[];
  persons: Record<string, string>;
  options: ConversionOptions;
  rels: Rel[];
  theme: Theme;
  richStruct: RDStruct[];
  richValues: RDValue[];
  metadata: MetaData;
  sheetLinks: SheetLink[];
  comments: Record<string, Comment[]>;
  externalLinks: JSFExternal[];
  filename: string;
  _formulasR1C1: string[];
  _shared: Record<number, RelativeFormula>;
  _merged: Record<string, string>;
  _arrayFormula: string[];

  constructor () {
    this.rels = [];
    this.options = {};
    this.workbook = null;
    this.sst = [];
    this.persons = {};
    this.theme = { scheme: [], indexedColors: [] };
    this.richStruct = [];
    this.richValues = null;
    this.metadata = null;
    this.sheetLinks = [];
    this.comments = {};
    this.externalLinks = [];
    this.filename = '';
    this._formulasR1C1 = [];
    // shared formula
    this._shared = {};
    this._merged = {};
    this._arrayFormula = [];
  }
}
