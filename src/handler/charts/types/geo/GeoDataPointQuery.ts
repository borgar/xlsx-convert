import type { EntityType } from './EntityType.ts';

export type GeoDataPointQuery = {
  entityType: EntityType;
  latitude: number;
  longitude: number;
};
