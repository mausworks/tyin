/** An object that is not null, not an array, and not a class. */
export type PlainObject = { [key: string]: any };

/**
 * Checks if the given value is a plain object;
 * not null, not an array, not a class.
 * @param value The value to check.
 * @example
 * ```ts
 * // Both true:
 * isObject({});
 * isObject(Object.create(null));
 *
 * // Both false:
 * isObject([]);
 * isObject(new Event());
 * ```
 */
const isObject = (value: unknown): value is PlainObject =>
  Boolean(value) &&
  typeof value === "object" &&
  hasPlainObjectPrototype(Object.getPrototypeOf(value));

const hasPlainObjectPrototype = (prototype: object) =>
  prototype === Object.prototype || prototype === null;

export default isObject;
