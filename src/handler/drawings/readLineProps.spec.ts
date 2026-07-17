import { describe, it, expect } from 'vitest';
import { parseXML } from '@borgar/simple-xml';
import { readLineProps } from './readLineProps.ts';
import type { ConversionContext } from '../../ConversionContext.ts';

// readLineProps only touches the context when resolving fills, which these tests don't exercise.
const context = {} as ConversionContext;

function parse (xml: string) {
  return readLineProps(parseXML(xml).root!, context);
}

describe('readLineProps', () => {
  it('leaves width unset when the w attribute is omitted', () => {
    // An <a:ln> without w means "unresolved": the effective width depends on where the line is
    // used (drawing shapes default to 0.75pt, chart SERIES lines to 2.25pt via the chart
    // style). Fabricating 9525 here erases that signal and renders chart lines hairline-thin.
    expect(parse('<ln w="28575"/>')?.width).toBe(28575);
    expect(parse('<ln/>')?.width).toBeUndefined();
  });

  it('maps every ST_LineCap token', () => {
    // 'butt' is the JSF default and is elided; 'rnd' and 'sq' must survive the conversion.
    expect(parse('<ln cap="flat"/>')?.cap).toBeUndefined();
    expect(parse('<ln cap="rnd"/>')?.cap).toBe('round');
    expect(parse('<ln cap="sq"/>')?.cap).toBe('square');
  });

  it('assumes a square cap when the attribute is omitted', () => {
    // ECMA-376: "If this attribute is omitted, then a value of square is assumed."
    expect(parse('<ln w="9525"/>')?.cap).toBe('square');
  });
});
