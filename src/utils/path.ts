export function pathDirname (path: string): string {
  const end = path.lastIndexOf('/');
  if (path.length && end >= 0) {
    return (end === 0)
      ? '/'
      : path.slice(0, end);
  }
  return '.';
}

export function pathBasename (path: string): string {
  if (path) {
    const end = path.lastIndexOf('/');
    if (end > -1) {
      return path.slice(end + 1);
    }
  }
  return path;
}

function normalizeArray (parts: string[], allowAboveRoot: boolean): string[] {
  const res: string[] = [];
  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (res.length && res[res.length - 1] !== '..') {
        res.pop();
      }
      else if (allowAboveRoot) {
        res.push('..');
      }
    }
    else {
      res.push(part);
    }
  }
  return res;
}

export function pathJoin (...paths: string[]): string {
  for (const segment of paths) {
    if (typeof segment !== 'string') {
      throw new TypeError('Arguments to join must be strings');
    }
  }

  const joined = paths.join('/');
  if (!joined) return '.';

  const isAbsolute = joined.startsWith('/');
  const parts = joined.split('/').filter(Boolean);
  const normalized = normalizeArray(parts, !isAbsolute);

  let result = normalized.join('/');
  if (isAbsolute) {
    result = '/' + result;
  }

  return result || (isAbsolute ? '/' : '.');
}
