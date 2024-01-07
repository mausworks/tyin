export type Pruned<T> = {
  [K in keyof T as T[K] extends undefined ? never : K]: T[K];
};

/**
 * Returns a new object with all properties that are `undefined` removed.
 * @param object The object to prune.
 * @example
 * ```ts
 * prune({ a: 1, b: undefined }) // -> { a: 1 }
 * ```
 */
const prune = <T extends object>(object: T): Pruned<T> =>
  Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined)
  ) as Pruned<T>;

export default prune;
