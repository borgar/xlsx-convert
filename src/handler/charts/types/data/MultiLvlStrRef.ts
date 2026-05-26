import type { MultiLvlStrData } from './MultiLvlStrData.ts';

export type MultiLvlStrRef = {
  type: 'mlStrRef',
  f: string;
  multiLvlStrCache?: MultiLvlStrData;
};
