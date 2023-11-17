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

/** Determines whether a value is probably a setter. */
export const isSetter = (value: Settable<any>): value is Setter<any> =>
  typeof value === "function";

/** Computes the next state. */
export const nextState = <T>(oldState: T, newState: Settable<T>): T =>
  isSetter(newState) ? newState(oldState) : newState;
