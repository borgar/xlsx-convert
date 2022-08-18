export default function attr (node, name, fallBack = null) {
  if (node.hasAttribute(name)) {
    return node.getAttribute(name);
  }
  return fallBack;
}

export const numAttr = (node, name) => {
  const v = attr(node, name, null);
  return v == null ? v : +v;
};

export const boolAttr = (node, name) => {
  const v = attr(node, name, null);
  return v == null ? v : !!+v;
};

