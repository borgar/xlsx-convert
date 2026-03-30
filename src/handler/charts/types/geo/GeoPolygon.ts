import type { integer } from '../integer.ts';

export type GeoPolygon = {
  polygonId: string;
  numPoints: integer;
  pcaRings: string;
};
