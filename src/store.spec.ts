import { it, describe, expect, jest } from "bun:test";
import createStore from "./store";

describe("store API", () => {
  it("has the initial state", () => {
    const store = createStore("initial state");

    expect(store.get()).toEqual("initial state");
  });

  it("updates the state", () => {
    const store = createStore<string>("initial state");

    store.set("updated state");

    expect(store.get()).toEqual("updated state");
  });

  it("notifies subscribers of state changes", () => {
    const store = createStore<string>("initial state");

    const subscriber = jest.fn();

    store.subscribe(subscriber);

    store.set("updated state");

    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it("unsubscribes subscribers", () => {
    const store = createStore<string>("initial state");

    const subscriber = jest.fn().mockReset();

    const unsubscribe = store.subscribe(subscriber);

    unsubscribe();

    store.set("updated state");

    expect(subscriber).not.toHaveBeenCalled();
  });
});
