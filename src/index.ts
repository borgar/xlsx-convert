import type { Workbook } from '@jsfkit/types';
import { convertBinary } from './convertBinary.ts';

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
   * Image reading callback. All read images are passed through this callback if it is provided.
   * This is useful, for example, for extracting the images to disk.
   *
   * If the return value is a string, the value will be used in the images record on
   * the workbook instead of the standard data-URI conversion.
   */
  imageCallback?: (data?: ArrayBuffer, filename?: string) => Promise<string | void> | string | void
  /**
   * Warning callback. If provided, warnings are passed to this function instead of `console.warn`.
   */
  warn?: (message: string) => void;
};

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

export { convertBinary } from './convertBinary.ts';
export { convertCSV, type CSVConversionOptions } from './convertCSV.ts';

export default convert;
