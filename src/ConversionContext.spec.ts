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

    test('silent when no callback is provided', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const ctx = new ConversionContext();
      ctx.warn('should be swallowed');
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
