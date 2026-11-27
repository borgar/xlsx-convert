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

  it('returns strings without escapes unchanged', () => {
    expect(unescape('')).toBe('');
    expect(unescape('plain text')).toBe('plain text');
    expect(unescape('snake_case_name')).toBe('snake_case_name');
    expect(unescape('_x_')).toBe('_x_');
  });

  it('decodes escapes at the start and end of a string, and alone', () => {
    expect(unescape('_x0041_BC')).toBe('ABC');
    expect(unescape('AB_x0043_')).toBe('ABC');
    expect(unescape('_x0041_')).toBe('A');
  });

  it('decodes several escapes separated by text', () => {
    expect(unescape('_x0031_ and _x0032_')).toBe('1 and 2');
  });

  it('decodes control characters', () => {
    expect(unescape('_x0009_')).toBe('\t');
    expect(unescape('_x000d__x000a_')).toBe('\r\n');
    expect(unescape('_x0000_')).toBe('\u0000');
  });

  it('decodes _x005F_ alone to an underscore', () => {
    expect(unescape('_x005F_')).toBe('_');
    expect(unescape('_x005f_')).toBe('_');
  });

  it('combines a surrogate pair of escapes into one character', () => {
    expect(unescape('_xD83D__xDE00_')).toBe('😀');
  });

  it('leaves escapes with non-hex digits alone', () => {
    expect(unescape('_x00G1_')).toBe('_x00G1_');
    expect(unescape('_x 041_')).toBe('_x 041_');
    expect(unescape('_x-041_')).toBe('_x-041_');
  });

  it('leaves escapes with more than four hex digits alone', () => {
    expect(unescape('_x00041_')).toBe('_x00041_');
  });

  it('decodes an escape surrounded by extra underscores', () => {
    expect(unescape('__x0041__')).toBe('_A_');
  });

  it('decodes two adjacent _x005F_ escapes to two underscores', () => {
    expect(unescape('_x005F__x005F_')).toBe('__');
  });
});
