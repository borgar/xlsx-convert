export function hasKeys (obj: object) {
  if (obj && typeof obj === 'object') {
    for (const _ in obj) return true;
  }
  return false;
}
