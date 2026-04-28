import type { EntityType } from './EntityType.ts';

export type GeoDataPointToEntityQuery = {
  entityType: EntityType;
  entityId: string;
};
