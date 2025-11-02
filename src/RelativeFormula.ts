import { type Token, tokenize, translateTokensToR1C1, translateTokensToA1, stringifyTokens } from '@borgar/fx/xlsx';

export class RelativeFormula {
  anchorA1: string;
  formula: string;
  relative: Token[];

  constructor (formula: string, anchorCell: string) {
    this.anchorA1 = anchorCell;
    this.formula = formula;
  }

  getR1C1Tokens (): Token[] {
    if (this.relative) {
      return this.relative;
    }
    const tokens = tokenize(this.formula, { allowTernary: true });
    this.relative = translateTokensToR1C1(tokens, this.anchorA1);
    return this.relative;
  }

  translate (offsetCell: string): string {
    if (offsetCell === this.anchorA1) {
      // just pass the formula back
      return this.formula;
    }
    const exprA1 = translateTokensToA1(this.getR1C1Tokens(), offsetCell);
    return stringifyTokens(exprA1);
  }
}
