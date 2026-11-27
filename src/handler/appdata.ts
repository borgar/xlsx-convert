import type { Document, Element } from '@borgar/simple-xml';
import type { Workbook } from '@jsfkit/types';
import type { ConversionContext } from '../ConversionContext.ts';
import { MISSING_WORKBOOK_META } from '../constants.ts';

// This doesn't exist as a standalone type in JSF, and Workbook['meta']['app'] can't be accessed
type AppMeta = {
  name?: string;
  version?: string;
  variant?: string;
  confidence?: number;
};

type MHandler = (elm: Element, meta: AppMeta, context: ConversionContext) => void;
const META_HANDLERS: Record<string, MHandler> = {
  Application: (elm, meta) => {
    const appText = elm.textContent || '';
    // Separate platform variant (e.g. "Macintosh") from the app name.
    // Known pattern: "Microsoft Macintosh Excel" -> app "Microsoft Excel", appVariant "Macintosh"
    const variantMatch = /^(Microsoft)\s+(Macintosh|Windows)\s+(Excel)$/i.exec(appText);
    if (variantMatch) {
      meta.name = `${variantMatch[1]} ${variantMatch[3]}`;
      meta.variant = variantMatch[2];
    }
    else {
      meta.name = appText;
    }
  },
  AppVersion: (elm, meta) => {
    const v = elm.textContent;
    meta.version = v;
  },
  Company: (elm, _, ctx) => {
    if (elm.textContent) {
      ctx.unsupported.add(MISSING_WORKBOOK_META);
    }
  },
  Manager: (elm, _, ctx) => {
    if (elm.textContent) {
      ctx.unsupported.add(MISSING_WORKBOOK_META);
    }
  },
  HyperlinkBase: (elm, _, ctx) => {
    if (elm.textContent) {
      ctx.unsupported.add(MISSING_WORKBOOK_META);
    }
  },
  // // int
  // DocSecurity: () => {},
  // // bool
  // HyperlinksChanged: () => {},
  // LinksUpToDate: () => {},
  // ScaleCrop: () => {},
  // SharedDoc: () => {},
  // // struct
  // HeadingPairs: () => {},
  // TitlesOfParts: () => {},
};

/**
 * Parse threaded comments from xl/threadedComments{n}.xml.
 *
 * @param dom Parsed XML document from xl/threadedComments{n}.xml
 */
export function handlerAppdata (dom: Document | null | undefined, context: ConversionContext): Workbook['meta'] | undefined {
  const appMeta: AppMeta = {};
  if (dom?.root) {
    for (const child of dom.root.children) {
      if (child.tagName in META_HANDLERS) {
        META_HANDLERS[child.tagName](child, appMeta, context);
      }
    }
    return { app: appMeta };
  }
  else if (context.isLikelyGSExport) {
    appMeta.name = 'Google Sheets';
    appMeta.confidence = 0.8;
    return { app: appMeta };
  }
}
