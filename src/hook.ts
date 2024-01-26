import { useRef, useSyncExternalStore } from "react";
import createStore, {
  StoreAPI,
  StateComparer,
  StoreOptions,
  AnyState,
} from "./store";

/** A function that returns a value from a state. */
export type StateSelector<T, U = T> = (state: T) => U;

/** A function that returns the current state, or selects a value from it. */
export type StateSelectorHook<T> = {
  /** Returns the current state. */
  (): T;
  /**
   * Selects a value from the state.
   * @param select A function that returns a value from the state.
   * @param equals (Optional) Compare the previously selected and next value:
   * If the values are equal between updates,
   * the hook will not re-render.
   * The default is `Object.is`.
   * @example
   * ```ts
   * const a = useExample((state) => state.a);
   * const b = useExample((state) => state.b, (prev, next) => next > prev);
   * const size = useExample(() => useExample().size());
   * ```
   */
  <U>(select: StateSelector<T, U>, equals?: StateComparer<U>): U;
};

/**
 * A hook that reacts to state changes within a store,
 * combined with a `StoreAPI` object that allows you to update the state.
 * @template T The type of the state.
 */
export type StoreHook<T extends AnyState> = StateSelectorHook<T> & StoreAPI<T>;

const bindHook = <T extends AnyState>(
  store: StoreAPI<T>
): StateSelectorHook<T> => {
  const useSelectValue = (selector: StateSelector<any> = (state) => state) =>
    selector(store.get());
  const useSelectMemoizedValue = (
    selector: StateSelector<any> = (state) => state,
    equals: StateComparer<any> = Object.is
  ) => {
    const oldRef = useRef<any>();
    const select = () => {
      const oldValue = oldRef.current;
      const newValue = selector(store.get());

      if (equals(oldValue, newValue)) {
        return oldValue;
      } else {
        return (oldRef.current = newValue);
      }
    };

    return useSyncExternalStore(store.subscribe, select, select);
  };

  return typeof window === "undefined"
    ? useSelectValue
    : useSelectMemoizedValue;
};

/**
 * Creates a hook that reacts to state changes within a store.
 * The returned value is both a function and a `StoreAPI` object,
 * which means that you call `set` directly on the hook to update the state.
 *
 * **Tip:** Add new setter functions with `tyin/extend` and plugins
 * such as `tyin/plugin-object` or `tyin/plugin-array`.
 * They provide a convenient API that promotes reuse,
 * which helps with reducing your overall bundle size!
 * @param initialState The initial state: can be an object, array, or primitive.
 * @param options (Optional) Configure the default behavior of the store.
 * @template T The type of the state.
 * @example
 * ```ts
 * import storeHook from "tyin/hook";
 * import extend from "tyin/extend";
 * import objectAPI from "tyin/plugin-object";
 *
 * const useExample = extend(storeHook({ a: 1, b: 2 }))
 *  .with(objectAPI())
 *  .seal();
 * ```
 */
export default function storeHook<T extends AnyState>(
  initialState: T,
  options?: StoreOptions<T>
): StoreHook<T> {
  const store = createStore(initialState, options);
  const hook = bindHook(store);

  return Object.assign(hook, store);
}
