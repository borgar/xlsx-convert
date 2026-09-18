export type PictureFormat = 'stretch' | 'stack' | 'stackScale';

export type PictureOptions = {
  applyToFront?: boolean;
  applyToSides?: boolean;
  applyToEnd?: boolean;
  pictureFormat?: PictureFormat;
  pictureStackUnit?: number;
};
