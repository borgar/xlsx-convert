import { inflateRaw as inflateJS } from 'pako';

export type FileContainer = {
  readFile (name: string, mode: 'utf8'): Promise<string> | null;
  readFile (name: string, mode?: 'binary'): Promise<ArrayBuffer> | null;
};

type MainHead = {
  volumeEntries: number,
  totalEntries: number,
  size: number,
  offset: number,
  commentLength: number,
};

export type ArchEntry = {
  name: string,
  headerSize: number,
  filenameLength: number,
  extraLength: number,
  commentLength: number,
  versionMadeBy: number,
  version: number,
  flags: number,
  method: number,
  mtime: number,
  crc: number,
  compressedSize: number,
  originalSize: number,
  diskStart: number,
  iattr: number,
  attr: number,
  offset: number,
};

type LocEntry = {
  version: number,
  flags: number,
  method: number,
  mtime: number,
  crc: number,
  compressedSize: number,
  originalSize: number,
  filenameLength: number,
  extraLength: number,
};

type Inflater = (data: ArrayBuffer) => (
  Promise<ArrayBuffer>
);

const PK12 = 0x02014b50; // "PK\001\002"
const PK34 = 0x04034b50; // "PK\003\004"
const PK56 = 0x06054b50; // "PK\005\006"
const PK66 = 0x06064b50; // "PK\006\006"
const PK67 = 0x07064b50; // "PK\006\007"

// this isn't going to yield a 64bit number, but likely will be enough
function readBigUInt64LE (buffer: DataView<ArrayBuffer>, index: number) {
  // const slice = Buffer.from(buffer.slice(index, index + 8));
  // slice.swap64();
  // return parseInt(`0x${slice.toString('hex')}`);
  return 0;
}

function loadMainHeader (data: DataView<ArrayBuffer>): MainHead {
  // data should be 22 bytes and start with "PK 05 06"
  // or be 56+ bytes and start with "PK 06 06" for Zip64
  if (data.byteLength === 22 && data.getUint32(0, true) === PK56) {
    return {
      volumeEntries: data.getUint16(8, true),
      totalEntries: data.getUint16(10, true),
      size: data.getUint32(12, true),
      offset: data.getUint32(16, true),
      commentLength: data.getUint16(20, true),
    };
  }
  else if (data.byteLength >= 56 && data.getUint32(0, true) === PK66) {
    return {
      volumeEntries: readBigUInt64LE(data, 24),
      totalEntries: readBigUInt64LE(data, 32),
      size: readBigUInt64LE(data, 4),
      offset: readBigUInt64LE(data, 48),
      commentLength: 0,
    };
  }
  throw new Error('Invalid main header');
}

function loadEntryHeader (data: DataView<ArrayBuffer>): ArchEntry {
  if (data.byteLength !== 46 || data.getUint32(0, true) !== PK12) {
    throw new Error('Invalid entry header');
  }
  return {
    versionMadeBy: data.getUint16(4, true),
    version: data.getUint16(6, true),
    flags: data.getUint16(8, true),
    method: data.getUint16(10, true),
    mtime: data.getUint32(12, true),
    crc: data.getUint32(16, true),
    compressedSize: data.getUint32(20, true),
    originalSize: data.getUint32(24, true),
    filenameLength: data.getUint16(28, true),
    extraLength: data.getUint16(30, true),
    commentLength: data.getUint16(32, true),
    diskStart: data.getUint16(34, true),
    iattr: data.getUint16(36, true),
    attr: data.getUint32(38, true),
    offset: data.getUint32(42, true),
    headerSize: 0,
    name: '',
  };
}

function loadLocalHeader (data: DataView<ArrayBuffer>): LocEntry {
  if (data.byteLength !== 30 || data.getUint32(0, true) !== PK34) {
    throw new Error('Invalid local header');
  }
  return {
    version: data.getUint16(4, true),
    flags: data.getUint16(6, true),
    method: data.getUint16(8, true),
    mtime: data.getUint32(10, true),
    crc: data.getUint32(14, true),
    compressedSize: data.getUint32(18, true),
    originalSize: data.getUint32(22, true),
    filenameLength: data.getUint16(26, true),
    extraLength: data.getUint16(28, true),
  };
}

export function zipIndex (data: ArrayBuffer): Record<string, ArchEntry> {
  const entryTable: Record<string, ArchEntry> = {};
  const dataView = new DataView(data);

  let endStart = dataView.byteLength;
  let endOffset = -1;

  let i = dataView.byteLength - 22;
  const max = Math.max(0, i - 0xffff);
  let n = max;
  for (i; i >= n; i--) {
    // is there a faster way to jump to next P?
    if (dataView.getInt8(i) !== 0x50) { // is 'P'
      continue;
    }
    // if (dataView.readUInt32LE(i) === PK56) {
    if (dataView.getUint32(i, true) === PK56) {
      endOffset = i;
      endStart = i + 22;
      n = i - 20;
      continue;
    }
    if (dataView.getUint32(i, true) === PK67) {
      n = max;
      continue;
    }
    if (dataView.getUint32(i, true) === PK66) {
      endOffset = i;
      endStart = i + readBigUInt64LE(dataView, i + 4) + 12;
      break;
    }
  }

  if (endOffset === -1) {
    throw new Error('Invalid archive format');
  }

  // const mainHeader = loadMainHeader(dataView.slice(endOffset, endStart));
  const mainHeader = loadMainHeader(new DataView(data, endOffset, endStart - endOffset));
  if (mainHeader.volumeEntries > (dataView.byteLength - mainHeader.offset) / 46) {
    throw new Error('Disk entry too large');
  }

  const entriesLength = mainHeader.volumeEntries;
  let index = mainHeader.offset; // offset of first CEN header

  for (i = 0; i < entriesLength; i++) {
    const entry = loadEntryHeader(new DataView(data, index, 46));
    const fnData = data.slice(index + 46, index + 46 + (entry.filenameLength || 0));
    entry.name = new TextDecoder().decode(fnData);
    index += 46 + entry.filenameLength + entry.extraLength + entry.commentLength;
    entryTable[entry.name] = entry;
  }

  return entryTable;
}

let inflate = inflateJS;
async function setUpInflate (allowZlib = false, allowStreams = false) {
  // prefer DecompressionStream if we have it
  if (allowStreams && typeof DecompressionStream !== 'undefined' && typeof Response !== 'undefined') {
    inflate = async function inflateBrowser (data: ArrayBuffer) {
      const ds = new DecompressionStream('deflate-raw');
      const input = new Response(data).body;
      const outputStream = input.pipeThrough(ds);
      const resp = new Response(outputStream);
      return resp.arrayBuffer();
    };
  }
  // in node/deno/bun we can have access directly to zlib
  if (allowZlib) {
    try {
      const zlib = await import('node:zlib');
      inflate = function inflateNode (data: ArrayBuffer) {
        return new Promise((resolve, reject) => {
          zlib.inflateRaw(data, (error: Error | null, result: Buffer) => {
            return error ? reject(error) : resolve(result);
          });
        });
      };
    }
    catch (err) {
      // zlip is not available
    }
  }
  // fallback to using pako, which is a pure JS zlib implementation
  // return inflateJS;
}

setUpInflate(true, true).catch(() => {
  // ignore errors
});

export function loadZip (archive: ArrayBuffer): FileContainer {
  const index: Record<string, ArchEntry> = zipIndex(archive);
  return {
    readFile: async (name: string, mode = 'binary') => {
      const normName = name.replace(/^\.\//g, '');
      const fd = index[normName];
      if (!fd) {
        return null;
      }
      const { offset, compressedSize } = fd;
      const hd = loadLocalHeader(new DataView(archive, offset, 30));
      const dataOffset = offset + 30 + hd.filenameLength + hd.extraLength;
      let uncompressed;
      if (fd.method === 8) {
        uncompressed = await inflate(
          archive.slice(dataOffset, dataOffset + compressedSize),
        );
      }
      else if (fd.method === 0) {
        uncompressed = archive.slice(dataOffset, dataOffset + compressedSize);
      }
      else {
        throw new Error('Unsupported compression method: ' + fd.method);
      }
      return mode == 'utf8'
        ? new TextDecoder().decode(uncompressed)
        : uncompressed;
    },
  };
}
