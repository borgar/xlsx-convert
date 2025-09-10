/* eslint-disable @typescript-eslint/no-unsafe-call */
export async function loadZip (archive: ArrayBuffer | Buffer) {
  let JSZip;
  // @ts-expect-error JSZip does not import in a browser
  if (typeof window !== 'undefined' && window.JSZip) {
    // @ts-expect-error TS doesn't like oldschool JS?
    JSZip = window.JSZip;
  }
  else {
    JSZip = (await import('jszip')).default;
  }

  if (!JSZip) {
    throw new Error('Unable to initialize JSZip');
  }

  const zip = await (new JSZip().loadAsync(archive));
  return {
    readFile: (name: string, mode: ('utf8' | 'binary') = 'binary') => {
      const normName = name.replace(/^\.\//g, '');
      const fd = zip.file(normName);
      return fd ? fd.async(mode == 'utf8' ? 'string' : 'arraybuffer') : null;
    },
  };
}
