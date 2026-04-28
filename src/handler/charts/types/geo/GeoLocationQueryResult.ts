import type { GeoLocation } from './GeoLocation.ts';
import type { GeoLocationQuery } from './GeoLocationQuery.ts';

export type GeoLocationQueryResult = {
  geoLocationQuery?: GeoLocationQuery;
  geoLocations?: GeoLocation[];
};
