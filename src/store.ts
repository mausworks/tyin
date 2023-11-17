import { pluggable, Pluggable, Plugin } from "./plugin";
import { nextState, Settable, StateComparer, StateSubscriber } from "./state";

/** A store that holds some value and notifies subscribers of state changes. */
export type StoreAPI<T = any> = {
  /** Gets the current state. */
  get: () => T;
  /** Replaces the current state with a new one. */
  set: (newState: Settable<T>) => void;
  /**
   * Subscribes to state changes.
   * Use the returned function to unsubscribe.
   */
  subscribe: (subscriber: StateSubscriber<T>) => () => void;
};

/** A store that holds a state and notifies subscribers of state changes. */
export type Store<T> = Pluggable<StoreAPI<T>>;

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

/** A plugin that adds functionality to a store. */
export type StorePlugin<T, P = void> = Plugin<StoreAPI<T>, P>;

/**
 * A store that holds a state and notifies subscribers of state changes.
 * @param initialState The initial state.
 * @param options Options for the store.
 */
export default function createStore<T>(
  initialState: T,
  { equals = Object.is }: StoreOptions<T> = {}
): Store<T> {
  let state = initialState;
  let subscribers: StateSubscriber<T>[] = [];

  const get = () => state;

  const notify = (oldState: T, newState: T) =>
    subscribers.forEach((subscriber) => subscriber(oldState, newState));

  const set = (newState: Settable<T>) => {
    const resolved = nextState(state, newState);

    if (equals(state, resolved)) return;

    const oldState = state;
    state = resolved;

    notify(oldState, resolved);
  };

  const subscribe = (subscriber: StateSubscriber<T>) => {
    subscribers.push(subscriber);

    return () => {
      subscribers = subscribers.filter((sub) => sub !== subscriber);
    };
  };

  return pluggable({ get, set, subscribe });
}
