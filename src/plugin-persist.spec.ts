import { it, describe, expect, jest } from "bun:test";
import createStore from "./store";
import persist from "./plugin-persist";
import pluggable from "./pluggable";

describe("persist plugin", () => {
  it("gets the item on setup", () => {
    const storage = { getItem: jest.fn(), setItem: jest.fn() };
    pluggable(createStore("initial")).with(persist({ name: "test", storage }));

    expect(storage.getItem).toHaveBeenCalled();
  });

  it("sets the item on update", () => {
    const storage = { getItem: jest.fn(), setItem: jest.fn() };
    const store = pluggable(createStore("initial")).with(
      persist({ name: "test", storage })
    );

    store.set("updated");

    expect(storage.setItem).toHaveBeenCalled();
  });

  it("sets the update after the delay", async () => {
    const storage = { getItem: jest.fn(), setItem: jest.fn() };
    const store = pluggable(createStore("initial")).with(
      persist({ name: "test", storage, delay: 5 })
    );

    store.set("updated");

    expect(storage.setItem).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(storage.setItem).toHaveBeenCalled();
  });
});
