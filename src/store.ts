/** The supported state types. */
export type AnyState =
  | string
  | number
  | boolean
  | null
  | undefined
  | Record<string, any>
  | AnyState[];

/** A function that computes the next state. */
export type Setter<T, U = T> = (oldState: T) => U;
/** A value or a function that computes the next state. */
export type Settable<T, U = T> = T | Setter<T, U>;
/** A function that is called when the state changes. */
export type ChangeSubscriber<T> = (oldState: T, newState: T) => void;
/** A function that compares the equality of the old and new state.*/
export type StateComparer<T> = (oldState: T, newState: T) => boolean;

/** A store that notifies its subscribers when the state changes. */
export type StoreAPI<T extends AnyState = AnyState> = {
  /** Gets the current state. */
  get: () => T;
  /**
   * Sets the next state and notifies subscribers of the update.
   * @param next The next state or a function that computes the next state.
   * @param equals (Optional) Compares the equality of the old and new state before the state update.
   * Updates that are deemed equal are ignored.
   * Defaults to the `equals` option passed when creating the store.
   */
  set: (next: Settable<T>, equals?: StateComparer<T>) => void;
  /**
   * Subscribes to state changes.
   * Use the returned function to unsubscribe.
   * @param subscriber Called after the state changes.
   */
  subscribe: (subscriber: ChangeSubscriber<T>) => () => void;
};

/** Defines the default behavior of the store. */
export type StoreOptions<T> = {
  /**
   * The default equality comparer for the store.
   *
   * The default is `Object.is`.
   */
  equals?: StateComparer<T>;
};

/**
 * Creates a store that notifies its subscribers when the state changes.
 * @param initialState The initial state: can be an object, array, or primitive.
 * @param options (Optional) Configure the default behavior of the store.
 * @template T The type of the state.
 * @example
 * ```ts
 * import createStore from "tyin/store";
 * import extend from "tyin/extend";
 * import objectAPI from "tyin/plugin-object";
 *
 * const exampleStore = extend(createStore({ a: 1, b: 2 }))
 *   .with(objectAPI())
 *   .seal();
 * ```
 */
export default function createStore<T extends AnyState>(
  initialState: T,
  options?: StoreOptions<T>
): StoreAPI<T> {
  let state = initialState;
  let subscribers: ChangeSubscriber<T>[] = [];

  return {
    get: () => state,
    set: (next, equals = options?.equals || Object.is) => {
      const oldState = state;
      const newState = typeof next === "function" ? next(oldState) : next;

      if (!equals(oldState, newState)) {
        state = newState;
        subscribers.forEach((callback) => callback(oldState, newState));
      }
    },
    subscribe: (subscriber) => {
      subscribers.push(subscriber);

      return () => {
        subscribers = subscribers.filter((callback) => callback !== subscriber);
      };
    },
  };
}
