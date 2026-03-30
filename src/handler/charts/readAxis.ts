import type { AxPos } from './types/axes/AxPos.ts';
import type { BuiltInUnit } from './types/axes/BuiltInUnit.ts';
import type { CatAx } from './types/axes/CatAx.ts';
import type { ConversionContext } from '../../ConversionContext.ts';
import type { CrossBetween } from './types/axes/CrossBetween.ts';
import type { Crosses } from './types/axes/Crosses.ts';
import type { DateAx } from './types/axes/DateAx.ts';
import type { DispUnitsLbl } from './types/axes/DispUnitsLbl.ts';
import type { Element } from '@borgar/simple-xml';
import type { LblAlgn } from './types/axes/LblAlgn.ts';
import type { Orientation } from './types/axes/Orientation.ts';
import type { Scaling } from './types/axes/Scaling.ts';
import type { SerAx } from './types/axes/SerAx.ts';
import type { TickLblPos } from './types/axes/TickLblPos.ts';
import type { TickMark } from './types/axes/TickMark.ts';
import type { TimeUnit } from './types/axes/TimeUnit.ts';
import type { ValAx } from './types/axes/ValAx.ts';
import { addProp } from '../../utils/addProp.ts';
import { boolValElm, numValElm, strValElm, xperValElm } from './utils/valElm.ts';
import { hasKeys } from '../../utils/hasKeys.ts';
import { readShapeProperties } from '../drawings/readShapeProperties.ts';
import { readTitle } from './readTitle.ts';
import type { DispUnits } from './types/axes/DispUnits.ts';
import { readTextProps } from './readTextProps.ts';
import { readText } from './readText.ts';
import { readNumFmt } from './readNumFmt.ts';

function readScaling (element: Element): Scaling | undefined {
  const out: Scaling = {};
  for (const child of element.children) {
    if (child.tagName === 'logBase') {
      const logBase = numValElm(child);
      if (logBase && logBase >= 2 && logBase <= 1000) {
        out.logBase = logBase;
      }
    }
    else if (child.tagName === 'orientation') {
      addProp(out, 'orientation', strValElm(child, 'minMax') as Orientation | undefined, 'minMax');
    }
    else if (child.tagName === 'max') {
      addProp(out, 'max', numValElm(child));
    }
    else if (child.tagName === 'min') {
      addProp(out, 'min', numValElm(child));
    }
  }
  return hasKeys(out) ? out : undefined;
}

function readDispUnits (element: Element, context: ConversionContext): DispUnits | undefined {
  let custUnit: number;
  let builtInUnit: BuiltInUnit;
  let dispUnitsLbl: DispUnitsLbl;

  for (const child of element.children) {
    if (child.tagName === 'custUnit') {
      custUnit = numValElm(child);
    }
    else if (child.tagName === 'builtInUnit') {
      builtInUnit = strValElm<BuiltInUnit>(child);
    }
    else if (child.tagName === 'dispUnitsLbl') {
      dispUnitsLbl = {};
      for (const grandchild of child.children) {
        if (grandchild.tagName === 'layout') {
          // TODO: readLayout -- see Legend
        }
        else if (grandchild.tagName === 'spPr') {
          addProp(dispUnitsLbl, 'shape', readShapeProperties(grandchild, context));
        }
        else if (grandchild.tagName === 'tx') {
          addProp(dispUnitsLbl, 'text', readText(grandchild));
        }
        else if (grandchild.tagName === 'txPr') {
          addProp(dispUnitsLbl, 'textProps', readTextProps(grandchild));
        }
      }
    }
  }
  if (custUnit) {
    return { custUnit, dispUnitsLbl };
  }
  if (builtInUnit) {
    return { builtInUnit, dispUnitsLbl };
  }
}

export function readAxis (element: Element, context: ConversionContext): ValAx | DateAx | SerAx | CatAx | undefined {
  const axType = element.tagName;
  if (axType !== 'valAx' && axType !== 'catAx' && axType !== 'serAx' && axType !== 'dateAx') { return; }

  const out: Partial<ValAx | DateAx | SerAx | CatAx> = { type: axType };

  for (const child of element.children) {
    const tag = child.tagName;

    // specific to ValAx
    if (out.type === 'valAx') {
      if (tag === 'crossBetween') {
        addProp(out, 'crossBetween', strValElm<CrossBetween>(child));
      }
      else if (tag === 'majorUnit') {
        addProp(out, 'majorUnit', numValElm(child));
      }
      else if (tag === 'minorUnit') {
        addProp(out, 'majorUnit', numValElm(child));
      }
      else if (tag === 'dispUnits') {
        addProp(out, 'dispUnits', readDispUnits(child, context));
      }
    }

    // specific to CatAx
    if (out.type === 'catAx') {
      // XXX: extends SerAx?

      if (tag === 'auto') {
        addProp(out, 'auto', boolValElm(child), false);
      }
      else if (tag === 'lblAlgn') {
        addProp(out, 'lblAlgn', strValElm<LblAlgn>(child));
      }
      else if (tag === 'lblOffset') {
        // 0-1000, defaults to "100%"
        addProp(out, 'lblOffset', xperValElm(child, 0, 1000, 100), 100);
      }
      else if (tag === 'tickLblSkip') {
        // 1-∞
        const n = numValElm(child);
        addProp(out, 'tickLblSkip', n < 1 ? null : n);
      }
      else if (tag === 'tickMarkSkip') {
        // 1-∞
        const n = numValElm(child);
        addProp(out, 'tickMarkSkip', n < 1 ? null : n);
      }
      else if (tag === 'noMultiLvlLbl') {
        addProp(out, 'noMultiLvlLbl', boolValElm(child), false);
      }
    }

    // specific to SerAx
    if (out.type === 'serAx') {
      if (tag === 'tickLblSkip') {
        // 1-∞
        const n = numValElm(child);
        addProp(out, 'tickLblSkip', n < 1 ? null : n);
      }
      else if (tag === 'tickMarkSkip') {
        // 1-∞
        const n = numValElm(child);
        addProp(out, 'tickMarkSkip', n < 1 ? null : n);
      }
    }

    // specific to DateAx
    if (out.type === 'dateAx') {
      if (tag === 'auto') {
        addProp(out, 'auto', boolValElm(child), false);
      }
      else if (tag === 'lblOffset') {
        // 0-1000, defaults to "100%"
        addProp(out, 'lblOffset', xperValElm(child, 0, 1000, 100), 100);
      }
      else if (tag === 'majorUnit') {
        addProp(out, 'majorUnit', numValElm(child));
      }
      else if (tag === 'minorUnit') {
        addProp(out, 'majorUnit', numValElm(child));
      }
      else if (tag === 'baseTimeUnit') {
        addProp(out, 'baseTimeUnit', strValElm<TimeUnit>(child, 'days'), 'days');
      }
      else if (tag === 'majorTimeUnit') {
        addProp(out, 'majorTimeUnit', strValElm<TimeUnit>(child, 'days'), 'days');
      }
      else if (tag === 'minorTimeUnit') {
        addProp(out, 'minorTimeUnit', strValElm<TimeUnit>(child, 'days'), 'days');
      }
    }

    // shared by all axes
    if (tag === 'axId') { // required
      // XXX: change type to str?
      out.axId = numValElm(child);
    }
    else if (tag === 'scaling') { // un-required
      addProp(out, 'scaling', readScaling(child));
    }
    else if (tag === 'axPos') { // required
      addProp(out, 'axPos', strValElm<AxPos>(child));
    }
    else if (tag === 'crossAx') { // required
      addProp(out, 'crossAx', numValElm(child));
    }
    else if (tag === 'delete') {
      addProp(out, 'delete', boolValElm(child), false);
    }
    else if (tag === 'majorGridlines') {
      addProp(out, 'majorGridlines', readShapeProperties(child, context));
    }
    else if (tag === 'minorGridlines') {
      addProp(out, 'minorGridlines', readShapeProperties(child, context));
    }
    else if (tag === 'spPr') {
      addProp(out, 'shape', readShapeProperties(child, context));
    }
    else if (tag === 'txPr') {
      // XXX: need a reader for TextProps
      addProp(out, 'textProps', readTextProps(child));
    }
    else if (tag === 'title') {
      addProp(out, 'title', readTitle(child, context));
    }
    else if (tag === 'majorTickMark') {
      addProp(out, 'majorTickMark', strValElm<TickMark>(child, 'cross'), 'cross');
    }
    else if (tag === 'minorTickMark') {
      addProp(out, 'minorTickMark', strValElm<TickMark>(child, 'cross'), 'cross');
    }
    else if (tag === 'tickLblPos') {
      addProp(out, 'tickLblPos', strValElm<TickLblPos>(child, 'nextTo'), 'nextTo');
    }
    else if (tag === 'crosses' || tag === 'crossesAt') {
      // property has been merged
      addProp(out, 'crosses',
        tag === 'crosses'
          ? strValElm<Crosses>(child)
          : numValElm(child));
    }
    else if (tag === 'numFmt') {
      addProp(out, 'numFmt', readNumFmt(child));
    }
  }

  // ensure required props are there
  if (out.axId && out.type && out.axPos && out.crossAx) {
    return out as (ValAx | DateAx | SerAx | CatAx);
  }
}
