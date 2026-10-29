export type StrRef = {
  type: 'strRef',
  f: string;
  // the whole source range, when categories are filtered out (`c15:fullRef`), normalized
  fullRef?: string;
};
