/**
 * A function that receives an object,
 * and returns an object with additional
 * properties that should be added to said object.
 *
 * @param host The object to extend.
 */
export type Plugin<T extends object, P = void> = (host: T) => P;

/** An object that can be extended through plugins. */
export type Extensible<T extends object> = T & {
  /**
   * Returns a copy of this extensible object with the properties from the plugin added.
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
export type Sealed<T> = T extends Extensible<infer T> ? T : T;

/**
 * Removes the `with` and `seal` methods from the host object.
 *
 * Note: The host object is mutated.
 * @param host The object to seal.
 */
function sealExtensible<T>(host: T): Sealed<T> {
  delete (host as any).with;
  delete (host as any).seal;

  return host as Sealed<T>;
}

/**
 * Returns a new object that can be extended through plugins.
 * @param host The object to make extensible.
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
