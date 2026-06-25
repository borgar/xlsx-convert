import { Element } from '@borgar/simple-xml';
import type { ConversionContext } from '../../ConversionContext.ts';
import { boolValElm, numValElm, strValElm } from './utils/valElm.ts';
import { addProp } from '../../utils/addProp.ts';
import { readShapeProperties } from '../drawings/readShapeProperties.ts';
import { readDataSource } from './readDataSource.ts';
import type { ErrBars } from './types/errorbars/ErrBars.ts';
import type { ErrBarType } from './types/errorbars/ErrBarType.ts';
import type { ErrValType } from './types/errorbars/ErrValType.ts';
import type { ErrDir } from './types/errorbars/ErrDir.ts';
import { isNumDataSource } from './utils/isNumDataSource.ts';

export function readErrBars (element: Element, context: ConversionContext): ErrBars | undefined {
  const errBars: Partial<ErrBars> = {};

  for (const child of element.children) {
    if (child.tagName === 'errBarType') {
      addProp(errBars, 'errBarType', strValElm<ErrBarType>(child));
    }
    else if (child.tagName === 'errValType') {
      addProp(errBars, 'errValType', strValElm<ErrValType>(child));
    }
    else if (child.tagName === 'errDir') {
      addProp(errBars, 'errDir', strValElm<ErrDir>(child));
    }
    else if (child.tagName === 'noEndCap') {
      addProp(errBars, 'noEndCap', boolValElm(child));
    }
    else if (child.tagName === 'plus') {
      const ds = readDataSource(child);
      if (isNumDataSource(ds)) {
        addProp(errBars, 'plus', ds);
      }
    }
    else if (child.tagName === 'minus') {
      const ds = readDataSource(child);
      if (isNumDataSource(ds)) {
        addProp(errBars, 'minus', ds);
      }
    }
    else if (child.tagName === 'val') {
      addProp(errBars, 'val', numValElm(child));
    }
    else if (child.tagName === 'spPr') {
      errBars.shape = readShapeProperties(child, context);
    }
  }

  if (errBars.errBarType && errBars.errValType) {
    return errBars as ErrBars;
  }
}
