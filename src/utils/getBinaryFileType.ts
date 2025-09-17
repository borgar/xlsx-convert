const CFBF_HEAD = [ 0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1 ];
const ZIP_HEAD = [ 0x50, 0x4B, 0x03, 0x04 ];

export const ZIP = 1;
export const CFBF = 2;

export function getBinaryFileType (buffer: Buffer | ArrayBuffer): null | number {
  // detect PKZip
  if (
    buffer[0] === ZIP_HEAD[0] &&
    buffer[1] === ZIP_HEAD[1] &&
    buffer[2] === ZIP_HEAD[2] &&
    buffer[3] === ZIP_HEAD[3]) {
    return ZIP;
  }
  // detect CFBF (OLE Compound File)
  if (CFBF_HEAD.every((d, i) => buffer[i] === d)) {
    return CFBF;
  }
  return null;
}
