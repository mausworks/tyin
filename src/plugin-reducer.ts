import { Plugin } from "./extend";
import { AnyState, StoreAPI } from "./store";

/** An action to dispatch to a reducer. */
export type Action<T = string> = { type: T };
/** An action with a payload. */
export type Payload<T = string, P = any> = { type: T; payload: P };
/** A function that listens for actions. */
export type ActionListener<A> = (action: A) => void;

/**
 * A plugin that allows you to dispatch actions to a reducer.
 * @template A The type of the action.
 */
export type ReducerAPI<A> = {
  /**
   * Dispatches an action to the reducer.
   * @param action One of the actions supported of the reducer.
   */
  dispatch: (action: A) => void;
  /**
   * Listens for actions dispatched to the reducer.
   * Use the returned function to unsubscribe.
   *
   * Note: The listener is notifed even if the state update is identical.
   * @param listener Called after an action has been dispatched.
   */
  listen: (listener: ActionListener<A>) => () => void;
};

/**
 * A plugin that allows you to dispatch actions to a reducer.
 * @template T The type of the state.
 * @template A The type of the action.
 */
export type ReducerPlugin<T extends AnyState, A> = Plugin<
  StoreAPI<T>,
  ReducerAPI<A>
>;

/**
 * A function that produces a new state from the current state and an action.
 * @template T The type of the state.
 * @template A The type of the actions.
 */
export type Reducer<T extends AnyState, A> = (state: T, action: A) => T;

/**
 * A plugin that adds a reducer to the store, allowing you to dispatch and listen for actions.
 * @param reducer Produces a new state from the current state and an action.
 * @template T The type of the state.
 * @template A The type of the actions.
 * @example
 * ```ts
 * import storeHook from "tyin/hook";
 * import extend from "tyin/extend";
 * import reducerAPI, { Action, Payload } from "tyin/plugin-reducer";
 *
 * type ExampleAction = Action<"increment"> | Payload<"add", number>;

 * const useExample = extend(storeHook({ count: 0 }))
 *   .with(
 *     reducerAPI((state, action: ExampleAction) => {
 *       switch (action.type) {
 *         case "increment":
 *           return { ...state, count: state.count + 1 };
 *         case "add":
 *           return { ...state, count: state.count + action.payload };
 *         default:
 *           return state;
 *       }
 *     })
 *   )
 *   .seal();
 * ```
 */
const reducerAPI = <T extends AnyState, A>(
  reducer: Reducer<T, A>
): ReducerPlugin<T, A> => {
  let listeners: ActionListener<A>[] = [];

  return (store) => ({
    dispatch: (action) => {
      store.set(reducer(store.get(), action));
      listeners.forEach((listener) => listener(action));
    },
    listen: (listener) => {
      listeners.push(listener);

      return () => {
        listeners = listeners.filter((callback) => callback !== listener);
      };
    },
  });
};

export default reducerAPI;
