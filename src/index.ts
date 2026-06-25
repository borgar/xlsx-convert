import type { Workbook } from '@jsfkit/types';
import { convertBinary } from './convertBinary.ts';
import type { MdwResolver } from './utils/mdw.ts';

export { InvalidFileError, EncryptionError, MissingSheetError, UnsupportedError } from './errors.ts';

/** Convertion options */
export type ConversionOptions = {
  /**
   * Skip cells that are a part of merges.
   * @defaultValue true
   */
  skipMerged?: boolean;
  /**
   * Formulas are attached to cells rather than being included as a separate list.
   * @defaultValue false
   */
  cellFormulas?: boolean;
  /**
   * Preserve XLSX-internal prefixes in formula output instead of stripping them:
   * `_xlfn.`, `_xludf.`, `_xlws.` on function names, and `_xlpm.`, `_xlnm.` on
   * named references.
   * @defaultValue false
   */
  preservePrefixes?: boolean;
  /**
   * Image reading callback. All read images are passed through this callback if it is provided.
   * This is useful, for example, for extracting the images to disk.
   *
   * If the return value is a string, the value will be used in the images record on
   * the workbook instead of the standard data-URI conversion.
   */
  imageCallback?: (data?: ArrayBuffer, filename?: string) => Promise<string | void> | string | void
  /**
   * Warning callback. If provided, warnings are passed to this function; otherwise they are silently discarded.
   */
  warn?: (message: string) => void;
  /**
   * Resolve the Max Digit Width (in pixels) for the workbook's Normal font, used to convert column
   * widths from OOXML character units to pixels. Returning null/undefined defers to the built-in table
   * (Aptos Narrow, Calibri, Arial); unknown fonts then fall back to MDW 6 (and warn). Supply this to
   * size columns correctly for fonts outside the table.
   */
  resolveMdw?: MdwResolver;
};

export type { MdwResolver } from './utils/mdw.ts';

/**
 * Load and convert an XLSX file into a JSON format.
 *
 * The returned JSF structure contains most of the data from the original file, although some details
 * may be lost in the conversion process.
 *
 * @param filename Target filename to convert
 * @param options Conversion options
 * @param [options.skipMerged] Skip any redundant cells that are a part of merges.
 * @param [options.cellFormulas] Formulas are attached to cells rather than being included separately.
 * @return A JSON spreadsheet object.
 */
export async function convert (
  filename: string,
  options?: ConversionOptions,
): Promise<Workbook> {
  let fs;
  try {
    fs = await import('fs/promises');
  }
  // eslint-disable-next-line no-empty
  catch (_err) {}
  if (!fs) {
    throw new Error("'fs/promises' is not available, use convertBinary() instead");
  }
  return convertBinary(await fs.readFile(filename), filename, options);
}

export { convertCSV, type CSVConversionOptions } from './convertCSV.ts';
export { convertBinary } from './convertBinary.ts';
