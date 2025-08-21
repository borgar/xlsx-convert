import { translateToA1, translateToR1C1 } from '@borgar/fx';

export class RelativeFormula {
  /**
   * @param {string} formula
   * @param {string} anchorCell
   */
  constructor (formula, anchorCell) {
    this.anchorA1 = anchorCell;
    this.formula = formula;
    this.relative = translateToR1C1(formula, anchorCell);
  }

  /** @param {string} offsetCell */
  translate (offsetCell) {
    return translateToA1(this.relative, offsetCell);
  }
}
