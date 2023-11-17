import { it, describe, expect } from "bun:test";
import createStore from "./store";
import objectPreset from "./preset-object";

describe("object API", () => {
  it("has size", () => {
    const store = createStore({ a: 1, b: 2 }).with(objectPreset());

    expect(store.size()).toEqual(2);
  });

  it("deletes keys", () => {
    const store = createStore<Partial<{ a: number }>>({
      a: 1,
    }).with(objectPreset());

    store.remove("a");

    expect(store.get()).toEqual({});
  });

  it("assigns state", () => {
    const store = createStore<Record<string, number>>({
      a: 1,
    }).with(objectPreset());

    store.assign({ a: 2, b: 2 });

    expect(store.get()).toEqual({ a: 2, b: 2 });
  });
});
