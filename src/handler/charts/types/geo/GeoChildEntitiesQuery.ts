import type { EntityType } from './EntityType.ts';

export type GeoChildEntitiesQuery = {
  entityId: string;
  geoChildTypes?: EntityType[];
};
