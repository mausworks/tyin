/** A function that returns a promise. */
export type AsyncFunction<A = any> = (...args: A[]) => Promise<any>;

/** Configures how to deduplicate calls to an async function. */
export type DedupeOptions<T extends AsyncFunction> = {
  /**
   * Optionally cache the result of the function for a given duration
   * after the promise has been resolved.
   *
   * Defaults to `0`.
   */
  cacheTime?: number;
  /**
   * How long to ignore repeated calls for while the promise is pending.
   * Set to 0 to disable deduplication, and `Infinity` to deduplicate indefinitely.
   *
   * Defaults to `Infinity`.
   */
  timeout?: number;
  /**
   * Hashes the arguments of the function to determine
   * if it was called again with the same arguments again.
   *
   * Uses `JSON.stringify` by default.
   */
  hash?: (...args: Parameters<T>) => string | number;
};

/**
 * Returns a function that deduplicates (and optionally caches) the result of an async function
 * by comparing the arguments between calls.
 * @param fn The function to remember promises for.
 * @param options (Optional) Configure the deduplication and caching.
 * @example
 * ```ts
 * import dedupe from "tyin/util-dedupe";
 *
 * const fetchNote = dedupe((id: string) => fetch(`/api/note/${id}`), {
 *   cacheTime: 5000
 * });
 * ```
 */
export default function dedupe<T extends AsyncFunction<any>>(
  fn: T,
  options: DedupeOptions<T> = {}
): T {
  let oldHash: string | number | undefined;
  let promise: Promise<any> | undefined;
  let handle: any;

  const {
    hash = (...args) => JSON.stringify(args),
    timeout = Infinity,
    cacheTime = 0,
  } = options;

  const clear = () => {
    oldHash = undefined;
    promise = undefined;
  };

  const clearAfter = (duration: number) => {
    clearTimeout(handle);

    if (duration <= 0) {
      clear();
    } else if (duration !== Infinity) {
      handle = setTimeout(clear, duration);
    }
  };

  return ((...args: Parameters<T>) => {
    const newHash = hash(...args);

    if (oldHash === newHash) {
      return promise;
    }

    clearAfter(timeout);

    oldHash = newHash;

    return (promise = fn(...args)
      .finally(() => clearAfter(cacheTime))
      .catch((reason: unknown) => {
        clear();
        return Promise.reject(reason);
      }));
  }) as T;
}
