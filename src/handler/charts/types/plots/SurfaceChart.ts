import type { integer } from '../integer.ts';
import type { BandFmts } from '../series/BandFmts.ts';
import type { SurfaceSer } from '../series/SurfaceSer.ts';

export type SurfaceChart = {
  type: 'surface';
  axId: [ integer, integer ] | [ integer, integer, integer ];
  wireframe?: boolean;
  ser?: SurfaceSer[];
  // XXX: unroll?
  bandFmts?: BandFmts;
};

export type SurfaceChart3d = SurfaceChart & {
  type: 'surface3d';
  axId: [ integer, integer, integer ];
};
