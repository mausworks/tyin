/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import debounce from "./debounce";
import { StoreAPI } from "./store";
import { Plugin } from "./pluggable";

/** An object like `window.localStorage`. */
export type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

/** Options for the persist plugin.. */
export type PersistOptions<T> = {
  /** The key to use when storing the state. */
  name: string;
  /**
   * The delay before saving the state.
   * This is useful for reducing the number of writes to storage
   * for high frequency updates.
   *
   * @default 0
   */
  delay?: number;
  /** Mutate the value before saving and/or after loading. */
  map?: (state: T) => T;
  /** Determine whether to save the state. */
  filter?: (state: T) => boolean;
  /** The storage to use, defaults to localStorage. */
  storage?: StorageLike;
};

export type PersistPlugin<T> = Plugin<StoreAPI<T>>;

const localStorage = typeof window !== "undefined" ? window.localStorage : null;

/**
 * A plugin that persists the state to a storage of your choice,
 * or localStorage by default.
 * @param options Options for the plugin.
 */
const persistPlugin = <T>(options: PersistOptions<T>): PersistPlugin<T> => {
  const {
    name,
    delay = 0,
    map = (s) => s,
    filter = () => true,
    storage = localStorage,
  } = options;

  return (store: StoreAPI<T>) => {
    if (!storage) return;

    const stored = storage?.getItem(name);
    if (stored) store.set(map(JSON.parse(stored)));

    store.subscribe(
      debounce(delay, (_, newState) => {
        if (!filter(newState)) return;

        storage?.setItem(name, JSON.stringify(map(newState)));
      })
    );
  };
};

export default persistPlugin;
