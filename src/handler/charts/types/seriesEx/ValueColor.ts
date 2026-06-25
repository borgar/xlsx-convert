import type { HslColor, PresetColor, SchemeClr, ScRgbColor, SrgbColor, SystemColor } from '../colors.ts';

export type ValueColors = {
  minColor?: ScRgbColor | SrgbColor | HslColor | SystemColor | SchemeClr | PresetColor;
  midColor?: ScRgbColor | SrgbColor | HslColor | SystemColor | SchemeClr | PresetColor;
  maxColor?: ScRgbColor | SrgbColor | HslColor | SystemColor | SchemeClr | PresetColor;
};

export type ValueColorPositions = {
  min?: ColorPosExtr | ColorPosNumb | ColorPosPerc;
  mid?: ColorPosNumb | ColorPosPerc;
  max?: ColorPosExtr | ColorPosNumb | ColorPosPerc;
};

type ColorPosExtr = { t: 'extreme' };
type ColorPosNumb = { t: 'number', v: number };
type ColorPosPerc = { t: 'percent', v: number };
