import { type Document, parseXML } from '@borgar/simple-xml';
import { ZipArchive } from '@borgar/zip';
import { pathBasename, pathDirname, pathJoin } from './utils/path.ts';
import { FT_CFBF, FT_ZIP, getBinaryFileType } from './utils/getBinaryFileType.ts';
import { handlerRels, type Rel } from './handler/rels.ts';
import type { ConversionContext } from './ConversionContext.ts';
import { EncryptionError, InvalidFileError } from './errors.ts';

function toArrayBuffer (buffer: Buffer): ArrayBuffer {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  new Uint8Array(arrayBuffer).set(buffer);
  return arrayBuffer;
}

/**
 * A container for an XLSX file's zip archive that provides methods to read its parts.
 */
export class XlsxArchive {
  zip: ZipArchive;

  /**
   * @param buffer Buffer containing the XLSX file
   */
  constructor (buffer: Buffer | ArrayBuffer) {
    if (typeof Buffer !== 'undefined' && buffer instanceof Buffer) {
      buffer = toArrayBuffer(buffer);
    }
    if (!(buffer instanceof ArrayBuffer)) {
      throw new InvalidFileError('Input is not a valid binary');
    }

    const fileType = getBinaryFileType(buffer);
    if (fileType === FT_CFBF) {
      throw new EncryptionError('Input file is encrypted');
    }
    else if (fileType !== FT_ZIP) {
      throw new InvalidFileError('Input file type is unsupported');
    }

    try {
      this.zip = new ZipArchive(buffer);
    }
    catch (err) {
      throw new InvalidFileError('Input file type is corrupted or unsupported');
    }
  }

  /**
   * Read a file from the archive, falling back to a path without a doubled `xl/` prefix.
   */
  async #read<T> (path: string, reader: (path: string) => Promise<T | null | undefined>): Promise<T | null> {
    try {
      let fd = await reader(path);
      if (!fd && path.startsWith('xl/xl/')) {
        fd = await reader(path.slice(3));
      }
      return fd || null;
    }
    catch (err) {
      throw new InvalidFileError('Input file type is corrupted');
    }
  }

  /**
   * Read and parse an XML file from the archive.
   *
   * @param path Path of the file within the archive
   * @return The parsed document, or null if the file is missing or empty
   */
  async readXML (path: string): Promise<Document | null> {
    const fd = await this.#read(path, f => this.zip.readText(f));
    return fd ? parseXML(fd) : null;
  }

  /**
   * Read a binary file from the archive.
   *
   * @param path Path of the file within the archive
   * @return The file contents, or null if the file is missing
   */
  async readBinary (path: string) {
    return this.#read(path, f => this.zip.read(f));
  }

  /**
   * Read the relationships for a file in the archive.
   *
   * @param [path] Path of the file whose rels to read. Defaults to the package root.
   * @return A list of relationships
   */
  async readRels (path = ''): Promise<Rel[]> {
    const relsPath = pathJoin(pathDirname(path), '_rels', `${pathBasename(path)}.rels`);
    return handlerRels(await this.readXML(relsPath), path);
  }

  /**
   * Find a relationship of a given type, read its target, and run a handler over it.
   *
   * @param context The conversion context
   * @param type The relationship type to look for
   * @param handler The handler to run over the target document
   * @param [fallback] Value to return if no relationship of the type exists
   * @param [rels] Relationships to search. Defaults to `context.rels`.
   * @return The handler's return value, or the fallback
   */
  async readRel<T extends (dom: Document, context: ConversionContext) => any> (
    context: ConversionContext,
    type: string,
    handler: T,
    fallback: any = null,
    rels: Rel[] | null = null,
  ): Promise<ReturnType<T>> {
    const rel = (rels || context.rels).find(d => d.type === type);
    if (rel) {
      const dom = await this.readXML(rel.target);
      if (dom) {
        return handler(dom, context);
      }
      else {
        throw new ReferenceError('Invalid file reference: ' + rel.target);
      }
    }
    return fallback;
  }
}
