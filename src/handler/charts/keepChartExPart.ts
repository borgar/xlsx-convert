import type { ConversionContext } from '../../ConversionContext.ts';
import { resolveNamedRange } from './readChartData.ts';

/** The content type of a ChartEx part, which a kept part's data URI is labeled with. */
export const CHARTEX_MIME = 'application/vnd.ms-office.chartex+xml';

const XML_ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'" };

function unescapeXml (text: string): string {
  return text.replace(/&(?:amp|lt|gt|quot|apos);/g, m => XML_ENTITIES[m]);
}

function escapeXml (text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Rewrite the data references of a ChartEx part's XML text from the hidden defined names Excel
 * writes (`_xlchart.v5.0`) to the ranges they stand for, so that the part doesn't depend on the
 * names. Only the text of each `cx:f` element changes: the rest of the part stays as it is, byte
 * for byte.
 *
 * @param xml The part's XML text
 * @param context The conversion context, which holds the workbook's defined names
 */
export function rewriteChartExFormulas (xml: string, context: ConversionContext): string {
  return xml.replace(/(<(?:\w+:)?f(?:\s[^>]*)?>)([^<]*)(<\/(?:\w+:)?f>)/g, (match, open, text, close) => {
    const name = unescapeXml(text.trim());
    if (!/^_xlchart\./i.test(name)) {
      return match;
    }
    return open + escapeXml(resolveNamedRange(name, context)) + close;
  });
}
