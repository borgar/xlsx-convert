/**
 * Thrown when the file is not a valid XLSX file. Usually because
 * the zip file container has become corrupted.
 */
export class InvalidFileError extends Error {}
/**
 * Reading encrypted files is not supported. This error is thrown
 * when the converter encounters one.
 */
export class EncryptionError extends Error {}
/**
 * This error is throw when the XLSX file references a sheet that
 * is not found in the container.
 */
export class MissingSheetError extends Error {}
/**
 * Thrown if the converter encounters a cell data type it does not
 * support.
 */
export class UnsupportedError extends Error {}
