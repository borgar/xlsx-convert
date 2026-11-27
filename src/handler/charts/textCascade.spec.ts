import { describe, it, expect } from 'vitest';
import type { Chart, ChartTextStyle, Color } from '@jsfkit/types';
import { applyTextCascade, CHARTEX_TEXT_FALLBACKS, LEGACY_TEXT_FALLBACKS, minimizeTextStyle } from './textCascade.ts';

const TX1: Color = { type: 'theme', value: 'tx1' };
const GRAY: Color = {
  type: 'theme',
  value: 'tx1',
  transforms: [ { type: 'lumMod', value: 65 }, { type: 'lumOff', value: 35 } ],
};
const RED: Color = { type: 'srgb', value: 'FF0000' };

// What Excel writes on a new chart's elements.
const EXCEL_TITLE: ChartTextStyle = { fontScheme: 'minor', fontSize: 14, color: GRAY, bold: false, italic: false };
const EXCEL_AXIS: ChartTextStyle = { fontScheme: 'minor', fontSize: 9, color: GRAY, bold: false, italic: false };

describe('minimizeTextStyle', () => {
  it('drops everything from the text properties Excel writes on new charts', () => {
    expect(minimizeTextStyle('title', EXCEL_TITLE, undefined, LEGACY_TEXT_FALLBACKS)).toBeUndefined();
    expect(minimizeTextStyle('axisLabels', EXCEL_AXIS, undefined, LEGACY_TEXT_FALLBACKS)).toBeUndefined();
    expect(minimizeTextStyle('legend', EXCEL_AXIS, undefined, LEGACY_TEXT_FALLBACKS)).toBeUndefined();
  });

  it("writes out Excel's engine defaults for legacy elements that set nothing", () => {
    expect(minimizeTextStyle('title', undefined, undefined, LEGACY_TEXT_FALLBACKS))
      .toEqual({ fontSize: 18, color: TX1, bold: true });
    expect(minimizeTextStyle('axisTitle', undefined, undefined, LEGACY_TEXT_FALLBACKS))
      .toEqual({ color: TX1, bold: true });
    expect(minimizeTextStyle('axisLabels', undefined, undefined, LEGACY_TEXT_FALLBACKS))
      .toEqual({ fontSize: 10, color: TX1 });
    expect(minimizeTextStyle('dataLabels', undefined, undefined, LEGACY_TEXT_FALLBACKS))
      .toEqual({ fontSize: 10, color: TX1 });
  });

  it('lets legacy elements inherit the chart-wide size, with 1.2 times the size for the title', () => {
    const chart: ChartTextStyle = { fontSize: 20 };
    expect(minimizeTextStyle('axisLabels', { fontSize: 20, color: GRAY }, chart, LEGACY_TEXT_FALLBACKS)).toBeUndefined();
    expect(minimizeTextStyle('title', { fontSize: 24, color: GRAY, bold: false }, chart, LEGACY_TEXT_FALLBACKS))
      .toBeUndefined();
    // A title that matches the chart-wide size differs from the 24pt it would inherit.
    expect(minimizeTextStyle('title', { fontSize: 20, color: GRAY, bold: false }, chart, LEGACY_TEXT_FALLBACKS))
      .toEqual({ fontSize: 20 });
    expect(minimizeTextStyle('title', { color: GRAY, bold: false }, { fontSize: 10 }, LEGACY_TEXT_FALLBACKS))
      .toBeUndefined();
  });

  it('lets legacy elements inherit color, bold, and typeface from the chart-wide style', () => {
    const chart: ChartTextStyle = { color: RED, bold: true, fontFamily: 'Courier New' };
    expect(minimizeTextStyle('legend', { fontSize: 9 }, chart, LEGACY_TEXT_FALLBACKS)).toBeUndefined();
    expect(minimizeTextStyle('legend', { fontSize: 9, fontScheme: 'minor' }, chart, LEGACY_TEXT_FALLBACKS))
      .toEqual({ fontScheme: 'minor' });
  });

  it("uses ChartEx's style part defaults, which match JSFChart's except in two places", () => {
    expect(minimizeTextStyle('legend', undefined, undefined, CHARTEX_TEXT_FALLBACKS)).toBeUndefined();
    expect(minimizeTextStyle('title', undefined, undefined, CHARTEX_TEXT_FALLBACKS)).toBeUndefined();
    expect(minimizeTextStyle('axisTitle', undefined, undefined, CHARTEX_TEXT_FALLBACKS)).toEqual({ fontSize: 9 });
    expect(minimizeTextStyle('dataLabels', undefined, undefined, CHARTEX_TEXT_FALLBACKS)).toEqual({ color: GRAY });
  });

  it("keeps properties that don't cascade", () => {
    expect(minimizeTextStyle('axisLabels', { ...EXCEL_AXIS, rot: -2700000 }, undefined, LEGACY_TEXT_FALLBACKS))
      .toEqual({ rot: -2700000 });
  });
});

describe('applyTextCascade', () => {
  it('reduces data labels against the labels they override', () => {
    const chart = {
      data: [],
      scales: [],
      plots: [ {
        id: 'p',
        mark: 'bar',
        data: 'd',
        encoding: {},
        labels: { textStyle: { fontSize: 12, color: GRAY } },
        series: [ {
          id: 's',
          labels: { textStyle: { fontSize: 12, color: GRAY, bold: true } },
          points: [ { index: 0, label: { textStyle: { fontSize: 12, color: RED, bold: true } } } ],
        } ],
      } ],
    } as unknown as Chart;
    applyTextCascade(chart, LEGACY_TEXT_FALLBACKS);
    const plot = chart.plots[0];
    expect(plot.labels?.textStyle).toEqual({ fontSize: 12, color: GRAY });
    expect(plot.series[0].labels?.textStyle).toEqual({ bold: true });
    expect(plot.series[0].points?.[0].label?.textStyle).toEqual({ color: RED });
  });
});
