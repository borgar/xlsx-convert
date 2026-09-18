/**
 * Validate a string against enum values, optionally mapping it to a different spelling.
 * Returns the recognized or mapped value, otherwise `undefined`.
 */
export function parseEnum<T extends string> (
  value: string | null | undefined,
  allowed: ReadonlySet<T> | ReadonlyMap<string, T>,
): T | undefined {
  if (value == null) {
    return undefined;
  }
  if (allowed instanceof Set) {
    return allowed.has(value as T) ? (value as T) : undefined;
  }
  if (allowed instanceof Map) {
    return allowed.get(value);
  }
  throw new TypeError('Expected a Set or Map');
}
