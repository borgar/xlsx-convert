export function arrayBufferToDataUri (buf: ArrayBuffer | Buffer, mime: string): Promise<string> {
  // Node.js: Convert ArrayBuffer to Buffer if needed
  let buffer: Buffer;
  if (typeof Buffer !== 'undefined' && buf instanceof ArrayBuffer) {
    buffer = Buffer.from(buf);
  }
  else if (typeof Buffer !== 'undefined' && buf instanceof Buffer) {
    buffer = buf;
  }
  // Browser
  else if (typeof FileReader !== 'undefined' && buf instanceof ArrayBuffer) {
    const blob = new Blob([ buf ], { type: mime });
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }
  else {
    return Promise.reject(new Error("Can't convert binary."));
  }
  // Node.js: Create data URI
  const base64 = buffer.toString('base64');
  return Promise.resolve(`data:${mime};base64,${base64}`);
}
