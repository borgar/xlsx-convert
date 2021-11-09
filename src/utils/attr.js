export default function attr (node, name, fallBack = null) {
  if (node.hasAttribute(name)) {
    return node.getAttribute(name);
  }
  return fallBack;
}
