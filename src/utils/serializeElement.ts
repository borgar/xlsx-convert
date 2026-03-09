import type { Element } from '@borgar/simple-xml';

const ESC: Record<string, string> = {
  '"': '&quot;',
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
};

function escAttr (s: string): string {
  return s.replace(/[&<>"]/g, m => ESC[m]);
}

function escText (s: string): string {
  return s.replace(/[&<>]/g, m => ESC[m]);
}

/**
 * Serialize an Element to compact XML, preserving namespace prefixes (using `fullName`)
 * and namespace declaration attributes. Unlike `simple-xml`'s built-in `toString()` which
 * uses `tagName` (dropping the prefix), this function preserves the full qualified name.
 *
 * Note: text/CDATA nodes are emitted before child elements within each level, so mixed
 * content (`<a>text<b/>more</a>`) is reordered to `<a>textmore<b/></a>`. This is acceptable
 * for the OOXML `<ext>` elements this function targets, which don't use mixed content.
 */
export function serializeElement (el: Element): string {
  const tag = el.fullName;
  let attrs = '';
  for (const [ key, val ] of Object.entries(el.attr)) {
    attrs += ` ${key}="${escAttr(val)}"`;
  }
  const children = el.children;
  const textContent = el.childNodes
    .filter(n => n.nodeType === 3 || n.nodeType === 4) // TEXT_NODE or CDATA_SECTION_NODE
    .map(n => n.textContent)
    .join('');
  if (children.length === 0 && !textContent) {
    return `<${tag}${attrs}/>`;
  }
  let content = escText(textContent);
  for (const child of children) {
    content += serializeElement(child);
  }
  return `<${tag}${attrs}>${content}</${tag}>`;
}
