import { describe, it, expect } from 'vitest';
import { parseXML } from '@borgar/simple-xml';
import { handlerNotes } from './notes.ts';
import { ConversionContext } from '../ConversionContext.ts';

describe('handlerNotes', () => {
  it('decodes _xHHHH_ escapes in note text and author names', () => {
    const notes = handlerNotes(parseXML(
      '<comments>' +
        '<authors><author>A_x0041_</author></authors>' +
        '<commentList>' +
          '<comment ref="A1" authorId="0"><text><t>x_x000d__x000a_y _x005F_x0041_</t></text></comment>' +
        '</commentList>' +
      '</comments>',
    ), new ConversionContext());

    expect(notes).toEqual([ { ref: 'A1', author: 'AA', text: 'x\r\ny _x0041_' } ]);
  });
});
