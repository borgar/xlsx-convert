// eslint-disable-next-line no-control-regex
const reDisallowed = /[\\/:*?"<>|\u0000-\u001f]/g;
const MAX_LEN = 255; // incl. extension

/**
 * Decode URL escapes, such as `%20`, without throwing on malformed input. Unlike
 * `decodeURIComponent`, this keeps a stray `%` or an invalid UTF-8 sequence as-is
 * and decodes the rest of the string.
 */
function decodeEscapes (str: string): string {
  try {
    return decodeURIComponent(str);
  }
  catch {
    return str.replace(/(?:%[0-9a-f]{2})+/gi, (run: string) => {
      const escapes = run.match(/%[0-9a-f]{2}/gi) ?? [];
      let out = '';
      let i = 0;
      while (i < escapes.length) {
        let decoded = false;
        for (let n = Math.min(4, escapes.length - i); n > 0 && !decoded; n--) {
          try {
            out += decodeURIComponent(escapes.slice(i, i + n).join(''));
            i += n;
            decoded = true;
          }
          catch {
            // try a shorter sequence...
          }
        }
        if (!decoded) {
          out += escapes[i];
          i++;
        }
      }
      return out;
    });
  }
}

/**
 * Turn a file path or URL into a workbook name that is safe to use as a filename.
 *
 * The function:
 *
 * 1. Strips any directory part, splitting on both `/` and `\`.
 * 2. Normalizes the name to Unicode NFC and decodes URL escapes, such as `%20`.
 * 3. Optionally removes characters that Windows doesn't allow in filenames: `\ / : * ? " < > |`
 *    and control characters.
 * 4. Shortens names longer than 255 characters, including the extension, and keeps the extension.
 * 5. Returns a null string for names that Windows reserves, such as `CON.xlsx` or `LPT1.xlsm`,
 *    and for names that are only an extension, such as `.xlsx`.
 *
 * @param name A file name, path, or URL
 * @param [stripIllegal] Whether to remove characters that aren't allowed in filenames. Defaults
 *   to `true`.
 * @return The cleaned name, or a null if no usable name remains.
 */
export function cleanWorkbookName (name: string, stripIllegal = true): string | null {
  let out = '';

  if (name) {
    const end0 = name.lastIndexOf('/');
    const end1 = name.lastIndexOf('\\');
    const end = Math.max(end0, end1);
    if (end > -1) {
      out = name.slice(end + 1);
    }
    else {
      out = name;
    }

    out = decodeEscapes(out.normalize());

    if (stripIllegal) {
      out = out.replace(reDisallowed, '');
    }

    // name must be no longer than 255 characters, including the extension
    if (out.length > MAX_LEN) {
      const i = out.lastIndexOf('.');
      const ext = i > -1 ? out.slice(i) : '';
      out = out.slice(0, MAX_LEN - 5).trim() + ext;
    }

    // Windows prohibits names such as CON, PRN, AUX, NUL, COM1–COM9, and LPT1–LPT9, even with an .xlsx extension.
    if (/^\s*\.xls.$/i.test(out) || /^(CON|PRN|AUX|NUL|COM\d|LPT\d)(\..*)?$/i.test(out)) {
      return null;
    }
  }

  return out || null;
}
