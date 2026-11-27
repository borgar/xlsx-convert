import type { Drawing } from '@jsfkit/types';
import { describe, it, expect } from 'vitest';
import { dropMissingCharts } from './dropMissingCharts.ts';

const anchor: Drawing['anchor'] = { type: 'absolute', pos: { x: 0, y: 0 }, ext: { cx: 1, cy: 1 } };
const chart = (chartId: string) => ({ type: 'chart', id: chartId, name: chartId, chartId }) as const;

describe('dropMissingCharts', () => {
  it('removes charts that weren\'t converted, and groups and drawings left empty', () => {
    const drawings: Drawing[] = [
      { anchor, content: [ chart('a') ] },
      { anchor, content: [ chart('b') ] },
      { anchor, content: [ { type: 'group', id: 'g', name: 'g', content: [ chart('a'), chart('b') ] } ] },
      { anchor, content: [ { type: 'group', id: 'h', name: 'h', content: [ chart('b') ] } ] },
    ];
    expect(dropMissingCharts(drawings, { a: {} })).toEqual([
      { anchor, content: [ chart('a') ] },
      { anchor, content: [ { type: 'group', id: 'g', name: 'g', content: [ chart('a') ] } ] },
    ]);
  });

  it('keeps charts whose ID names a kept chart part', () => {
    const drawings: Drawing[] = [ { anchor, content: [ chart('xl/charts/chartEx1.xml') ] } ];
    const kept = { 'xl/charts/chartEx1.xml': 'data:application/vnd.ms-office.chartex+xml;base64,' };
    expect(dropMissingCharts(drawings, { ...kept })).toEqual(drawings);
  });
});
