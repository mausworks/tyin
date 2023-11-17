import createStore, { StoreAPI, StoreOptions } from "./store";
import reactPlugin, { StateSelectorHook } from "./plugin-react";

export type StoreHook<T> = StoreAPI<T> & StateSelectorHook<T>;

/**
 * A store hook that holds a value.
 * Useful when you need to store a single value,
 * like a string or number.
 * @param initial The initial value.
 * @param options (Optional) Options for the store.
 */
export default function storeHook<T>(
  initial: T,
  options?: StoreOptions<T>
): StoreHook<T> {
  return createStore(initial, options).with(reactPlugin());
}
