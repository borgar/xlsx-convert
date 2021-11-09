export default function unescape (str) {
  return str.replace(/_x([\da-f]{4})_/gi, (m, n) => String.fromCharCode(parseInt(n, 16)));
}
