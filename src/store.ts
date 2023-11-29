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
export type Settable<T, U = T> = Setter<T, U> | T;
/** A function that subscribes to state changes. */
export type ChangeSubscriber<T> = (oldState: T, newState: T) => void;
/** A function that compares equality of two states. */
export type StateComparer<T> = (oldState: T, newState: T) => boolean;

/** A store that holds a value and notifies subscribers when it changes. */
export type StoreAPI<T extends AnyState = AnyState> = {
  /** Gets the current state. */
  get: () => T;
  /**
   * Sets the next state and notifies subscribers.
   * @param next The next state or a function that computes the next state.
   * @param equals (Optional) A function that compares equality of two states.
   * If the states are equal, the state will not be updated and subscribers will not be notified.
   * The default is `Object.is`.
   */
  set: (next: Settable<T>, equals?: StateComparer<T>) => void;
  /**
   * Subscribes to state changes.
   * Use the returned function to unsubscribe.
   * @param subscriber Called when the state changes.
   */
  subscribe: (subscriber: ChangeSubscriber<T>) => () => void;
};

/** Options for the store. */
export type StoreOptions<T> = {
  /**
   * Compares equality of two states, if the states are equal,
   * the store will not be updated and subscribers will not be notified.
   * The default is `Object.is`.
   */
  equals?: StateComparer<T>;
};

/**
 * A store that holds a state and notifies subscribers of state changes.
 * @param initialState The initial state.
 * @param options Options for the store.
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
