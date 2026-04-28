import type { Surface } from './3d/Surface.ts';
import type { View3d } from './3d/View3d.ts';
import type { DispBlanksAs } from './DispBlanksAs.ts';
import type { Legend } from './legend/Legend.ts';
import type { PivotFmts } from './PivotFmts.ts';
import type { PlotArea } from './PlotArea.ts';
import type { Title } from './Title.ts';

export type Chart = {
  plotArea: PlotArea;
  autoTitleDeleted?: boolean;
  plotVisOnly?: boolean;
  showDLblsOverMax?: boolean;
  title?: Title;
  pivotFmts?: PivotFmts;
  view3D?: View3d;
  floor?: Surface;
  sideWall?: Surface;
  backWall?: Surface;
  legend?: Legend;
  dispBlanksAs?: DispBlanksAs;
};
