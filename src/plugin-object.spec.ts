import { it, describe, expect } from "bun:test";
import createStore from "./store";
import objectAPI from "./plugin-object";
import extend from "./extend";

describe("object API", () => {
  it("has size", () => {
    const store = extend(createStore({ a: 1, b: 2 })).with(objectAPI());

    expect(store.size()).toEqual(2);
  });

  it("deletes keys", () => {
    const store = extend(
      createStore<Partial<{ a: number }>>({
        a: 1,
      })
    ).with(objectAPI());

    store.remove("a");

    expect(store.get()).toEqual({});
  });

  it("assigns state", () => {
    const store = extend(
      createStore<Record<string, number>>({
        a: 1,
      })
    ).with(objectAPI());

    store.patch({ a: 2, b: 2 });

    expect(store.get()).toEqual({ a: 2, b: 2 });
  });
});
