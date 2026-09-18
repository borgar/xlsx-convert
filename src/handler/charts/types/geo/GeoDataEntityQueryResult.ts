import type { GeoData } from './GeoData.ts';
import type { GeoDataEntityQuery } from './GeoDataEntityQuery.ts';

export type GeoDataEntityQueryResult = {
  geoDataEntityQuery?: GeoDataEntityQuery;
  geoData?: GeoData;
};
