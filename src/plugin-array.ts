import { StoreAPI } from "./store";
import { Plugin } from "./extend";

export type ArrayPredicate<T> = (value: T, index: number) => boolean;
export type Comparator<T> = (prev: T, next: T) => number;
export type ArrayMapCallback<T> = (value: T, index: number) => T;

export type ArrayAPI<T> = {
  /** Returns the number of values in the state. */
  length: () => number;
  /** Appends the given values to the end of the state. */
  push: (...values: T[]) => void;
  /** Prepends the given values to the beginning of the state. */
  unshift: (...values: T[]) => void;
  /** Removes all values that do not match the given predicate. */
  filter: (keep: ArrayPredicate<T>) => void;
  /** Remaps the values in the state. */
  map: (callback: ArrayMapCallback<T>) => void;
  /** Sorts the values in the state. */
  sort: (compare: Comparator<T>) => void;
  /** Reverses the order of the values in the state. */
  reverse: () => void;
};

export type MemberOf<T> = T extends any[] ? T[number] : never;

export type ArrayAPIPlugin<T extends any[] | null> = Plugin<
  StoreAPI<T>,
  ArrayAPI<MemberOf<T>>
>;

/**
 * Adds convenience methods for working with arrays.
 * @template T The type of the state, must be an array type..
 * @example
 * ```ts
 * import storeHook from "tyin/hook";
 * import extend from "tyin/extend";
 * import arrayAPI from "tyin/plugin-array";
 *
 * const useExample = extend(storeHook([1, 2, 3]))
 *   .with(arrayAPI())
 *   .seal();
 * ```
 */
const arrayAPI =
  <T extends any[] | null>(): ArrayAPIPlugin<T> =>
  (store) => ({
    length: () => store.get()?.length ?? 0,
    push: (...values) =>
      store.set((state) => (state ? [...state, ...values] : values) as T),
    unshift: (...values) =>
      store.set((state) => (state ? [...values, ...state] : values) as T),
    filter: (keep) => store.set((state) => (state?.filter(keep) ?? null) as T),
    map: (callback) =>
      store.set((state) => (state?.map(callback) ?? null) as T),
    sort: (compare) =>
      store.set((state) => (state ? [...state.sort(compare)] : null) as T),
    reverse: () =>
      store.set((state) => (state ? [...state.reverse()] : null) as T),
  });

export default arrayAPI;
