import createStore, {
  StoreAPI,
  StateComparer,
  StateSelector,
  StoreOptions,
} from "./store";
import React from "react";

export type StateSelectorHook<T> = {
  (): T;
  <U>(select: StateSelector<T, U>, equals?: StateComparer<U>): U;
};

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
 * @param initial The initial value.
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
