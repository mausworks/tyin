import { Plugin } from "./extend";
import { AnyState, StoreAPI } from "./store";
import createCache from "./util-cache";
import dedupe from "./util-dedupe";

/**
 * A user-defined function that pulls the state from an external source using some arguments.
 * The function should return a promise that resolves with the new state.
 * @template T The type of the state.
 */
export type PullFunction<T> = (...args: any[]) => Promise<T>;

/**
 * A user-defined function that syncs the state with an external source, optionally using some extra arguments.
 * The function should return a promise that resolves when the sync is complete.
 * @template T The type of the state.
 */
export type SyncFunction<T> = (state: T, ...extra: any[]) => Promise<any>;

/** Returns the type of the extra parameters of a function. */
export type ExtraParameters<T extends (first: any, ...args: any[]) => any> =
  T extends (state: any, ...args: infer U) => any ? U : never;

/** A function that syncs the state. */
export type CompiledSyncFunction<
  T extends AnyState,
  F extends SyncFunction<T>
> = (...extra: ExtraParameters<F>) => ReturnType<F>;

/** A function that resolves with a new state. */
export type CompiledPullFunction<
  T extends AnyState,
  F extends PullFunction<T>
> = (...args: Parameters<F>) => Promise<T>;

/** Configures how to sync the state. */
export type SyncOptions = {
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
  hash?: (...args: any[]) => string | number;
};

/** Extracts all sync function keys from the sync setup */
type FunctionKeys<T> = Exclude<Extract<keyof T, string>, `${string}Options`>;

/** Ensures all the functions in a setup object are sync or pull functions. */
export type FunctionSetup<T extends AnyState, S extends object> = {
  [K in FunctionKeys<S>]: K extends `pull${string}`
    ? PullFunction<T>
    : SyncFunction<T>;
};

/** The suggested setup for the sync plugin. */
export type SetupSuggestions<T extends AnyState> = {
  /**
   * Push the current state to an external source, optionally using some extra arguments.
   *
   * **Tip:** This is the suggested name for a sync function that pushes the state.
   * You can define (and configure) additional sync functions with any name you like.
   */
  push?: SyncFunction<T>;
  /** Configure the suggested push function. */
  pushOptions?: SyncOptions;
  /**
   * Pull the state from an external source using some arguments.
   *
   * **Tip:** This is the suggested name for a pull function that fetches the state.
   * You can define (and configure) additional pull functions as long as they start with "pull".
   */
  pull?: PullFunction<T>;
  /** Configure the suggested pull function. */
  pullOptions?: SyncOptions;
  /**
   * Delete the state from an external source, optionally using some extra arguments.
   *
   * **Tip:** This is the suggested name for a sync function that deletes the state.
   * You can define (and configure) additional sync functions with any name you like.
   */
  delete?: SyncFunction<T>;
  /** Configure the suggested delete function. */
  deleteOptions?: SyncOptions;
};

/** Infers the options for each sync function from a setup object. */
export type AvailableOptions<S extends object> = {
  [K in FunctionKeys<S> as `${K}Options`]?: S[K] extends (...args: any) => any
    ? SyncOptions
    : never;
};

/** Extracts the a record of the compiled sync function types from a setup object. */
export type Compile<T extends AnyState, S extends object> = {
  [K in FunctionKeys<S>]: S[K] extends (...args: any) => any
    ? K extends `pull${string}`
      ? CompiledPullFunction<T, S[K]>
      : CompiledSyncFunction<T, S[K]>
    : never;
};

/** The API provided by the sync plugin. */
export type SyncAPI<T extends AnyState, S extends object> = {
  sync: Compile<T, S>;
};

/** Recomposes the keys of an intersection type into a single type */
type Recompose<T> = { [K in keyof T]: T[K] } & {};

/** Helper type to setup the sync plugin. */
export type SyncSetup<T extends AnyState, S extends object> = Recompose<
  S & FunctionSetup<T, S> & AvailableOptions<S>
>;

/** A plugin that allows you to sync the state using methods of your choice. */
export type SyncPlugin<T extends AnyState, S extends {}> = Plugin<
  StoreAPI<T>,
  SyncAPI<T, S>
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
 *   .with((store) =>
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
export default function sync<
  T extends AnyState,
  S extends SetupSuggestions<T> | object
>(setup: SyncSetup<T, S>): SyncPlugin<T, S> {
  const cache = createCache<Promise<any>>();

  return (store) => {
    const cachedSync = <F extends SyncFunction<T>>(
      fn: F,
      {
        dedupeTimeout = Infinity,
        cacheTime = 0,
        hash = JSONHash,
      }: SyncOptions = {}
    ) => {
      const deduped = dedupe(fn, { timeout: dedupeTimeout });

      return (...args: ExtraParameters<F>) => {
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
        hash = JSONHash,
      }: SyncOptions = {}
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

      const options = (setup as any)[name + "Options"];

      sync[name] = name.startsWith("pull")
        ? cachedPull(fn as any, options || {})
        : cachedSync(fn as any, options || {});
    }

    return { sync };
  };
}

const JSONHash = (...args: any[]) => JSON.stringify(args);
