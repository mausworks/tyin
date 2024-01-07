import { test, expect } from "bun:test";
import prune from "./util-prune";

test("pruning undefined values", () => {
  const obj = {
    _: undefined,
    a: 0,
    b: 1,
    c: null,
    d: "",
    e: { a: undefined },
    f: false,
    g: undefined,
    h: undefined,
  };

  expect(prune(obj)).toEqual({
    a: 0,
    b: 1,
    c: null,
    d: "",
    e: { a: undefined },
    f: false,
  });
});
