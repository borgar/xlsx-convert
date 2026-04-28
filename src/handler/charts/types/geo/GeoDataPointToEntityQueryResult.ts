import type { GeoDataPointQuery } from './GeoDataPointQuery.ts';
import type { GeoDataPointToEntityQuery } from './GeoDataPointToEntityQuery.ts';

export type GeoDataPointToEntityQueryResult = {
  geoDataPointQuery?: GeoDataPointQuery;
  geoDataPointToEntityQuery?: GeoDataPointToEntityQuery;
};
