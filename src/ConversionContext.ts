import { Comment } from './handler/comments.js';
import { MetaData } from './handler/metadata.js';
import { RDStruct } from './handler/rdstuct.js';
import { RDValue } from './handler/rdvalue.js';
import { Rel } from './handler/rels.js';
import { Theme } from './handler/theme.js';
import { JSFExternal } from './jsf-types.js';
import { RelativeFormula } from './RelativeFormula.js';

type SheetLink = {
  name: string;
  rId: string;
  index: number;
};

export class ConversionContext {
  workbook: import('./jsf-types.js').JSFWorkbook | null;
  sst: string[];
  persons: Record<string, string>;
  options: Record<string, boolean>;
  rels: Rel[];
  theme: Theme;
  richStruct: RDStruct[];
  richValues: RDValue[];
  metadata: MetaData;
  sheetLinks: SheetLink[];
  comments: Record<string, Comment[]>;
  externalLinks: JSFExternal[];
  filename: string;
  _shared: Record<number, RelativeFormula>;
  _merged: Record<string, string>;
  _arrayFormula: string[]; // ??

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
    // shared formula
    this._shared = {};
    this._merged = {};
    this._arrayFormula = [];
  }
}
