import { it, describe, expect } from "bun:test";
import { nextState } from "./state";

describe("state API", () => {
  it("computes the next state with a value", () => {
    const oldState = "old state";
    const newState = "new state";

    expect(nextState(oldState, newState)).toEqual(newState);
  });

  it("computes the next state with a setter", () => {
    const oldState = "old state";
    const setter = () => "new state";

    expect(nextState(oldState, setter)).toEqual("new state");
  });
});
