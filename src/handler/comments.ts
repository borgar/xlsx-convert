import { Document } from '@borgar/simple-xml';
import { attr } from '../utils/attr.ts';
import { ConversionContext } from '../ConversionContext.ts';

export type Comment = {
  a: string;
  d: string;
  t: string;
};

export function handlerComments (dom: Document, context: ConversionContext): Record<string, Comment[]> {
  const persons = context.persons;
  const comments: Record<string, Comment[]> = {};

  dom.getElementsByTagName('threadedComment')
    .forEach(d => {
      const ref = attr(d, 'ref');
      if (!comments[ref]) {
        comments[ref] = [];
      }
      const personId = attr(d, 'personId');
      // wb.persons
      comments[ref].push({
        // author
        a: persons[personId] || '',
        d: new Date(Date.parse(attr(d, 'dT'))).toISOString(),
        // text
        t: d.getElementsByTagName('text')[0].textContent,
      });
    });

  // FIXME: while threads are discarded, comments should still be ordered

  return comments;
}
