import { translateToA1, translateToR1C1 } from '@borgar/fx';

export class RelativeFormula {
  anchorA1: string;
  formula: string;
  relative: string | undefined;

  constructor (formula: string, anchorCell: string) {
    this.anchorA1 = anchorCell;
    this.formula = formula;
  }

  /** @param {string} offsetCell */
  translate (offsetCell: string): string {
    if (!this.relative) {
      this.relative = translateToR1C1(this.formula, this.anchorA1) as string;
    }
    return translateToA1(this.relative, offsetCell) as string;
  }
}
