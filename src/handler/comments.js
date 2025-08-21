import { attr } from '../utils/attr.js';

/**
 * @typedef Comment
 * @prop {string} a
 * @prop {string} d
 * @prop {string} t
 */

/**
 * @param {import('@borgar/simple-xml').Document} dom
 * @param {import('../ConversionContext.js').ConversionContext} [context]
 * @returns {Record<string, Comment[]>}
 */
export function handlerComments (dom, context) {
  const persons = context.persons;
  /** @type {Record<string, Comment[]>} */
  const comments = {};

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
        t: d.getElementsByTagName('text')[0].textContent
      });
    });

  // FIXME: while threads are discarded, comments should still be ordered

  return comments;
}
