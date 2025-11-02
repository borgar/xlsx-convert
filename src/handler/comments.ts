import { Document } from '@borgar/simple-xml';
import { attr } from '../utils/attr.ts';
import { ConversionContext } from '../ConversionContext.ts';

export type Comment = {
  a: string;
  d: string;
  t: string;
};

export function handlerComments (dom: Document, context: ConversionContext): Map<string, Comment[]> {
  const persons = context.persons;
  const comments = new Map();

  dom.getElementsByTagName('threadedComment')
    .forEach(d => {
      const ref = attr(d, 'ref');
      if (!comments.has(ref)) {
        comments.set(ref, []);
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      comments.get(ref).push({
        // author
        a: persons[attr(d, 'personId')] || '',
        d: new Date(Date.parse(attr(d, 'dT'))).toISOString(),
        // text
        t: d.getElementsByTagName('text')[0].textContent,
      });
    });

  // FIXME: while threads are discarded, comments should still be ordered

  return comments;
}
