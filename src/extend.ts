/**
 * A function that receives a host object,
 * and returns an object with additional
 * properties that should be added to said object.
 *
 * @param host The object to extend.
 */
export type Plugin<H extends object, P = void> = (host: H) => P;

/** An object that can be extended through plugins. */
export type Extensible<T extends object> = T & {
  /**
   * Extends the object with additional properties, and returns a new extensible object.
   * @param plugin A function that receives the object and returns additional properties.
   */
  with: <P>(plugin: Plugin<T, P>) => Extensible<T & P>;
  /**
   * Removes the `with` (and `seal`) method,
   * allowing no further plugins to be added.
   *
   * 🦭
   */
  seal: () => T;
};

/** Removes the `with` and `seal` methods. */
export type Sealed<H> = H extends Extensible<infer T> ? T : H;

/**
 * Removes the `with` and `seal` methods,
 * and makes the object immutable.
 *
 * Note: The host object is mutated.
 * @param host The object to seal.
 */
function sealExtensible<H>(host: H): Sealed<H> {
  delete (host as any).with;
  delete (host as any).seal;

  return host as Sealed<H>;
}

/**
 * Returns a new object that can be extended through plugins.
 * @param host The object to make extensible.
 *
 * @example
 * ```ts
 * extend({ a: 1 })  // { a: 1, with: ..., seal: ... }
 *   .with({ b: 2 }) // { a: 1, b: 2, with: ..., seal: ... }
 *   .with({ b: 3 }) // { a: 1, b: 3, with: ..., seal: ... }
 *   .seal();        // { a: 1, b: 3 }
 * ```
 */
export default function extend<T extends object>(host: T): Extensible<T> {
  const add = <P>(plugin: Plugin<T, P>) =>
    extend(Object.assign(host, plugin(host)));
  const seal = () => sealExtensible(host) as T;

  return Object.assign(host, { with: add, seal });
}
