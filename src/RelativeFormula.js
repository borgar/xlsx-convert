import { translateToA1, translateToR1C1 } from '@borgar/fx';

export default class RelativeFormula {
  constructor (formula, anchorCell) {
    this.anchorA1 = anchorCell;
    this.formula = formula;
    this.relative = translateToR1C1(formula, anchorCell);
  }

  translate (offsetCell) {
    return translateToA1(this.relative, offsetCell);
  }
}
