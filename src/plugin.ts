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
  /** Removes the `with` and `seal` methods, allowing no further plugins to be added. */
  seal: () => Sealed<H>;
};

/** Removes the `with` and `seal` methods, and makes the object immutable. */
export type Sealed<H extends object> = Readonly<Omit<H, "with" | "seal">>;

/**
 * Adds the `with` method to the object,
 * which allows it to be extended with additional plugins.
 * @param host The object to extend.
 */
export function pluggable<H extends object>(host: H): Pluggable<H> {
  const addPlugin = <P>(plugin: Plugin<H, P>) =>
    pluggable(Object.assign(host, plugin(host)));
  const seal = () => sealPluggable(host);

  return Object.assign(host, { with: addPlugin, seal });
}

/**
 * Removes the `with` and `seal` methods,
 * and makes the object immutable.
 * @param host The object to seal.
 */
export function sealPluggable<P extends object>(host: P): Sealed<P> {
  if ("with" in host) delete host.with;
  if ("seal" in host) delete host.seal;

  return Object.freeze(host);
}
