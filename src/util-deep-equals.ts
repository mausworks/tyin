import isObject from "./util-is-object";

/** An object that is either a plain array or plain object. */
type Indexed = { [key: string | number]: any };

/**
 * Checks if the given values are equal.
 *
 * Note: Only plain objects and arrays are compared recursively.
 * Classes and other objects are compared with `Object.is`.
 * @param left The left value to compare.
 * @param right The right value to compare.
 * @example
 * ```ts
 * // Both true:
 * deepEquals(
 *  { a: 1 },
 *  { a: 1 }
 * )
 * deepEquals(
 *  { a: 1, b: { c: 2 } },
 *  { a: 1, b: { c: 2 } }
 * )
 *
 * // Both false:
 * deepEquals(
 *  { a: 1 },
 *  { a: 2, b: 2 }
 * )
 * deepEquals(
 *  { a: 1, b: { c: [] } },
 *  { a: 1, b: { c: [] } }
 * )
 * ```
 */
const deepEquals = <T>(left: T, right: unknown): right is T => {
  if (Object.is(left, right)) return true;
  if (!isIndexed(left) || !isIndexed(right)) return false;
  if (!isSamePrototype(left, right)) return false;

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  if (leftKeys.length !== rightKeys.length) return false;

  for (const key of leftKeys) {
    if (!(key in right)) return false;
    if (!deepEquals(left[key], right[key])) return false;
  }

  return true;
};

const isIndexed = (value: unknown): value is Indexed =>
  Array.isArray(value) || isObject(value);

const isSamePrototype = <T>(left: T, right: unknown): right is T =>
  Object.getPrototypeOf(left) === Object.getPrototypeOf(right);

export default deepEquals;
