import type { Color as JSFColor, Theme } from '@jsfkit/types';

export class Color {
  jsfColor: JSFColor;
  theme: Theme;
  indexedColors: string[];

  constructor (color: JSFColor, theme: Theme, indexedColors: string[]) {
    this.jsfColor = color;
    this.theme = theme;
    this.indexedColors = indexedColors;
  }

  /** Returns the lossless JSFKit Color object. */
  getJSF (): JSFColor {
    return this.jsfColor;
  }
}
