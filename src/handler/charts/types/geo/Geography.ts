import type { GeoCache } from './GeoCache.ts';
import type { GeoMappingLevel } from './GeoMappingLevel.ts';

export type Geography = {
  projectionType: 'mercator' | 'miller' | 'robinson' | 'albers';
  viewedRegionType: GeoMappingLevel;
  cultureLanguage: string; // uses language type (from XML?)
  cultureRegion: string;
  attribution: string;
  geoCache?: GeoCache;
};
