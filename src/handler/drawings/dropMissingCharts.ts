import type { Drawing, Graphic } from '@jsfkit/types';

function keepGraphic (graphic: Graphic, charts: Record<string, unknown>): Graphic | undefined {
  if (graphic.type === 'chart') {
    return graphic.chartId in charts ? graphic : undefined;
  }
  if (graphic.type === 'group') {
    const content = graphic.content.flatMap(g => keepGraphic(g, charts) ?? []);
    return content.length ? { ...graphic, content } : undefined;
  }
  return graphic;
}

/**
 * Remove the charts that weren't converted from a sheet's drawings, so that every
 * `GraphicChart.chartId` is a key of `Workbook.charts`. A group or drawing left empty is removed too.
 *
 * @param drawings The sheet's drawings
 * @param charts The workbook's converted charts, keyed by chart ID
 */
export function dropMissingCharts (drawings: Drawing[], charts: Record<string, unknown>): Drawing[] {
  return drawings.flatMap(drawing => {
    const content = drawing.content.flatMap(g => keepGraphic(g, charts) ?? []);
    return content.length ? [ { ...drawing, content } ] : [];
  });
}
