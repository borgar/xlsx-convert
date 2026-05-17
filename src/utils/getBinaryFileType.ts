const CFBF_HEAD = [ 0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1 ];
const ZIP_HEAD = [ 0x50, 0x4B, 0x03, 0x04 ];

export const FT_ZIP = 1;
export const FT_CFBF = 2;

export function getBinaryFileType (buffer: Buffer | ArrayBuffer): null | number {
  const head = new Uint8Array(buffer);
  // detect PKZip
  if (
    head[0] === ZIP_HEAD[0] &&
    head[1] === ZIP_HEAD[1] &&
    head[2] === ZIP_HEAD[2] &&
    head[3] === ZIP_HEAD[3]) {
    return FT_ZIP;
  }
  // detect CFBF (OLE Compound File)
  if (CFBF_HEAD.every((d, i) => head[i] === d)) {
    return FT_CFBF;
  }
  return null;
}
