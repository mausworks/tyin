import { it, describe, expect, jest } from "bun:test";
import extend from "./extend";
import createStore from "./store";

describe("extensible lifecycle", () => {
  it("adds the with method", () => {
    const host = extend({});

    expect(host.with).toBeDefined();
  });

  it("extends the host using `with`", () => {
    const extendedHost = extend({})
      .with(() => ({ a: 1 }))
      .with(() => ({ b: 2 }));

    expect(extendedHost.a).toEqual(1);
    expect(extendedHost.b).toEqual(2);
  });

  it("supports deep plugins", () => {
    const extended = extend({ a: 1 }).with(() => () => ({ b: 2 }));

    expect(extended.b).toEqual(2);
  });

  it("supports deep plugins when the host is a store hook", () => {
    const fakeStoreHook = Object.assign(jest.fn(), createStore({}));
    const extended = extend(fakeStoreHook)
      .with(() => ({ a: 1 }))
      .with(() => () => ({ b: 2 }));

    expect(extended.a).toEqual(1);
    expect(extended.b).toEqual(2);
    expect(fakeStoreHook).not.toHaveBeenCalled();
  });
});
