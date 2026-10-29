export type NumRef = {
  type: 'numRef',
  f: string;
  // the whole source range, when categories are filtered out (`c15:fullRef`), normalized
  fullRef?: string;
};
