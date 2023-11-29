import { it, describe, expect } from "bun:test";
import createStore from "./store";
import objectAPI from "./plugin-object";
import pluggable from "./pluggable";

describe("object API", () => {
  it("has size", () => {
    const store = pluggable(createStore({ a: 1, b: 2 })).with(objectAPI());

    expect(store.size()).toEqual(2);
  });

  it("deletes keys", () => {
    const store = pluggable(
      createStore<Partial<{ a: number }>>({
        a: 1,
      })
    ).with(objectAPI());

    store.remove("a");

    expect(store.get()).toEqual({});
  });

  it("assigns state", () => {
    const store = pluggable(
      createStore<Record<string, number>>({
        a: 1,
      })
    ).with(objectAPI());

    store.patch({ a: 2, b: 2 });

    expect(store.get()).toEqual({ a: 2, b: 2 });
  });
});
