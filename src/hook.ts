import React from "react";
import createStore, {
  StoreAPI,
  StateComparer,
  StoreOptions,
  AnyState,
} from "./store";

/** A function that returns a value from a state. */
export type StateSelector<T, U = T> = (state: T) => U;

/** Returns the current state, or selects a value from it. */
export type StateSelectorHook<T> = {
  /** Returns the current state. */
  (): T;
  /**
   * Returns a value from the state.
   * @param select A function that returns a value from the state.
   * @param equals (Optional) A function that compares equality of two values.
   * If the values are equal, the hook will not re-render.
   * The default is `Object.is`.
   */
  <U>(select: StateSelector<T, U>, equals?: StateComparer<U>): U;
};

/** A hook that is also a state container, a.k.a. store. */
export type StoreHook<T extends AnyState> = StateSelectorHook<T> & StoreAPI<T>;

function bindHook<T extends AnyState>(
  store: StoreAPI<T>
): StateSelectorHook<T> {
  const useSelector = (
    selector: StateSelector<any> = (state) => state,
    equals: StateComparer<any> = Object.is
  ) => {
    const oldRef = React.useRef<any>();

    const select = () => {
      const oldValue = oldRef.current;
      const newValue = selector(store.get());

      if (equals(oldValue, newValue)) {
        return oldValue;
      } else {
        return (oldRef.current = newValue);
      }
    };

    return React.useSyncExternalStore(store.subscribe, select, select);
  };

  return useSelector;
}

/**
 * Creates a store and returns a hook for accessing it.
 * @param initial The initial state.
 * @param options (Optional) Options for the store.
 */
export default function storeHook<T extends AnyState>(
  initial: T,
  options?: StoreOptions<T>
): StoreHook<T> {
  const store = createStore(initial, options);
  const hook = bindHook(store);

  return Object.assign(hook, store);
}
