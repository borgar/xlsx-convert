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
  comments: Record<string, Comment[]>;
  externalLinks: External[];
  filename: string;
  _formulasR1C1: string[];
  _shared: Map<number, RelativeFormula>;
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
    this._shared = new Map();
    this._merged = {};
    this._arrayFormula = [];
  }
}
