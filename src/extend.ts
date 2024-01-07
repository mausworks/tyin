/**
 * A function that receives an object,
 * and returns an object with additional
 * properties that should be added to that object.
 *
 * @param host The object to extend.
 */
export type Plugin<T extends object, P = void> = (host: T) => P;

/** A plugin that returns a plugin. */
export type DeepPlugin<T extends object, P = void> = Plugin<T, Plugin<T, P>>;

/** The three possible ways to extend a host with plugins. */
export type ExtendHost<T extends object> = {
  /** Extends the host with the properties returned by the plugin. */
  <P>(plugin: DeepPlugin<T, P>): Extensible<T & P>;
  /** Extends the host with the properties returned by the plugin. */
  <P>(plugin: Plugin<T, P>): Extensible<T & P>;
  /** Extends the host with the provided properties. */
  <P extends Record<string, any>>(plugin: P): Extensible<T & P>;
};

/** An object that can be extended through plugins. */
export type Extensible<T extends object> = T & {
  /** Adds the properties from the plugin to the object, and returns it. */
  with: ExtendHost<T>;
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
 * extend({ a: 1 })                   // { a: 1, with: ..., seal: ... }
 *   .with({ b: 2 })                  // { a: 1, b: 2, with: ..., seal: ... }
 *   .with(({ b }) => ({ b: b + 1 })) // { a: 1, b: 3, with: ..., seal: ... }
 *   .seal();                         // { a: 1, b: 3 }
 * ```
 */
export default function extend<T extends object>(host: T): Extensible<T> {
  const add = <P>(plugin: Plugin<T, P>) =>
    extend(Object.assign(host, unpack(host, plugin)));
  const seal = () => sealExtensible(host) as T;

  return Object.assign(host, { with: add, seal });
}

const unpack = <T extends object, P>(
  host: T,
  plugin: P | Plugin<T, P>
): P extends Plugin<T, infer U> ? U : P => {
  if (Object.is(plugin, host)) return {} as any;
  else if (typeof plugin !== "function") return plugin as any;
  else return unpack(host, (plugin as any)(host));
};
