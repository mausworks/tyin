import { it, describe, expect } from "bun:test";
import createStore from "./store";
import arrayPreset from "./preset-array";

describe("array API", () => {
  it("pushes values", () => {
    const store = createStore(["initial"]).with(arrayPreset());

    store.push("new", "newer");
    store.push("newest");

    expect(store.get()).toEqual(["initial", "new", "newer", "newest"]);
  });

  it("unshifts values", () => {
    const store = createStore(["initial"]).with(arrayPreset());

    store.unshift("new", "newer");
    store.unshift("newest");

    expect(store.get()).toEqual(["newest", "new", "newer", "initial"]);
  });

  it("filters values", () => {
    const store = createStore(["first", "second"]).with(arrayPreset());

    store.filter((value) => value === "second");

    expect(store.get()).toEqual(["second"]);
  });

  it("sorts values", () => {
    const store = createStore(["b", "a", "c", "1"]).with(arrayPreset());

    store.sort((left, right) => left.localeCompare(right));

    expect(store.get()).toEqual(["1", "a", "b", "c"]);
  });

  it("clears values", () => {
    const store = createStore(["initial"]).with(arrayPreset());

    store.clear();

    expect(store.get()).toEqual([]);
  });

  it("reverses values", () => {
    const store = createStore(["a", "b"]).with(arrayPreset());

    store.reverse();

    expect(store.get()).toEqual(["b", "a"]);
  });
});
