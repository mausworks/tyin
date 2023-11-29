import { it, describe, expect } from "bun:test";
import createStore from "./store";
import arrayAPI from "./plugin-array";
import pluggable from "./pluggable";

describe("array API", () => {
  it("pushes values", () => {
    const store = pluggable(createStore(["initial"])).with(arrayAPI());

    store.push("new", "newer");
    store.push("newest");

    expect(store.get()).toEqual(["initial", "new", "newer", "newest"]);
  });

  it("unshifts values", () => {
    const store = pluggable(createStore(["initial"])).with(arrayAPI());

    store.unshift("new", "newer");
    store.unshift("newest");

    expect(store.get()).toEqual(["newest", "new", "newer", "initial"]);
  });

  it("filters values", () => {
    const store = pluggable(createStore(["first", "second"])).with(arrayAPI());

    store.filter((value) => value === "second");

    expect(store.get()).toEqual(["second"]);
  });

  it("sorts values", () => {
    const store = pluggable(createStore(["b", "a", "c", "1"])).with(arrayAPI());

    store.sort((left, right) => left.localeCompare(right));

    expect(store.get()).toEqual(["1", "a", "b", "c"]);
  });

  it("reverses values", () => {
    const store = pluggable(createStore(["a", "b"])).with(arrayAPI());

    store.reverse();

    expect(store.get()).toEqual(["b", "a"]);
  });

  it("maps values", () => {
    const store = pluggable(createStore(["a", "b"])).with(arrayAPI());

    store.map((value) => value.toUpperCase());

    expect(store.get()).toEqual(["A", "B"]);
  });
});
