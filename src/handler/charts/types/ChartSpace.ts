import type { Shape } from '@jsfkit/types';
import type { TextProps } from './TextProps.ts';
import type { Chart } from './Chart.ts';
import type { integer } from './integer.ts';

export type ChartSpace = {
  date1904?: boolean;
  roundedCorners?: boolean;
  lang?: string;
  /**
   * @min 1
   * @max 48
   */
  style?: integer;
  // clrMapOvr?: {bg1,tx1,bg2,tx2,accent1,...} -- will come from themes
  // pivotSource?: { name: string, fmtId: integer }
  // protection?: {chartObject?:boolean;data?:boolean;formatting?:boolean;selection?:boolean;userInterface?:boolean };
  chart: Chart;
  shape?: Shape;
  textProps?: TextProps;
  // externalData?: { autoUpdate: boolean }; -- as a r:id pointing at the resource
  // printSettings?: { headerFooter, pageMargins, pageSetup };
  // userShapes?: CT_RelId;
};
