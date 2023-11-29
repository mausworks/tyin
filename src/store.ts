/** A function that computes the next state. */
export type Setter<T, U = T> = (oldState: T) => U;
/** A value or a function that computes the next state. */
export type Settable<T, U = T> = T | Setter<T, U>;
/** A function that computes the next state and returns it. */
export type StateUpdate<T> = (newState: Settable<T>) => T;
/** A function that subscribes to state changes. */
export type StateSubscriber<T> = (oldState: T, newState: T) => void;
/** A function that compares equality of two states. */
export type StateComparer<T> = (oldState: T, newState: T) => boolean;
/** A function that selects a value from a state. */
export type StateSelector<T, U = T> = (state: T) => U;

/** A store that holds some value and notifies subscribers of state changes. */
export type StoreAPI<T = any> = {
  /** Gets the current state. */
  get: () => T;
  /** Sets the next state and notifies subscribers. */
  set: (next: Settable<T>) => void;
  /**
   * Subscribes to state changes.
   * Use the returned function to unsubscribe.
   */
  subscribe: (subscriber: StateSubscriber<T>) => () => void;
};

/** Options for the store. */
export type StoreOptions<T> = {
  /**
   * Compares equality of the states. The default is `Object.is`.
   * If the states are equal, the state will not be updated,
   * and subscribers will not be notified.
   */
  equals?: StateComparer<T>;
};

/** Extract the state type of any `StoreAPI`. */
export type StateOf<T extends StoreAPI> = ReturnType<T["get"]>;

/**
 * A store that holds a state and notifies subscribers of state changes.
 * @param initialState The initial state.
 * @param options Options for the store.
 */
export default function createStore<T>(
  initialState: T,
  options: StoreOptions<T> = {}
): StoreAPI<T> {
  const { equals = Object.is } = options;

  let state = initialState;
  let subscribers: StateSubscriber<T>[] = [];

  const get = () => state;

  const notify = (oldState: T, newState: T) =>
    subscribers.forEach((subscriber) => subscriber(oldState, newState));

  const set = (next: Settable<T>) => {
    const oldState = state;
    const newState = next instanceof Function ? next(oldState) : next;

    if (!equals(oldState, newState)) {
      state = newState;

      notify(oldState, newState);
    }
  };

  const subscribe = (subscriber: StateSubscriber<T>) => {
    subscribers.push(subscriber);

    return () => {
      subscribers = subscribers.filter((sub) => sub !== subscriber);
    };
  };

  return { get, set, subscribe };
}
