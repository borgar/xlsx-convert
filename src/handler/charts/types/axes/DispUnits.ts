import type { BuiltInUnit } from './BuiltInUnit.ts';
import type { DispUnitsLbl } from './DispUnitsLbl.ts';

export type DispUnits =
  {
    dispUnitsLbl?: DispUnitsLbl;
    custUnit: number;
  } |
  {
    dispUnitsLbl?: DispUnitsLbl;
    /**
     * @default "thousands"
     */
    builtInUnit: BuiltInUnit;
  };
