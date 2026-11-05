import { describe, it, expect } from 'vitest';
import { unescape } from './unescape.ts';

describe('unescape', () => {
  it('decodes an escape with hex digits of either case', () => {
    expect(unescape('A_x000a_B')).toBe('A\nB');
    expect(unescape('A_x000A_B')).toBe('A\nB');
  });

  it('leaves an escape with an uppercase X undecoded', () => {
    expect(unescape('_X0041_')).toBe('_X0041_');
  });

  it('decodes adjacent escapes', () => {
    expect(unescape('_x0041__x0042_')).toBe('AB');
  });

  it('consumes the closing underscore of an escape', () => {
    expect(unescape('_x0001_x0041_')).toBe('\u0001x0041_');
  });

  it('reads _x005F_ as a literal underscore that does not start an escape', () => {
    expect(unescape('_x005F_x0041_')).toBe('_x0041_');
    expect(unescape('My_x005f_x0041_Table')).toBe('My_x0041_Table');
  });

  it('leaves incomplete escapes alone', () => {
    expect(unescape('_x41_ _x004_ _x0041')).toBe('_x41_ _x004_ _x0041');
  });
});
