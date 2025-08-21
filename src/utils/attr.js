/**
 * @param {import('@borgar/simple-xml').Element} node
 * @param {string} name
 * @param {string} [fallBack]
 * @return {string | null}
 */
export function attr (node, name, fallBack = null) {
  if (node.hasAttribute(name)) {
    return node.getAttribute(name);
  }
  return fallBack;
}

/**
 * @param {import('@borgar/simple-xml').Element} node
 * @param {string} name
 * @param {number} [fallBack]
 * @return {number | null}
 */
export function numAttr (node, name, fallBack = null) {
  const v = attr(node, name);
  return v == null ? fallBack : +v;
}

/**
 * @param {import('@borgar/simple-xml').Element} node
 * @param {string} name
 * @param {any} [fallBack]
 * @return {boolean | null}
 */
export function boolAttr (node, name, fallBack = null) {
  const v = attr(node, name, fallBack);
  return v == null ? fallBack : !!+v;
}
