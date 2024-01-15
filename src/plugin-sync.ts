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

/** Options to use when syncing the state with an external source. */
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
   * A function that returns a hash of the state and any extra arguments.
   * This is used to determine whether the state has changed since the last sync,
   * so that multiple syncs with the same state can be deduplicated, and the result can be cached.
   *
   * Uses JSON.stringify by default.
   */
  hash?: (state: T, ...extra: ExtraArgs<F>) => string;
};

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
   * A function that returns a hash of the arguments.
   * This is used to determine whether the arguments have changed since the last pull,
   * so that multiple pulls with the same arguments can be deduplicated,
   * and the result can be cached.
   *
   * Defaults to JSON.stringify.
   */
  hash?: (...args: Parameters<P>) => string;
};

export type SyncFunctions<T, R extends {}> = {
  [K in Extract<keyof R, string>]: K extends `pull${infer _}`
    ? K extends `${infer _}Options`
      ? never
      : PullFunction<T>
    : SyncFunction<T>;
};

export type CompiledSyncFunctions<R extends {}> = {
  [K in keyof R as K extends `${infer _}Options`
    ? never
    : K]: R[K] extends AsyncFunction
    ? K extends `pull${infer _}`
      ? R[K]
      : CompiledSyncFunction<R[K]>
    : never;
};

export type SyncFunctionSuggestions<T extends AnyState = AnyState> = {
  /** Define how to sync the state upstream. */
  push?: SyncFunction<T>;
  /** Define how to sync the state downstream. */
  pull?: PullFunction<T>;
  /** Define how to delete the state upstream. */
  delete?: SyncFunction<T>;
};

/** The API provided by the sync plugin. */
export type SyncAPI<S extends {}> = {
  sync: CompiledSyncFunctions<S>;
};

export type SyncFunctionOptions<T extends AnyState, R extends {}> = {
  [K in Extract<keyof R, string> as K extends `${infer _}Options`
    ? never
    : `${K}Options`]: K extends `pull${infer _}`
    ? R[K] extends PullFunction<T>
      ? PullOptions<R[K]>
      : never
    : R[K] extends SyncFunction<T>
    ? SyncOptions<T, R[K]>
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
 * A plugin that adds `push` and `pull` methods to the store,
 * allowing you to sync the state upstream and downstream using a method of your choice.
 * @param setup Define how to sync the state upstream and downstream.
 * @template T The type of the state.
 * @template P The type of the pull function.
 *
 * @example
 * ```ts
 * import storeHook from "tyin/hook";
 * import syncAPI from "tyin/plugin-sync";
 * import extend from "tyin/extend";
 *
 * const useExample = extend(storeHook({ a: 1, b: 2 }))
 *   .with(
 *     syncAPI({
 *       push: (state, c: number) =>
 *         fetch(`/example/${state.a}?c=${c}`, {
 *           method: "PUT",
 *           body: JSON.stringify(state),
 *         }),
 *       pull: (a: number) => fetch(`/example/${a}`).then((res) => res.json()),
 *     })
 *   )
 *   .seal();
 * ```
 */
export default function sync<T extends AnyState, R extends {}>(
  setup: SyncSetup<T, R>
): SyncPlugin<T, R> {
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

    const sync = {} as CompiledSyncFunctions<R>;

    for (const [name, fn] of Object.entries(setup)) {
      if (typeof fn !== "function") continue;

      const options = (setup as any)[`${name}Options`];

      (sync as any)[name] =
        name === "pull"
          ? cachedPull(fn, options || {})
          : cachedSync(fn, options || {});
    }

    return { sync };
  };
}
