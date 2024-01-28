/** A function that returns a value. */
export type ValueFactory<T> = () => T;

/** A key to store a value under in the cache. */
export type CacheKey = string | number;

/** A function that returns a value from the cache. */
export type CacheGetter<T> = {
  /** Gets the value from the cache, or `null` if it is not found. */
  (key: CacheKey): T | null;
  /**
   * Gets the value from the cache, or creates (and stores) it if it is not found.
   * @param key The key of the value to get.
   * @param create A factory function that returns a value.
   * @param lifetime (Optionally) How long to keep the value in the cache, in milliseconds.
   */
  (key: CacheKey, create: ValueFactory<T>, lifetime?: number): T;
};

/** A cache of values that can be either transient or permanent. */
export type Cache<T> = {
  /**
   * Gets a value from the cache. If the value is not in the cache, and no factory function is provided, returns `null`,
   * otherwise sets the value and returns the value.
   */
  get: CacheGetter<T>;
  /**
   * Sets a value in the cache and returns it.
   * If the value is transient, it will be automatically evicted after its lifetime.
   * @param key A key to store the value under.
   * @param input A value, or a tuple of a value and a lifetime in milliseconds.
   * @param lifetime (Optionally) How long to keep the value in the cache, in milliseconds.
   */
  set: (key: CacheKey, input: T, lifetime?: number) => T;
  /**
   * Removes a value from the cache, optionally after a delay.
   * @param key The key of the value to evict.
   * @param delay (Optionally) How long to wait before evicting the value, in milliseconds.
   * If set to zero or less, evicts the value immediately (default)
   * If set to `Infinity`, makes the function no-op.
   */
  evict: (key: CacheKey, delay?: number) => void;
};

/** Configure how to create a cache. */
export type CacheOptions = {
  /**
   * How long to keep values in the cache for by default, in milliseconds.
   * If set to `Infinity`, values will be kept forever.
   *
   * Defaults to `Infinity`.
   */
  lifetime?: number;
};

/**
 * Creates a cache backed by a HashMap.
 * @param options Configure the cache.
 * @template T The type of the values.
 * @example
 * ```ts
 * import createCache from "tyin/cache";
 *
 * const scores = createCache<number>();
 *
 * const exampleScore = cache.get("example", () => 50);
 * ```
 */
export default function createCache<T>(options: CacheOptions = {}): Cache<T> {
  const entries = new Map<CacheKey, T>();
  const defaultLifetime = options.lifetime ?? Infinity;

  const set = (key: CacheKey, value: T, lifetime = defaultLifetime) => {
    if (lifetime > 0) {
      entries.set(key, value);
      evict(key, lifetime);
    }

    return value;
  };

  const get = ((key: CacheKey, create?: ValueFactory<T>, lifetime?: number) => {
    const entry = entries.get(key);

    if (entry) return entry;
    else if (!create) return null;
    else return set(key, create(), lifetime);
  }) as CacheGetter<T>;

  const evict = (key: CacheKey, delay?: number) => {
    if (delay === Infinity) return;
    if (!delay || delay < 0) entries.delete(key);
    else setTimeout(() => entries.delete(key), delay);
  };

  return { get, set, evict };
}
