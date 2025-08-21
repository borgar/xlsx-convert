/* eslint-disable max-len */

/**
 * @typedef SheetLink
 * @prop {string} name
 * @prop {string} rId
 * @prop {number} index
 */

export class ConversionContext {
  constructor () {
    /** @type {import('./handler/rels').Rel[]} */
    this.rels = [];
    /** @type {Record<string, boolean>} */
    this.options = {};
    /** @type {import('./jsf-types.js').JSFWorkbook} */
    this.workbook;
    /** @type {string[]} */
    this.sst = [];
    /** @type {Record<string, string>} */
    this.persons = {};
    /** @type {import('./handler/theme').Theme} */
    this.theme = { scheme: [], indexedColors: [] };
    /** @type {import('./handler/rdstuct.js').RDStruct[]} */
    this.richStruct = [];
    /** @type {import('./handler/rdvalue.js').RDValue[]} */
    this.richValues = null;
    /** @type {import('./handler/metadata.js').MetaData} */
    this.metadata = null;
    /** @type {SheetLink[]} */
    this.sheetLinks = [];
    /** @type {Record<string, Comment[]>} */
    this.comments = {};
    /** @type {import('./jsf-types.js').JSFExternal[]} */
    this.externalLinks = [];
    /** @type {string} */
    this.filename = '';
    // shared formula
    /** @type {Record<number, import('./RelativeFormula.js').RelativeFormula>} */
    this._shared = {};
    /** @type {Record<string, string>} */
    this._merged = {};
    this._arrayFormula = [];
  }
}
