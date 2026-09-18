import type { Address } from './Address.ts';
import type { EntityType } from './EntityType.ts';

export type GeoLocation = {
  latitude: number;
  longitude: number;
  entityName: string;
  entityType: EntityType;
  address?: Address;
};
