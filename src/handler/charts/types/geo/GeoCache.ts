import type { GeoClear } from './GeoClear.ts';

export type GeoCache = {
  provider: string;
  clear?: GeoClear;
  binary?: string; // base64Binary
};
