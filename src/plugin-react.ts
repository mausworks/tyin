import React from "react";
import { StateComparer, StateSelector } from "./state";
import { StoreAPI, StorePlugin } from "./store";

export type StateSelectorHook<T> = {
  (): T;
  <U>(select: StateSelector<T, U>, equals?: StateComparer<U>): U;
};

export type ReactPlugin<T> = StorePlugin<T, StateSelectorHook<T>>;

export function createHook<T>(store: StoreAPI<T>): StateSelectorHook<T> {
  const useSelector = (
    selector: StateSelector<any> = (s) => s,
    equals: StateComparer<any> = Object.is
  ) => {
    const selectorRef = React.useRef(selector);
    const equalsRef = React.useRef(equals);
    const prevRef = React.useRef<any>();

    selectorRef.current = selector;
    equalsRef.current = equals;

    const select = React.useCallback(() => {
      const state = store.get();
      const prev = prevRef.current;
      const curr = selectorRef.current(state);

      if (equalsRef.current(prev, curr)) {
        return prev;
      } else {
        return (prevRef.current = curr);
      }
    }, []);

    return React.useSyncExternalStore(store.subscribe, select, select);
  };

  return useSelector;
}

/**
 * A plugin that turns the store into a React hook.
 * @param store The store to convert.
 *
 * @example
 * import createStore from "gratis-state/store";
 * import reactPlugin from "gratis-state/plugin-react";
 *
 * const useCount = createStore({ count: 0 }).with(reactPlugin());
 */
const reactPlugin =
  <T>(): ReactPlugin<T> =>
  (store) =>
    createHook(store);

export default reactPlugin;
