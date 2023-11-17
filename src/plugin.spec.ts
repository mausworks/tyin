import { it, describe, expect } from "bun:test";
import { pluggable } from "./plugin";

describe("pluggable lifecycle", () => {
  it("adds the with and seal methods", () => {
    const host = pluggable({});

    expect(host.with).toBeDefined();
    expect(host.seal).toBeDefined();
  });

  it("extends the host using `with`", () => {
    const extendedHost = pluggable({})
      .with(() => ({ a: 1 }))
      .with(() => ({ b: 2 }));

    expect(extendedHost.a).toEqual(1);
    expect(extendedHost.b).toEqual(2);
  });

  it("seals the object", () => {
    const host = pluggable({}).seal();

    expect((host as any).with).not.toBeDefined();
    expect((host as any).seal).not.toBeDefined();
  });
});
