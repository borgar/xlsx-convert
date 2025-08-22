import { translateToA1, translateToR1C1 } from '@borgar/fx';

export class RelativeFormula {
  anchorA1: string;
  formula: string;
  relative: string;

  constructor (formula: string, anchorCell: string) {
    this.anchorA1 = anchorCell;
    this.formula = formula;
    this.relative = translateToR1C1(formula, anchorCell) as string;
  }

  /** @param {string} offsetCell */
  translate (offsetCell: string): string {
    return translateToA1(this.relative, offsetCell) as string;
  }
}
