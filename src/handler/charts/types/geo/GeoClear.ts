import type { GeoChildEntitiesQueryResult } from './GeoChildEntitiesQueryResult.ts';
import type { GeoDataEntityQueryResult } from './GeoDataEntityQueryResult.ts';
import type { GeoDataPointToEntityQueryResult } from './GeoDataPointToEntityQueryResult.ts';
import type { GeoLocationQueryResult } from './GeoLocationQueryResult.ts';
import type { GeoParentEntitiesQueryResult } from './GeoParentEntitiesQueryResult.ts';

export type GeoClear = {
  geoLocationQueryResults?: GeoLocationQueryResult[];
  geoDataEntityQueryResults?: GeoDataEntityQueryResult[];
  geoDataPointToEntityQueryResults?: GeoDataPointToEntityQueryResult[];
  geoChildEntitiesQueryResults?: GeoChildEntitiesQueryResult[];
  geoParentEntitiesQueryResults?: GeoParentEntitiesQueryResult[];
};
