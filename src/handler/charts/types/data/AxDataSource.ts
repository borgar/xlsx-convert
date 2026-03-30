import type { MultiLvlStrRef } from './MultiLvlStrRef.ts';
import type { NumData } from './NumData.ts';
import type { NumRef } from './NumRef.ts';
import type { StrData } from './StrData.ts';
import type { StrRef } from './StrRef.ts';

export type AxDataSource =
  MultiLvlStrRef |
  NumRef |
  NumData |
  StrRef |
  StrData;
