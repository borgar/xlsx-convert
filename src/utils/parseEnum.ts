/**
 * Validate a string against a set of allowed enum values.
 * Returns the value narrowed to `T` if it's in the set, otherwise `undefined`.
 */
export function parseEnum<T extends string> (
  value: string | null | undefined,
  allowed: ReadonlySet<T>,
): T | undefined {
  if (value == null) {
    return undefined;
  }
  return allowed.has(value as T) ? (value as T) : undefined;
}
