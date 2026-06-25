import type { integer } from '@jsfkit/types';

export type GeoPolygon = {
  polygonId: string;
  numPoints: integer;
  pcaRings: string;
};
