import type { integer } from '@jsfkit/types';
import type { BandFmts } from '../series/BandFmts.ts';
import type { Series } from '../series/Series.ts';

export type SurfaceChartShared = {
  wireframe?: boolean;
  ser?: Series[];
  // XXX: unroll?
  bandFmts?: BandFmts;
};

export type SurfaceChart = SurfaceChartShared & {
  type: 'surface';
  axId: [ integer, integer ];
};

export type SurfaceChart3d = SurfaceChartShared & {
  type: 'surface3d';
  axId: [ integer, integer, integer ];
};
