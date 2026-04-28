import type { AreaChart, AreaChart3d } from './AreaChart.ts';
import type { BarChart, BarChart3d } from './BarChart.ts';
import type { BubbleChart } from './BubbleChart.ts';
import type { LineChart, LineChart3d } from './LineChart.ts';
import type { DoughnutChart, OfPieChart, PieChart, PieChart3d } from './PieChart.ts';
import type { RadarChart } from './RadarChart.ts';
import type { ScatterChart } from './ScatterChart.ts';
import type { StockChart } from './StockChart.ts';
import type { SurfaceChart3d, SurfaceChart } from './SurfaceChart.ts';

export type Plot = (
  AreaChart |
  AreaChart3d |
  LineChart |
  LineChart3d |
  StockChart |
  RadarChart |
  ScatterChart |
  PieChart |
  PieChart3d |
  OfPieChart |
  DoughnutChart |
  BarChart |
  BarChart3d |
  SurfaceChart |
  SurfaceChart3d |
  BubbleChart
  // ... Waterfall
);

// Sunburst	TRUE	boxWhisker
// Funnel	TRUE	funnel
// Histogram	TRUE	clusteredColumn
// Histogram with line	TRUE	paretoLine
// Sunburst	TRUE	sunburst
// Treemap	TRUE	treemap
// Waterfall	TRUE	waterfall
// Map	TRUE	regionMap
