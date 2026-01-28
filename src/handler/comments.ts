import type { Document } from '@borgar/simple-xml';
import type { MentionTextRun, HyperlinkTextRun, ThreadedComment } from '@jsfkit/types';
import { attr } from '../utils/attr.ts';

/**
 * Parse threaded comments from xl/threadedComments{n}.xml.
 *
 * @param dom Parsed XML document from xl/threadedComments{n}.xml
 */
export function handlerComments (dom: Document): ThreadedComment[] {
  const comments: ThreadedComment[] = [];

  dom.getElementsByTagName('threadedComment')
    .forEach(node => {
      const id = attr(node, 'id');
      const ref = attr(node, 'ref');
      const personId = attr(node, 'personId');
      const dT = attr(node, 'dT');

      // Short-circuit for invalid comment.
      if (!id || !ref || !personId) return;

      const textNode = node.getElementsByTagName('text')[0];
      const text = textNode?.textContent || '';

      const comment: ThreadedComment = {
        id,
        ref,
        personId,
        text,
      };

      // Add the time of the comment if there is one.
      if (dT) {
        const timestamp = Date.parse(dT);
        if (!Number.isNaN(timestamp)) {
          comment.datetime = new Date(timestamp).toISOString();
        }
      }

      // A parent id means this is a threaded reply to an earlier comment.
      const parentId = attr(node, 'parentId');
      if (parentId) {
        comment.parentId = parentId;
      }

      // Excel uses the "done" flag to indicate whether a thread is resolved.
      const done = attr(node, 'done');
      if (done === '1' || done === 'true') {
        comment.resolved = true;
      }

      // Mentions are parts of comment text that provide references to people.
      const runs: (MentionTextRun | HyperlinkTextRun)[] = [];
      node.querySelectorAll('mentions > mention')
        .forEach(mentionNode => {
          const mentionPersonId = attr(mentionNode, 'mentionpersonId');
          const startIndex = attr(mentionNode, 'startIndex');
          const length = attr(mentionNode, 'length');

          // Skip mentions with invalid data (all fields required).
          if (!mentionPersonId || !startIndex || !length) return;

          const start = parseInt(startIndex, 10);
          const len = parseInt(length, 10);

          if (Number.isNaN(start) || Number.isNaN(len)) return;

          runs.push({
            type: 'mention',
            personId: mentionPersonId,
            start: start,
            end: start + len,
          });
        });

      // Hyperlinks. From an extension to threaded comments, represents text in the comment that
      // should be a clickable link.
      // <https://learn.microsoft.com/openspecs/office_standards/ms-xlsx/6b0fef4e-008b-44de-b8ae-b16b3ffcd0fe>
      const extLst = node.getElementsByTagName('extLst')[0];
      if (extLst) {
        const ext = extLst.children.find(e => attr(e, 'uri') === '{F7C98A9C-CBB3-438F-8F68-D28B6AF4A901}');
        if (ext) {
          ext.getElementsByTagName('hyperlink')
            .forEach(hyperlinkNode => {
              const startIndex = attr(hyperlinkNode, 'startIndex');
              const length = attr(hyperlinkNode, 'length');
              const url = attr(hyperlinkNode, 'url');

              if (startIndex && length && url) {
                const start = parseInt(startIndex, 10);
                const len = parseInt(length, 10);
                if (!Number.isNaN(start) && !Number.isNaN(len)) {
                  runs.push({
                    type: 'hyperlink',
                    url: url,
                    start: start,
                    end: start + len,
                  });
                }
              }
            });
        }
      }
      if (runs.length > 0) {
        comment.runs = runs;
      }

      comments.push(comment);
    });

  return comments;
}
