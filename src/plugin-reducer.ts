import { Plugin } from "./extend";
import { AnyState, StoreAPI } from "./store";

/** An action to dispatch to a reducer */
export type Action<T = string> = { type: T };

/** An action with a payload */
export type Payload<T = string, P = any> = Action<T> & { payload: P };

/**
 * A plugin that allows you to dispatch actions to a reducer.
 * @template A The type of the action.
 */
export type ReducerAPI<A> = {
  dispatch: (action: A) => void;
};

/**
 * A plugin that allows you to dispatch actions to a reducer.
 * @template T The type of the state.
 * @template A The type of the action.
 */
export type ReducerPlugin<T extends AnyState, A extends Action> = Plugin<
  StoreAPI<T>,
  ReducerAPI<A>
>;

/**
 * A reducer function that takes a state and an action,
 * and returns a new state.
 * @template T The type of the state.
 * @template A The type of the actions.
 */
export type Reducer<T extends AnyState, A> = (state: T, action: A) => T;

/**
 * A plugin that adds a reducer to the store, allowing you to dispatch actions.
 * @param reducer A reducer function that takes a state and an action,
 * and returns a new state.
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
const reducerAPI =
  <T extends AnyState, A extends Action>(
    reducer: Reducer<T, A>
  ): ReducerPlugin<T, A> =>
  (store) => ({
    dispatch: (action) => store.set(reducer(store.get(), action)),
  });

export default reducerAPI;
