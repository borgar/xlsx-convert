import type { FileContainer } from './zip.ts';

/**
 * Heuristic to detect whether an XLSX file was likely exported from Google
 * Sheets rather than saved by Excel, LibreOffice, or another desktop app.
 *
 * This matters because Google Sheets encodes formula errors differently:
 * Excel uses `t="e"` on the cell element, while Google Sheets uses `t="str"`
 * with an error-looking cached value (e.g. `#NAME?`). The converter needs to
 * know the origin to avoid misinterpreting a legitimate string formula result
 * as an error.
 *
 * Signals checked:
 * - **No `docProps/app.xml`**: Excel and LibreOffice always write this file;
 *   Google Sheets does not.
 * - **No `xl/calcChain.xml`**: Excel writes a calculation chain; Google Sheets
 *   does not. (LibreOffice sometimes does, sometimes doesn't, so this is a
 *   weaker signal on its own.)
 */
export function isLikelyGoogleSheetsExport (zip: FileContainer): boolean {
  // The absence of docProps/app.xml is the strongest single signal.
  // Every version of Excel and LibreOffice writes it; Google Sheets never does.
  if (zip.hasFile('docProps/app.xml')) {
    return false;
  }
  // No app.xml — almost certainly Google Sheets (or a minimal synthetic file,
  // which is fine to treat the same way for this purpose).
  return true;
}
