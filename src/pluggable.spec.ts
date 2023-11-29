import { it, describe, expect } from "bun:test";
import pluggable from "./pluggable";

describe("pluggable lifecycle", () => {
  it("adds the with method", () => {
    const host = pluggable({});

    expect(host.with).toBeDefined();
  });

  it("extends the host using `with`", () => {
    const extendedHost = pluggable({})
      .with(() => ({ a: 1 }))
      .with(() => ({ b: 2 }));

    expect(extendedHost.a).toEqual(1);
    expect(extendedHost.b).toEqual(2);
  });
});
