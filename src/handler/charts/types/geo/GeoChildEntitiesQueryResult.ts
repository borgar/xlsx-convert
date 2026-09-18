import type { GeoChildEntitiesQuery } from './GeoChildEntitiesQuery.ts';
import type { GeoHierarchyEntity } from './GeoHierarchyEntity.ts';

export type GeoChildEntitiesQueryResult = {
  geoChildEntitiesQuery?: GeoChildEntitiesQuery;
  geoChildEntities?: GeoHierarchyEntity[];
};
