/**
 * A function that receives a value and returns an object
 * with additional methods that should be assigned to it.
 *
 * @param host The value to extend.
 */
export type Plugin<H extends object, P = void> = (host: H) => P;

/** An object that can be extended with additional methods. */
export type Extensible<T extends object> = T & {
  /** Extends the object with additional methods. */
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

  return Object.freeze(host) as Sealed<H>;
}

/**
 * Adds the `with` method to the object,
 * which allows it to be extended with additional plugins.
 * @param host The object to extend.
 */
export default function extend<T extends object>(host: T): Extensible<T> {
  const add = <P>(plugin: Plugin<T, P>) =>
    extend(Object.assign(host, plugin(host)));
  const seal = () => sealExtensible(host) as T;

  return Object.assign(host, { with: add, seal });
}
