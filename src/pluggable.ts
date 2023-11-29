/**
 * A function that receives a value and returns an object
 * with additional methods that should be assigned to it.
 *
 * @param host The value to extend.
 */
export type Plugin<H extends object, P = void> = (host: H) => P;

/** An object that can be extended with additional methods. */
export type Pluggable<T extends object> = T & {
  /** Extends the object with additional methods. */
  with: <P>(plugin: Plugin<T, P>) => Pluggable<T & P>;
  /**
   * Removes the `with` (and `seal`) method,
   * allowing no further plugins to be added.
   *
   * 🦭
   */
  seal: () => Sealed<T>;
};

/** Removes the `with` and `seal` methods, and makes the object immutable. */
export type Sealed<T extends Pluggable<any>> = Readonly<
  Omit<T, "with" | "seal">
>;

/**
 * Removes the `with` and `seal` methods,
 * and makes the object immutable.
 *
 * Note: The host object is mutated.
 * @param host The object to seal.
 */
export function sealPluggable<T extends Pluggable<any>>(host: T): Sealed<T> {
  delete (host as any).with;
  delete (host as any).seal;

  return Object.freeze(host) as Sealed<T>;
}

/**
 * Adds the `with` method to the object,
 * which allows it to be extended with additional plugins.
 * @param host The object to extend.
 */
export default function pluggable<T extends object>(host: T): Pluggable<T> {
  const add = <P>(plugin: Plugin<T, P>) =>
    pluggable(Object.assign(host, plugin(host)));
  const seal = () => sealPluggable(host);

  return Object.assign(host, { with: add, seal });
}
