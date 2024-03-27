import { test, expect } from "bun:test";
import deepMerge from "./util-deep-merge";

test("merge deep", () => {
  const source = {
    a: 1,
    b: { c: 2, x: [1] },
    c: null,
    d: undefined,
    e: undefined,
  };
  const patch = {
    a: 2,
    b: { d: 3, x: [2, 3] },
    c: {},
    d: undefined,
    e: {},
    f: 4,
  };

  const result = deepMerge(source, patch);

  expect(result).toEqual({
    a: 2,
    b: { x: [2, 3], c: 2, d: 3 },
    c: {},
    d: undefined,
    e: {},
    f: 4,
  });
});
