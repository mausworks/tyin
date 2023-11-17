import { Plugin } from "./plugin";
import { Setter, isSetter } from "./state";
import { StoreAPI } from "./store";

export type ObjectLike = { [key: string]: any };

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

/** Keeps only the required fields of an object. */
export type Pruned<T extends ObjectLike | null> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
};

/** Keeps only the optional fields of an object. */
export type Extras<T extends ObjectLike | null> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
};

/** Only the required keys of an object. */
export type RequiredKey<T extends ObjectLike | null> = Pruned<T>[keyof T];

/** Only the optional keys of an object. */
export type OptionalKey<T extends ObjectLike | null> = Extras<T>[keyof T];

export type ObjectAPI<T extends ObjectLike | null> = {
  /** Returns the number of keys in the object. */
  size: () => number;
  /**
   * Assigns the given value to the object.
   * Can be used as a partial update or a setter.
   *
   * The `merge` function provided in the options is used to merge the
   * current state with the update.
   */
  assign: (update: PartialUpdate<T>) => void;
  /** Removes the given key from the object. */
  remove: (key: OptionalKey<T>) => void;
};

export type ObjectPreset<T extends ObjectLike | null> = Plugin<
  StoreAPI<T>,
  ObjectAPI<T>
>;

const mergeShallow = <T extends ObjectLike | null, U = Partial<T>>(
  left: T,
  right: U
): T & U => ({ ...left, ...right });

export const createObjectAPI = <T extends ObjectLike | null>(
  store: StoreAPI<T>,
  { merge: mergeDefault = mergeShallow }: ObjectStoreOptions<T> = {}
): ObjectAPI<T> => ({
  size: () => Object.keys(store.get() ?? {}).length,
  assign: (update: PartialUpdate<T>, merge = mergeDefault) => {
    const state = store.get();

    if (isSetter(update)) {
      store.set(merge(state, update(state)));
    } else if (typeof update === "object") {
      store.set(merge(state, update));
    } else {
      store.set(state);
    }
  },
  remove: (key: OptionalKey<T>) => {
    const state = store.get();
    if (!state) return;

    const { [key]: _, ...remainder } = state;

    store.set(remainder as T);
  },
});

/**
 * A plugin that adds object methods to the store.
 * @param options Options for the plugin.
 *
 * @example
 * import storeHook from "gratis-state/react";
 * import objectPreset from "gratis-state/preset-object";
 *
 * const useCount = storeHook({ count: 0 })
 *  .with(objectPreset());
 */
const objectPreset =
  <T extends ObjectLike | null>(
    options: ObjectStoreOptions<T> = {}
  ): ObjectPreset<T> =>
  (store) =>
    createObjectAPI(store, options);

export default objectPreset;
