/** A function that computes the next state. */
export type Setter<T, U = T> = (oldState: T) => U;
/** A value or a function that computes the next state. */
export type Settable<T, U = T> = T | Setter<T, U>;
/** A function that subscribes to state changes. */
export type ChangeSubscriber<T> = (oldState: T, newState: T) => void;
/** A function that compares equality of two states. */
export type StateComparer<T> = (oldState: T, newState: T) => boolean;
/** A function that returns a value from a state. */
export type StateSelector<T, U = T> = (state: T) => U;

/** A store that holds some value and notifies subscribers of state changes. */
export type StoreAPI<T = any> = {
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
   */
  subscribe: (subscriber: ChangeSubscriber<T>) => () => void;
};

/** Options for the store. */
export type StoreOptions<T> = {
  /**
   * Compares equality of the states. The default is `Object.is`.
   * If the states are equal, the state will not be updated,
   * and subscribers will not be notified.
   * The default is `Object.is`.
   */
  equals?: StateComparer<T>;
};

/**
 * A store that holds a state and notifies subscribers of state changes.
 * @param initialState The initial state.
 * @param options Options for the store.
 */
export default function createStore<T>(
  initialState: T,
  options?: StoreOptions<T>
): StoreAPI<T> {
  let state = initialState;
  let subscribers: ChangeSubscriber<T>[] = [];

  return {
    get: () => state,
    set: (next, equals = options?.equals || Object.is) => {
      const oldState = state;
      const newState = next instanceof Function ? next(oldState) : next;

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
