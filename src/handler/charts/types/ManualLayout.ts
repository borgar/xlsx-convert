// always accessed via CT_Layout
export type ManualLayout = {
  layoutTarget?: 'inner' | 'outer';
  xMode?: 'edge' | 'factor';
  yMode?: 'edge' | 'factor';
  wMode?: 'edge' | 'factor';
  hMode?: 'edge' | 'factor';
  x?: number; // CT_Double
  y?: number; // CT_Double
  w?: number; // CT_Double
  h?: number; // CT_Double
};
