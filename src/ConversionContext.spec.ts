import { describe, expect, test, vi } from 'vitest';
import { ConversionContext } from './ConversionContext.ts';

describe('ConversionContext', () => {
  describe('warn()', () => {
    test('calls the warn callback when provided in options', () => {
      const warnFn = vi.fn();
      const ctx = new ConversionContext();
      ctx.options = { warn: warnFn };
      ctx.warn('test warning');
      expect(warnFn).toHaveBeenCalledWith('test warning');
    });

    test('falls back to console.warn when no callback is provided', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const ctx = new ConversionContext();
      ctx.warn('fallback warning');
      expect(spy).toHaveBeenCalledWith('fallback warning');
      spy.mockRestore();
    });

    test('does not call console.warn when callback is provided', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const ctx = new ConversionContext();
      ctx.options = { warn: () => {} };
      ctx.warn('intercepted');
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
