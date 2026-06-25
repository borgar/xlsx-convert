import type { EntityType } from './EntityType.ts';

export type GeoLocationQuery = {
  countryRegion: string;
  adminDistrict1: string;
  adminDistrict2: string;
  postalCode: string;
  entityType: EntityType;
};
