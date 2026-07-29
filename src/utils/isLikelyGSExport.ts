import type { ZipArchive } from '@borgar/zip';

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
 * Negative signals, each conclusive, checked in this order:
 *
 * 1. **`docProps/app.xml` present.** Excel and LibreOffice always write this
 *    file (containing `<Application>Microsoft Excel</Application>` or
 *    equivalent). Google Sheets never writes it. Validated against ~3,000 real
 *    XLSX files: 0 false negatives (no Google Sheets file writes app.xml),
 *    and the only "Google Sheets" files with app.xml were Excel-originated
 *    files uploaded to Google Sheets (which retain Excel's metadata and don't
 *    exhibit the `t="str"` error quirk).
 *
 * 2. **`docProps/core.xml` present.** Google Sheets omits this too, so it
 *    corroborates signal 1 without adding much on its own.
 *
 * 3. **An `xl/externalLinks/` part present.** Those parts cache the data behind
 *    a cross-workbook reference such as `[Book1.xlsx]Sheet1!A1`, and Google
 *    Sheets does not support such cross-workbook references. An Excel file
 *    uploaded to Google Sheets and exported again might have them, but that is
 *    already excluded by signal 1, since it keeps Excel's metadata.
 *
 * With none of them present, the file is taken to be a Google Sheets export. A
 * rare third-party-generated XLSX might trip none of them either; treating it
 * as Google Sheets is a safe false positive for this heuristic's purpose (the
 * `t="str"` error conversion is unlikely to cause harm on synthetic files).
 */
export function isLikelyGSExport (zip: ZipArchive): boolean {
  // The presence of docProps/app.xml is the strongest negative signal.
  // Every version of Excel and LibreOffice writes it; Google Sheets never does.
  if (zip.has('docProps/app.xml')) {
    return false;
  }
  // Google Sheets also omits docProps/core.xml. Checking both gives extra
  // confidence, but app.xml alone is sufficient — core.xml just corroborates.
  if (zip.has('docProps/core.xml')) {
    return false;
  }
  // External link parts are something Google Sheets has no way to produce.
  if (zip.files.some(name => name.toLowerCase().startsWith('xl/externallinks/'))) {
    return false;
  }
  return true;
}
