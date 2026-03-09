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
 * Signals checked (in order):
 *
 * 1. **`docProps/app.xml` present** → not Google Sheets. Excel and LibreOffice
 *    always write this file (containing `<Application>Microsoft Excel</Application>`
 *    or equivalent). Google Sheets never writes it. Validated against ~3,000 real
 *    XLSX files: 0 false negatives (no Google Sheets file writes app.xml),
 *    and the only "Google Sheets" files with app.xml were Excel-originated files
 *    uploaded to Google Sheets (which retain Excel's metadata and don't exhibit
 *    the `t="str"` error quirk).
 *
 * 2. **Neither `docProps/app.xml` nor `docProps/core.xml`** → likely Google
 *    Sheets. Google Sheets writes neither. A rare third-party-generated XLSX
 *    might also lack both; treating it as Google Sheets is a safe false
 *    positive for this heuristic's purpose (the `t="str"` error conversion
 *    is unlikely to cause harm on synthetic files).
 */
export function isLikelyGSExport (zip: FileContainer): boolean {
  // The presence of docProps/app.xml is the strongest negative signal.
  // Every version of Excel and LibreOffice writes it; Google Sheets never does.
  if (zip.hasFile('docProps/app.xml')) {
    return false;
  }
  // Google Sheets also omits docProps/core.xml. Checking both gives extra
  // confidence, but app.xml alone is sufficient — core.xml just corroborates.
  if (zip.hasFile('docProps/core.xml')) {
    return false;
  }
  return true;
}
