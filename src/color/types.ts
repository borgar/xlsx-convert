// XXX: To be replaced by JSF types
export type ColorOpTypeNum = 'alpha' | 'alphaMod' | 'alphaOff' | 'blue' | 'blueMod' | 'blueOff' | 'green' | 'greenMod' | 'greenOff' | 'red' | 'redMod' | 'redOff' | 'hue' | 'hueMod' | 'hueOff' | 'sat' | 'satMod' | 'satOff' | 'lum' | 'lumMod' | 'lumOff' | 'shade' | 'tint';
export type ColorOpTypeBool = 'comp' | 'gamma' | 'gray' | 'inv' | 'invGamma';
export type ColorOp = { type: ColorOpTypeNum, value: number } | { type: ColorOpTypeBool };
