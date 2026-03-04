/**
 * Add a property to an object if it is not "redundant".
 *
 * `val` will be added as `obj[key]` if:
 * - It is not `null` or `undefined`
 * - It is not equal to `skip` (assuming that is present)
 *
 * @param obj The object to write to
 * @param key The property name to write as
 * @param val The value to write
 * @param skip Default value that should be skipped if encountered.
 * @returns True if a value was written, else a false.
 */
export function addProp<T extends Record<string, any>, K extends keyof T> (
  obj: T,
  key: K,
  val: T[K] | null | undefined,
  skip: T[K] | null = null,
): boolean {
  if (val == null) {
    return false;
  }
  if (skip === val) {
    return false;
  }
  obj[key] = val;
  return true;
}
