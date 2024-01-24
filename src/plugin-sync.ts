import { Plugin } from "./extend";
import { AnyState, StoreAPI } from "./store";
import createCache from "./util-cache";
import dedupe, { AsyncFunction } from "./util-dedupe";

/**
 * A function that pulls the state from an external source using some arguments.
 * The function should return a promise that resolves with the new state.
 */
export type PullFunction<T> = (...args: any[]) => Promise<T>;

/**
 * A function that syncs the state with an external source, optionally using some extra arguments.
 * The function should return a promise that resolves when the sync is complete.
 * @template T The type of the state.
 */
export type SyncFunction<T> = (state: T, ...extra: any[]) => Promise<any>;

/** A sync function which doesn't include the state as the first argument. */
export type CompiledSyncFunction<F extends SyncFunction<any>> = (
  ...extra: ExtraArgs<F>
) => ReturnType<F>;

/** Returns the extra arguments of a sync function. */
export type ExtraArgs<T> = T extends (state: any, ...args: infer U) => any
  ? U
  : never;

/** Configures how to sync the state. */
export type SyncOptions<T extends AnyState, F extends SyncFunction<T>> = {
  /**
   * The duration to cache the result of the sync function for, in milliseconds.
   *
   * Defaults to `0`.
   */
  cacheTime?: number;
  /**
   * The duration to ignore repeated calls for while syncing is in progress, in milliseconds.
   *
   * Defaults to `Infinity`.
   */
  dedupeTimeout?: number;
  /**
   * Hash the state to determine whether it has changed since the last sync.
   *
   * Uses `JSON.stringify` by default.
   */
  hash?: (state: T, ...extra: ExtraArgs<F>) => string;
};

/** Configure how to pull a new state into the store. */
export type PullOptions<P extends PullFunction<any>> = {
  /**
   * The duration to cache the result of the pull function for, in milliseconds.
   *
   * Defaults to 0.
   */
  cacheTime?: number;
  /**
   * The duration to ignore repeated calls for while pulling is in progress, in milliseconds.
   *
   * Defaults to Infinity.
   */
  dedupeTimeout?: number;
  /**
   * Hash the arguments to determine whether they have changed since the last pull.
   *
   * Uses `JSON.stringify` by default.
   */
  hash?: (...args: Parameters<P>) => string;
};

/** Extracts a record of the user-defined sync functions from a setup object. */
export type SyncFunctions<T, S extends object> = {
  [K in Extract<keyof S, string>]: K extends `pull${infer _}`
    ? K extends `${infer _}Options`
      ? never
      : PullFunction<T>
    : SyncFunction<T>;
};

/** Extracts the a record of the compiled sync function types from a setup object. */
export type CompiledSyncFunctions<S extends object> = {
  [K in keyof S as K extends `${infer _}Options`
    ? never
    : K]: S[K] extends AsyncFunction
    ? K extends `pull${infer _}`
      ? S[K]
      : CompiledSyncFunction<S[K]>
    : never;
};

/** The suggested sync functions. */
export type SyncFunctionSuggestions<T extends AnyState = AnyState> = {
  /** Define how to sync the state upstream. */
  push?: SyncFunction<T>;
  /** Define how to sync the state downstream. */
  pull?: PullFunction<T>;
  /** Define how to delete the state upstream. */
  delete?: SyncFunction<T>;
};

/** The API provided by the sync plugin. */
export type SyncAPI<S extends object> = {
  sync: CompiledSyncFunctions<S>;
};

/** Extracts the options for the sync functions from a setup object. */
export type SyncFunctionOptions<T extends AnyState, S extends object> = {
  [K in Extract<keyof S, string> as K extends `${infer _}Options`
    ? never
    : `${K}Options`]: K extends `pull${infer _}`
    ? S[K] extends PullFunction<T>
      ? PullOptions<S[K]>
      : never
    : S[K] extends SyncFunction<T>
    ? SyncOptions<T, S[K]>
    : never;
};

/** Helper type to setup the sync plugin. */
export type SyncSetup<T extends AnyState, R extends {}> = R &
  (
    | SyncFunctions<T, R>
    | SyncFunctionOptions<T, R>
    | SyncFunctionSuggestions<T>
  );

/** A plugin that allows you to sync the state upstream and downstream using a method of your choice. */
export type SyncPlugin<T extends AnyState, R extends {}> = Plugin<
  StoreAPI<T>,
  SyncAPI<R>
>;

/**
 * Adds data fetching and mutation capabilities to a store,
 * allowing you to sync the state using a method of your choice.
 * @param setup Define how to pull and sync the state.
 * @template T The type of the state.
 * @template S The user-defined sync functions and their options.
 *
 * @example
 * ```ts
 * import storeHook from "tyin/hook";
 * import sync from "tyin/plugin-sync";
 * import extend from "tyin/extend";
 * import { Note } from "@/types";
 *
 * const useUserNotes = extend(storeHook<Note[]>([]))
 *   .with(
 *     sync({
 *       push: (notes, userId: string) =>
 *         fetch(`/api/notes/${userId}`, {
 *           method: "PUT",
 *           body: JSON.stringify(notes),
 *         }),
 *       pullOptions: { cacheDuration: 5000 },
 *       pull: (userId: string) =>
 *         fetch(`/api/notes/${userId}`).then((res) => res.json()),
 *     })
 *   )
 *   .seal();
 * ```
 */
export default function sync<T extends AnyState, S extends {}>(
  setup: SyncSetup<T, S>
): SyncPlugin<T, S> {
  const cache = createCache<Promise<any>>();

  return (store) => {
    const cachedSync = <F extends SyncFunction<T>>(
      fn: F,
      {
        dedupeTimeout = Infinity,
        cacheTime = 0,
        hash = (...args) => JSON.stringify(args),
      }: SyncOptions<T, F> = {}
    ) => {
      const deduped = dedupe(fn, { timeout: dedupeTimeout });

      return (...args: ExtraArgs<F>) => {
        const state = store.get();
        const key = hash(state, ...args);

        return cache.get(key, () => deduped(state, ...args), cacheTime);
      };
    };

    const cachedPull = <F extends PullFunction<T>>(
      fn: F,
      {
        dedupeTimeout = Infinity,
        cacheTime = 0,
        hash = (...args) => JSON.stringify(args),
      }: PullOptions<F> = {}
    ) => {
      const deduped = dedupe(fn, { timeout: dedupeTimeout });

      return (...args: Parameters<F>) =>
        cache
          .get(hash(...args), () => deduped(...args), cacheTime)
          .then((state) => {
            store.set(state);
            return state;
          });
    };

    const sync: any = {};

    for (const [name, fn] of Object.entries(setup)) {
      if (typeof fn !== "function") continue;

      const options = (setup as any)[`${name}Options`];

      sync[name] = name.startsWith("pull")
        ? cachedPull(fn, options || {})
        : cachedSync(fn, options || {});
    }

    return { sync };
  };
}
