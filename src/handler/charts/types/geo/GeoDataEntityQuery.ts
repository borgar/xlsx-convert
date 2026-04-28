import type { EntityType } from './EntityType.ts';

export type GeoDataEntityQuery = {
  entityType: EntityType;
  entityId: string;
};
