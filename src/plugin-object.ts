import { Plugin } from "./extend";
import { Setter, StoreAPI } from "./store";

/** An object with keys */
export type ObjectLike = { [key: string]: any };

/** Only the optional keys of an object. */
export type OptionalKey<T extends ObjectLike | null> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

export type MergeState<T extends ObjectLike | null, U = Partial<T>> = (
  left: T,
  right: U
) => T & U;

export type ObjectStoreOptions<T extends ObjectLike | null> = {
  merge?: MergeState<T>;
};

export type PartialUpdate<T extends ObjectLike | null> =
  | Partial<T>
  | Setter<T, Partial<T>>;

export type ObjectAPI<T extends ObjectLike | null> = {
  /** Returns the number of keys in the object. */
  size: () => number;
  /**
   * Patches the given update onto the state.
   *
   * @param update The update to apply.
   */
  patch: (update: PartialUpdate<T>, merge?: MergeState<T>) => void;
  /** Removes the given key from the object. */
  remove: (key: OptionalKey<T>) => void;
};

export type ObjectAPIPlugin<T extends ObjectLike | null> = Plugin<
  StoreAPI<T>,
  ObjectAPI<T>
>;

const mergeLeft = <T extends ObjectLike | null, U = Partial<T>>(
  left: T,
  right: U
): T & U => ({ ...left, ...right });

/**
 * A plugin that adds object methods to the store.
 * @param options Options for the plugin.
 */
const objectAPI =
  <T extends ObjectLike | null>(
    options?: ObjectStoreOptions<T>
  ): ObjectAPIPlugin<T> =>
  (store) => ({
    size: () => Object.keys(store.get() ?? {}).length,
    patch: (update, merge = options?.merge || mergeLeft) => {
      const state = store.get();

      if (typeof update === "function") {
        store.set(merge(state, update(state)));
      } else {
        store.set(merge(state, update));
      }
    },
    remove: (key) => {
      const state = store.get();
      if (!state) return;

      const { [key]: _, ...remainder } = state;

      store.set(remainder as T);
    },
  });

export default objectAPI;
