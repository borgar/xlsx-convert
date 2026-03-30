import type { GeoPolygon } from './GeoPolygon.ts';

export type GeoData = {
  entityName: string;
  entityId: string;
  east: number;
  west: number;
  north: number;
  south: number;
  geoPolygons?: GeoPolygon[];
  copyrights?: string[];
};
