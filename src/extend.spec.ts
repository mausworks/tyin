import { it, describe, expect } from "bun:test";
import extend from "./extend";

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
});
