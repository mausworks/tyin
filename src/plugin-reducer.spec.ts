import { it, describe, expect } from "bun:test";

import createStore from "./store";
import extend from "./extend";
import reducerAPI, { Payload } from "./plugin-reducer";

type ExampleAction = Payload<"ADD", number>;

describe("reducer API", () => {
  it("reduces state", () => {
    const store = extend(createStore({ a: 1 })).with(
      reducerAPI((state, action: ExampleAction) => {
        switch (action.type) {
          case "ADD":
            return { ...state, a: state.a + action.payload };
          default:
            return state;
        }
      })
    );

    store.dispatch({ type: "ADD", payload: 1 });

    expect(store.get()).toEqual({ a: 2 });
  });
});
