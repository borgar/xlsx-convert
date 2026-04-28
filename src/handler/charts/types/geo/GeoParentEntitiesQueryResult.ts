import type { GeoEntity } from './GeoEntity.ts';
import type { GeoParentEntitiesQuery } from './GeoParentEntitiesQuery.ts';
import type { GeoParentEntity } from './GeoParentEntity.ts';

export type GeoParentEntitiesQueryResult = {
  geoParentEntitiesQuery: GeoParentEntitiesQuery;
  geoEntity?: GeoEntity;
  geoParentEntity?: GeoParentEntity;
};
