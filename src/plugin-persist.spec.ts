import { it, describe, expect, jest } from "bun:test";
import createStore from "./store";
import persistPlugin from "./plugin-persist";
import pluggable from "./pluggable";

describe("persist plugin", () => {
  it("gets the item on setup", () => {
    const storage = { getItem: jest.fn(), setItem: jest.fn() };
    pluggable(createStore("initial")).with(
      persistPlugin({ name: "test", storage })
    );

    expect(storage.getItem).toHaveBeenCalled();
  });

  it("sets the item on update", () => {
    const storage = { getItem: jest.fn(), setItem: jest.fn() };
    const store = pluggable(createStore("initial")).with(
      persistPlugin({ name: "test", storage })
    );

    store.set("updated");

    expect(storage.setItem).toHaveBeenCalled();
  });
});
