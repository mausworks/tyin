/**
 * A function that receives a value and returns an object
 * with additional methods that should be assigned to it.
 *
 * @param host The value to extend.
 */
export type Plugin<H extends object, P = void> = (host: H) => P;

/** An object that can be extended with additional methods. */
export type Pluggable<H extends object> = H & {
  /** Extends the object with additional methods. */
  with: <P>(plugin: Plugin<H, P>) => Pluggable<H & P>;
  /**
   * Removes the `with` (and `seal`) method,
   * allowing no further plugins to be added.
   *
   * 🦭
   */
  seal: () => Sealed<H>;
};

/** Removes the `with` and `seal` methods, and makes the object immutable. */
export type Sealed<H extends object> = Readonly<Omit<H, "with" | "seal">>;

/**
 * Removes the `with` and `seal` methods,
 * and makes the object immutable.
 *
 * Note: The host object is mutated.
 * @param host The object to seal.
 */
export function sealPluggable<H extends object>(host: H): Sealed<H> {
  delete (host as any).with;
  delete (host as any).seal;

  return Object.freeze(host) as Sealed<H>;
}

/**
 * Adds the `with` method to the object,
 * which allows it to be extended with additional plugins.
 * @param host The object to extend.
 */
export default function pluggable<H extends object>(host: H): Pluggable<H> {
  const add = <P>(plugin: Plugin<H, P>) =>
    pluggable(Object.assign(host, plugin(host)));
  const seal = () => sealPluggable(host);

  return Object.assign(host, { with: add, seal });
}
