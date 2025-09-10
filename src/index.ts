import type { JSFWorkbook } from './jsf-types.ts';
import { convertBinary } from './convertBinary.ts';

export type * from './jsf-types.ts';

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
};

/**
 * Load and convert an XLSX file into a JSON format.
 *
 * The returned JSF structure contains most of the data from the original file, although some details
 * may be lost in the conversion process.
 *
 * @param filename Target filename to convert
 * @param options Conversion options
 * @param [options.skipMerged] Skip any cells that are a part of merges.
 * @param [options.cellFormulas] Formulas are attached to cells rather than being included separately.
 * @return A JSON spreadsheet object.
 */
export async function convert (
  filename: string,
  options?: ConversionOptions,
): Promise<JSFWorkbook> {
  let fs;
  try {
    fs = await import('fs/promises');
  }
  // eslint-disable-next-line no-empty
  catch (_err) {}
  if (!fs) {
    throw new Error("'fs/promises' is not available, use convertBinary() instead");
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  return convertBinary(await fs.readFile(filename), filename, options);
}

export { convertBinary } from './convertBinary.ts';

export default convert;
