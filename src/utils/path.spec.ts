import { describe, it, expect } from 'vitest';
import { pathDirname, pathBasename, pathJoin } from './path.js';

describe('pathDirname', () => {
  describe('basic functionality', () => {
    it('should return directory path for simple paths', () => {
      expect(pathDirname('foo/bar')).toBe('foo');
      expect(pathDirname('a/b/c')).toBe('a/b');
      expect(pathDirname('path/to/file.txt')).toBe('path/to');
    });

    it('should handle absolute paths', () => {
      expect(pathDirname('/foo/bar')).toBe('/foo');
      expect(pathDirname('/a/b/c')).toBe('/a/b');
      expect(pathDirname('/path/to/file.txt')).toBe('/path/to');
    });

    it('should return root for files in root directory', () => {
      expect(pathDirname('/foo')).toBe('/');
      expect(pathDirname('/file.txt')).toBe('/');
    });

    it('should handle nested directory structures', () => {
      expect(pathDirname('a/b/c/d/e')).toBe('a/b/c/d');
      expect(pathDirname('/var/log/system/app.log')).toBe('/var/log/system');
    });
  });

  describe('edge cases', () => {
    it('should return "." for paths without separators', () => {
      expect(pathDirname('foo')).toBe('.');
      expect(pathDirname('file.txt')).toBe('.');
      expect(pathDirname('a')).toBe('.');
    });

    it('should handle empty string', () => {
      expect(pathDirname('')).toBe('.');
    });

    it('should handle paths ending with slash', () => {
      expect(pathDirname('foo/bar/')).toBe('foo/bar');
      expect(pathDirname('/foo/bar/')).toBe('/foo/bar');
    });

    it('should handle root path', () => {
      expect(pathDirname('/')).toBe('/');
    });

    it('should handle multiple consecutive slashes', () => {
      expect(pathDirname('foo//bar')).toBe('foo/');
      expect(pathDirname('a///b/c')).toBe('a///b');
    });
  });
});

describe('pathBasename', () => {
  describe('basic functionality', () => {
    it('should return filename from simple paths', () => {
      expect(pathBasename('foo/bar')).toBe('bar');
      expect(pathBasename('a/b/c')).toBe('c');
      expect(pathBasename('path/to/file.txt')).toBe('file.txt');
    });

    it('should handle absolute paths', () => {
      expect(pathBasename('/foo/bar')).toBe('bar');
      expect(pathBasename('/a/b/c')).toBe('c');
      expect(pathBasename('/path/to/file.txt')).toBe('file.txt');
    });

    it('should handle files in root directory', () => {
      expect(pathBasename('/foo')).toBe('foo');
      expect(pathBasename('/file.txt')).toBe('file.txt');
    });

    it('should handle nested directory structures', () => {
      expect(pathBasename('a/b/c/d/e')).toBe('e');
      expect(pathBasename('/var/log/system/app.log')).toBe('app.log');
    });
  });

  describe('edge cases', () => {
    it('should return the same string for paths without separators', () => {
      expect(pathBasename('foo')).toBe('foo');
      expect(pathBasename('file.txt')).toBe('file.txt');
      expect(pathBasename('a')).toBe('a');
    });

    it('should handle empty string', () => {
      expect(pathBasename('')).toBe('');
    });

    it('should handle paths ending with slash', () => {
      expect(pathBasename('foo/bar/')).toBe('');
      expect(pathBasename('/foo/bar/')).toBe('');
      expect(pathBasename('path/')).toBe('');
    });

    it('should handle root path', () => {
      expect(pathBasename('/')).toBe('');
    });

    it('should handle multiple consecutive slashes', () => {
      expect(pathBasename('foo//bar')).toBe('bar');
      expect(pathBasename('a///b/c')).toBe('c');
      expect(pathBasename('foo//')).toBe('');
    });

    it('should handle special filenames', () => {
      expect(pathBasename('path/to/.hidden')).toBe('.hidden');
      expect(pathBasename('path/to/..config')).toBe('..config');
      expect(pathBasename('path/to/file.')).toBe('file.');
    });
  });
});

describe('pathJoin', () => {
  describe('basic functionality', () => {
    it('should join simple path segments', () => {
      expect(pathJoin('foo', 'bar')).toBe('foo/bar');
      expect(pathJoin('a', 'b', 'c')).toBe('a/b/c');
      expect(pathJoin('path', 'to', 'file.txt')).toBe('path/to/file.txt');
    });

    it('should handle single segment', () => {
      expect(pathJoin('foo')).toBe('foo');
      expect(pathJoin('file.txt')).toBe('file.txt');
    });

    it('should handle absolute paths', () => {
      expect(pathJoin('/foo', 'bar')).toBe('/foo/bar');
      expect(pathJoin('/a', 'b', 'c')).toBe('/a/b/c');
    });

    it('should handle multiple segments', () => {
      expect(pathJoin('a', 'b', 'c', 'd', 'e')).toBe('a/b/c/d/e');
    });
  });

  describe('path normalization', () => {
    it('should normalize single dots', () => {
      expect(pathJoin('foo', '.', 'bar')).toBe('foo/bar');
      expect(pathJoin('.', 'foo', 'bar')).toBe('foo/bar');
      expect(pathJoin('foo', 'bar', '.')).toBe('foo/bar');
    });

    it('should normalize double dots', () => {
      expect(pathJoin('foo', '..', 'bar')).toBe('bar');
      expect(pathJoin('foo', 'baz', '..', 'bar')).toBe('foo/bar');
      expect(pathJoin('a', 'b', '..', '..', 'c')).toBe('c');
    });

    it('should handle complex dot sequences', () => {
      expect(pathJoin('foo', '.', '..', 'bar')).toBe('bar');
      expect(pathJoin('a', 'b', '.', '..', 'c')).toBe('a/c');
      expect(pathJoin('.', '..', 'foo')).toBe('../foo');
    });

    it('should normalize consecutive slashes', () => {
      expect(pathJoin('foo/', '/bar')).toBe('foo/bar');
      expect(pathJoin('foo//', '//bar')).toBe('foo/bar');
      expect(pathJoin('a///', '///b')).toBe('a/b');
    });
  });

  describe('absolute path handling', () => {
    it('should preserve absolute paths', () => {
      expect(pathJoin('/foo', 'bar')).toBe('/foo/bar');
      expect(pathJoin('/', 'foo', 'bar')).toBe('/foo/bar');
    });

    it('should normalize dots in absolute paths', () => {
      expect(pathJoin('/foo', '.', 'bar')).toBe('/foo/bar');
      expect(pathJoin('/foo', '..', 'bar')).toBe('/bar');
      expect(pathJoin('/a', 'b', '..', 'c')).toBe('/a/c');
    });

    it('should handle going above root in absolute paths', () => {
      expect(pathJoin('/foo', '..')).toBe('/');
      expect(pathJoin('/foo', '..', '..')).toBe('/');
      expect(pathJoin('/', '..')).toBe('/');
    });
  });

  describe('relative path handling', () => {
    it('should handle relative paths with dots', () => {
      expect(pathJoin('..', 'foo')).toBe('../foo');
      expect(pathJoin('..', '..', 'foo')).toBe('../../foo');
      expect(pathJoin('foo', '..', '..')).toBe('..');
    });

    it('should handle mixed relative navigation', () => {
      expect(pathJoin('..', 'foo', '..', 'bar')).toBe('../bar');
      expect(pathJoin('foo', '..', 'bar', '..')).toBe('.');
    });
  });

  describe('edge cases', () => {
    it('should return "." for empty input', () => {
      expect(pathJoin()).toBe('.');
    });

    it('should handle empty strings', () => {
      expect(pathJoin('')).toBe('.');
      expect(pathJoin('', '')).toBe('/');
      expect(pathJoin('foo', '', 'bar')).toBe('foo/bar');
    });

    it('should handle only slashes', () => {
      expect(pathJoin('/')).toBe('/');
      expect(pathJoin('/', '/')).toBe('/');
    });

    it('should handle only dots', () => {
      expect(pathJoin('.')).toBe('.');
      expect(pathJoin('.', '.')).toBe('.');
      expect(pathJoin('..', '..')).toBe('../..');
    });

    it('should return root when everything cancels out', () => {
      expect(pathJoin('/foo', '..')).toBe('/');
      expect(pathJoin('/', 'foo', '..')).toBe('/');
    });

    it('should return "." when everything cancels out in relative paths', () => {
      expect(pathJoin('foo', '..')).toBe('.');
      expect(pathJoin('foo', 'bar', '..', '..')).toBe('.');
    });
  });

  describe('error handling', () => {
    it('should throw TypeError for non-string arguments', () => {
      expect(() => pathJoin('foo', null as any)).toThrow(TypeError);
      expect(() => pathJoin('foo', undefined as any)).toThrow(TypeError);
      expect(() => pathJoin('foo', 123 as any)).toThrow(TypeError);
      expect(() => pathJoin({} as any, 'foo')).toThrow(TypeError);
      expect(() => pathJoin([ 'foo' ] as any)).toThrow(TypeError);
    });

    it('should have correct error message', () => {
      expect(() => pathJoin('foo', null as any)).toThrow('Arguments to join must be strings');
    });
  });

  describe('compatibility with Node.js path behavior', () => {
    it('should behave like Node.js path.join for common cases', () => {
      // These test cases mirror Node.js path.join behavior
      expect(pathJoin('/foo', 'bar', 'baz/asdf', '..', '..')).toBe('/foo/bar');
      expect(() => pathJoin('foo', {} as any, 'bar')).toThrow();
      expect(pathJoin('foo/bar', '../baz')).toBe('foo/baz');
      expect(pathJoin('foo/bar/', '../baz')).toBe('foo/baz');
    });
  });
});
