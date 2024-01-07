/** A factory function that returns a value, or a tuple of a value and a lifetime in milliseconds. */
export type ValueFactory<T> = () => T;

/** A function that returns a value from the cache. */
export type CacheGetter<T> = {
  /** Gets the value from the cache, or `null` if it is not found. */
  (key: string): T | null;
  /**
   * Gets the value from the cache, or creates (and stores) it if it is not found.
   * @param key The key of the value to get.
   * @param create A factory function that returns a value, or a tuple of a value and a lifetime in milliseconds.
   */
  (key: string, create: ValueFactory<T>, lifetime?: number): T;
};

/** A cache of values that can be either transient or permanent. */
export type Cache<T> = {
  /**
   * Gets a value from the cache. If the value is not in the cache, and no factory function is provided, returns `null`,
   * otherwise sets the value and returns it.
   * @param key The key of the value to get.
   * @param create A factory function that returns a value, or a tuple of a value and a lifetime in milliseconds.
   */
  get: CacheGetter<T>;
  /**
   * Sets a value in the cache and returns it.
   * If the value is transient, it will be automatically evicted after its lifetime.
   * @param key A key to store the value under.
   * @param input A value, or a tuple of a value and a lifetime in milliseconds.
   * @param lifetime (Optionally) How long to keep the value in the cache, in milliseconds.
   */
  set: (key: string, input: T, lifetime?: number) => T;
  /**
   * Removes a value from the cache, optionally after a delay.
   * @param key The key of the value to evict.
   * @param delay (Optionally) How long to wait before evicting the value, in milliseconds.
   * If set to zero or less, evicts the value immediately (default)
   * If set to `Infinity`, makes the function no-op.
   */
  evict: (key: string, delay?: number) => void;
};

export type CacheOptions = {
  /**
   * How long to keep the value in the cache, in milliseconds.
   * If not set, the value will be kept indefinitely.
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
 * const scores = createCache<number>({ lifetime: 1000 });
 *
 * const exampleScore = cache.get("example", () => 50);
 * ```
 */
export default function createCache<T>(options: CacheOptions = {}): Cache<T> {
  const entries = new Map<string, T>();
  const defaultLifetime = options.lifetime ?? Infinity;

  const set = (key: string, value: T, lifetime = defaultLifetime) => {
    if (lifetime > 0) {
      entries.set(key, value);
      evict(key, lifetime);
    }

    return value;
  };

  const get = ((key: string, create?: ValueFactory<T>, lifetime?: number) => {
    const entry = entries.get(key);

    if (entry) return entry;
    else if (!create) return null;
    else return set(key, create(), lifetime);
  }) as CacheGetter<T>;

  const evict = (key: string, delay?: number) => {
    if (delay === Infinity) return;
    if (!delay || delay < 0) entries.delete(key);
    else setTimeout(() => entries.delete(key), delay);
  };

  return { get, set, evict };
}
