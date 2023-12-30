import { Plugin } from "../extend";
import { AnyState, StoreAPI } from "../store";
import createCache from "../util-cache";
import prune, { Pruned } from "../util-prune";

/**
 * A function with that pulls the state from an external source
 * using some arguments.
 */
export type PullFunction<T> = (...args: any[]) => Promise<T>;

export type PushOptions<T> = {
  /**
   * The duration to cache the result of the push function for, in milliseconds.
   * Caching a push effectively means that the same state cannot be pushed for a while.
   *
   * Defaults to `0`.
   */
  cacheDuration?: number;
  /**
   * The duration to ignore repeated calls for while pushing is in progress, in milliseconds.
   *
   * Defaults to `Infinity`.
   */
  dedupeDuration?: number;
  /**
   * A function that returns a hash of the state.
   * This is used to determine whether the state has changed since the last push,
   * so that multiple pushes of the same state can be deduplicated,
   * and the result can be cached (the same state cannot be pushed for a while).
   *
   * Defaults to `JSON.stringify`.
   */
  hash?: (state: T) => string;
};

export type PullOptions<P extends PullFunction<any>> = {
  /**
   * The duration to cache the result of the pull function for, in milliseconds.
   *
   * Defaults to 0.
   */
  cacheDuration?: number;
  /**
   * The duration to ignore repeated calls for while pulling is in progress, in milliseconds.
   *
   * Defaults to Infinity.
   */
  dedupeDuration?: number;
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

export type DeleteOptions<T> = {
  /**
   * The duration to ignore repeated calls while deletion is in progress, in milliseconds.
   *
   * Defaults to Infinity.
   */
  dedupeDuration?: number;
  /**
   * A function that returns a hash of the state.
   *
   * Defaults to JSON.stringify.
   */
  hash?: (state: T) => string;
};

export type SyncSetup<T, P extends PullFunction<T>> = {
  /** Define how to sync the state upstream. */
  push?: (state: T) => Promise<unknown>;
  /** Configure deduplication and caching when pushing. */
  pushOptions?: PushOptions<T>;
  /** Define how to sync the state downstream. */
  pull?: P;
  /** Configure deduplication and caching when pulling. */
  pullOptions?: PullOptions<P>;
  /** Define how to delete the state upstream. */
  delete?: null extends T ? (state: T) => Promise<unknown> : never;
  /** Configure deduplication when deleting. */
  deleteOptions?: DeleteOptions<T>;
};

export type SyncFunctions<S extends SyncSetup<any, any> = SyncSetup<any, any>> =
  Pruned<{
    /** Pull a new state downstream. */
    pull: S["pull"] extends PullFunction<any>
      ? (...args: Parameters<S["pull"]>) => Promise<void>
      : undefined;
    /** Push the current state upstream. */
    push: S["push"] extends (...args: any[]) => Promise<any>
      ? () => Promise<void>
      : undefined;
    /** Delete the state upstream, and reset the state to the initial state. */
    delete: S["delete"] extends (...args: any[]) => Promise<any>
      ? () => Promise<void>
      : undefined;
  }>;

/** The API provided by the sync plugin. */
export type SyncAPI<T extends AnyState, S extends SyncSetup<T, any>> = {
  sync: SyncFunctions<S>;
};

/** A plugin that allows you to sync the state upstream and downstream using a method of your choice. */
export type SyncPlugin<
  T extends AnyState,
  S extends SyncSetup<T, any>
> = Plugin<StoreAPI<T>, SyncAPI<T, S>>;

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
 *       push: (state) =>
 *         fetch(`/example/${state.a}`, {
 *           method: "PUT",
 *           body: JSON.stringify(state),
 *         }),
 *       pull: (a: number) => fetch(`/example/${a}`).then((res) => res.json()),
 *     })
 *   )
 *   .seal();
 * ```
 */
export default function sync<
  T extends AnyState,
  S extends SyncSetup<T, PullFunction<T>>
>(
  setup: S extends SyncSetup<T, infer P> ? SyncSetup<T, P> : S
): SyncPlugin<T, S> {
  const cached = promiseCache();

  return (store) => {
    const initial = store.get();

    return {
      sync: prune({
        push: setup.push
          ? () =>
              cached({
                load: () => setup.push!(store.get()),
                args: ["$PUSH", store.get()],
                options: setup.pushOptions,
              })
          : undefined,
        pull: setup.pull
          ? (...args: any[]) =>
              cached({
                load: () => setup.pull!(...args).then(store.set),
                args: ["$PULL", args],
                options: setup.pullOptions,
              })
          : undefined,
        delete: setup.delete
          ? () =>
              cached({
                load: () =>
                  setup.delete!(store.get()).then(() => store.set(initial)),
                args: ["$DEL", store.get()],
                options: setup.deleteOptions,
              })
          : undefined,
      }) as SyncFunctions<S>,
    };
  };
}

type PromiseCacheOptions = {
  cacheDuration?: number;
  dedupeDuration?: number;
  hash?: (...args: any) => string;
};

type PromiseCacheParams = {
  options?: PromiseCacheOptions;
  args: any;
  load: () => Promise<any>;
};

const promiseCache = () => {
  const cache = createCache<Promise<any>>();

  return ({
    args,
    load,
    options: {
      cacheDuration = 0,
      dedupeDuration = Infinity,
      hash = JSON.stringify,
    } = {},
  }: PromiseCacheParams) => {
    const baseKey = hash(args);
    const pendingKey = `P:${baseKey}`;
    const cacheKey = `C:${baseKey}`;

    return cache
      .get(cacheKey, () => [
        cache
          .get(pendingKey, [load, dedupeDuration])
          .finally(() => cache.evict(pendingKey)),
        cacheDuration,
      ])
      .catch(() => cache.evict(cacheKey));
  };
};
