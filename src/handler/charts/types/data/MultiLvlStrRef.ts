export type MultiLvlStrRef = {
  type: 'mlStrRef',
  f: string;
  // the whole source range, when categories are filtered out (`c15:fullRef`), normalized
  fullRef?: string;
};
