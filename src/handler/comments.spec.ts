import { describe, it, expect } from 'vitest';
import { parseXML } from '@borgar/simple-xml';
import { handlerComments } from './comments.ts';

describe('handlerComments', () => {
  it('decodes _xHHHH_ escapes in comment text', () => {
    const comments = handlerComments(parseXML(
      '<ThreadedComments>' +
        '<threadedComment ref="A1" id="{1}" personId="{P}">' +
          '<text>a_x000d_b _x005F_x0041_</text>' +
        '</threadedComment>' +
      '</ThreadedComments>',
    ));

    expect(comments[0].text).toBe('a\rb _x0041_');
  });
});
