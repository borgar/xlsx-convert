import type { Document } from '@borgar/simple-xml';
import type { Workbook } from '@jsfkit/types';
import type { ConversionContext } from '../ConversionContext.ts';

// This doesn't exist as a standalone type in JSF, and Workbook['meta']['app'] can't be accessed
type AppMeta = {
  name?: string;
  version?: string;
  variant?: string;
  confidence?: number;
};

/**
 * Parse threaded comments from xl/threadedComments{n}.xml.
 *
 * @param dom Parsed XML document from xl/threadedComments{n}.xml
 */
export function handlerAppdata (dom: Document | null | undefined, context: ConversionContext): Workbook['meta'] | undefined {
  const appMeta: AppMeta = {};
  if (dom) {
    const appEl = dom.querySelector('Application');
    if (appEl) {
      const appText = appEl.textContent || '';
      // Separate platform variant (e.g. "Macintosh") from the app name.
      // Known pattern: "Microsoft Macintosh Excel" -> app "Microsoft Excel", appVariant "Macintosh"
      const variantMatch = /^(Microsoft)\s+(Macintosh|Windows)\s+(Excel)$/i.exec(appText);
      if (variantMatch) {
        appMeta.name = `${variantMatch[1]} ${variantMatch[3]}`;
        appMeta.variant = variantMatch[2];
      }
      else {
        appMeta.name = appText;
      }
    }
    const versionEl = dom.getElementsByTagName('AppVersion')[0];
    if (versionEl?.textContent) {
      appMeta.version = versionEl.textContent;
    }
    return { app: appMeta };
  }
  else if (context.isLikelyGSExport) {
    appMeta.name = 'Google Sheets';
    appMeta.confidence = 0.8;
    return { app: appMeta };
  }
}
