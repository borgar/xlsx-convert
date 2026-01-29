import type { Document } from '@borgar/simple-xml';
import type { Note } from '@jsfkit/types';
import { attr, numAttr } from '../utils/attr.ts';

/**
 * Parse notes from xl/comments{n}.xml.
 *
 * Originally known as comments and since replaced by threaded comments.
 *
 * TODO: Currently rich text and the underlying VML drawing object are discarded during import.
 *
 * @param dom Parsed XML document from xl/comments{n}.xml
 */
export function handlerNotes (dom: Document): Note[] {
  const notes: Note[] = [];

  const authors: string[] = [];
  dom.querySelectorAll('authors > author')
    .forEach(author => {
      authors.push(author.textContent || '');
    });

  dom.querySelectorAll('commentList > comment')
    .forEach(commentNode => {
      const ref = attr(commentNode, 'ref');
      if (!ref) return;

      const authorId = numAttr(commentNode, 'authorId');
      const author = authors[authorId] || '';

      // For backwards-compatibility, Excel duplicates threaded comments as notes. They have an
      // author name in the form "tc={GUID}". Skip them during import.
      if (author.startsWith('tc={')) return;

      // Extract text content from <text> element. Text may be in <text><t> or <text><r><t> (rich
      // text runs). All the rich text is discarded, only the plain text is stored.
      const textNodes = commentNode.querySelectorAll('text t');
      const text = Array.from(textNodes)
        .map(t => t.textContent || '')
        .join('');

      notes.push({ ref, author, text });
    });

  return notes;
}
