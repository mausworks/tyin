import React from "react";
import createStore, { StoreAPI, StateComparer, StoreOptions } from "./store";

/** A function that returns a value from a state. */
export type StateSelector<T, U = T> = (state: T) => U;

/** Returns the whole state, or selects a value from the state. */
export type StateSelectorHook<T> = {
  /** Returns the whole state. */
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

/** A hook that is also a state container (store). */
export type StoreHook<T> = StateSelectorHook<T> & StoreAPI<T>;

function bindHook<T>(store: StoreAPI<T>): StateSelectorHook<T> {
  const useSelector = (
    selector: StateSelector<any> = (state) => state,
    equals: StateComparer<any> = Object.is
  ) => {
    const selectorRef = React.useRef(selector);
    const equalsRef = React.useRef(equals);
    const prevRef = React.useRef<any>();

    selectorRef.current = selector;
    equalsRef.current = equals;

    const select = React.useCallback(() => {
      const state = store.get();
      const oldState = prevRef.current;
      const newState = selectorRef.current(state);

      if (equalsRef.current(oldState, newState)) {
        return oldState;
      } else {
        return (prevRef.current = newState);
      }
    }, []);

    return React.useSyncExternalStore(store.subscribe, select, select);
  };

  return useSelector;
}

/**
 * Creates a store and returns a hook for accessing it.
 * @param initial The initial state.
 * @param options (Optional) Options for the store.
 */
export default function storeHook<T>(
  initial: T,
  options?: StoreOptions<T>
): StoreHook<T> {
  const store = createStore(initial, options);
  const hook = bindHook(store);

  return Object.assign(hook, store);
}
