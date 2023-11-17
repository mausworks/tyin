import { StoreAPI, StorePlugin } from "./store";

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
  /** Removes all values from the state. */
  clear: () => void;
  /** Reverses the order of the values in the state. */
  reverse: () => void;
};

export type MemberOf<T> = T extends any[] ? T[number] : never;

export type ArrayPreset<T extends any[] | null> = StorePlugin<
  T,
  ArrayAPI<MemberOf<T>>
>;

export const createArrayAPI = <T extends any[] | null>(
  store: StoreAPI<T>
): ArrayAPI<MemberOf<T>> => ({
  length: () => store.get()?.length ?? 0,
  push: (...values: MemberOf<T>[]) =>
    store.set((state) => (state ? [...state, ...values] : values) as T),
  unshift: (...values: MemberOf<T>[]) =>
    store.set((state) => (state ? [...values, ...state] : values) as T),
  filter: (keep: ArrayPredicate<MemberOf<T>>) =>
    store.set((state) => (state?.filter(keep) ?? null) as T),
  map: (callback: ArrayMapCallback<MemberOf<T>>) =>
    store.set((state) => (state?.map(callback) ?? null) as T),
  sort: (compare: Comparator<MemberOf<T>>) =>
    store.set((state) => (state ? [...state.sort(compare)] : null) as T),
  reverse: () =>
    store.set((state) => (state ? [...state.reverse()] : null) as T),
  clear: () => store.set((state) => (state ? [] : null) as T),
});

/**
 * A plugin that adds array methods to the store.
 *
 * @example
 * import arrayPreset from "gratis-state/preset-array";
 * import storeHook from "gratis-state/react";
 *
 * const useCount = storeHook(["initial"]).with(arrayPreset());
 */
const arrayPreset =
  <T extends any[] | null>(): ArrayPreset<T> =>
  (store) =>
    createArrayAPI(store);

export default arrayPreset;
