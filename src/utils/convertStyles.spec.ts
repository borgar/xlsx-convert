import { describe, it, expect } from 'vitest';
import { convertStyles } from './convertStyles.ts';
import type { StyleDefs } from '../handler/styles.ts';

function emptyStyleDefs (cellXf: StyleDefs['cellXf']): StyleDefs {
  return {
    cellStyleXfs: [],
    cellXf,
    cellStyles: [],
    fill: [],
    font: [],
    numFmts: {},
    border: [],
  };
}

describe('convertStyles', () => {
  it('propagates pivotButton from the xf record to the JSF Style', () => {
    const { styles } = convertStyles(emptyStyleDefs([
      { pivotButton: true },
      { /* plain xf, no pivotButton */ },
    ]));
    expect(styles[0].pivotButton).toBe(true);
    expect(styles[1].pivotButton).toBeUndefined();
  });
});
