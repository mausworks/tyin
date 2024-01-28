import { test, expect, describe } from "bun:test";
import deepEquals from "./util-deep-equals";

describe("value equality", () => {
  test("null", () => expect(deepEquals(null, null)).toBe(true));
  test("undefined", () => expect(deepEquals(undefined, undefined)).toBe(true));
  test("string", () => expect(deepEquals("a", "a")).toBe(true));
  test("number", () => expect(deepEquals(1, 1)).toBe(true));
  test("boolean", () => expect(deepEquals(true, true)).toBe(true));
  test("empty array", () => expect(deepEquals([], [])).toBe(true));
  test("empty object", () => expect(deepEquals({}, {})).toBe(true));
});

describe("value inequality", () => {
  test("null vs undefined", () =>
    expect(deepEquals(null, undefined)).toBe(false));
  test("null vs string", () => expect(deepEquals(null, "a")).toBe(false));
  test("null vs number", () => expect(deepEquals(null, 1)).toBe(false));
  test("null vs boolean", () => expect(deepEquals(null, true)).toBe(false));
  test("null vs array", () => expect(deepEquals(null, [])).toBe(false));
  test("null vs object", () => expect(deepEquals(null, {})).toBe(false));
  test("undefined vs string", () =>
    expect(deepEquals(undefined, "a")).toBe(false));
  test("undefined vs number", () =>
    expect(deepEquals(undefined, 1)).toBe(false));
  test("undefined vs boolean", () =>
    expect(deepEquals(undefined, true)).toBe(false));
  test("undefined vs array", () =>
    expect(deepEquals(undefined, [])).toBe(false));
  test("undefined vs object", () =>
    expect(deepEquals(undefined, {})).toBe(false));
  test("string vs number", () => expect(deepEquals("a", 1)).toBe(false));
  test("string vs boolean", () => expect(deepEquals("a", true)).toBe(false));
  test("string vs array", () => expect(deepEquals("a", [])).toBe(false));
  test("string vs object", () => expect(deepEquals("a", {})).toBe(false));
  test("number vs boolean", () => expect(deepEquals(1, true)).toBe(false));
  test("number vs array", () => expect(deepEquals(1, [])).toBe(false));
  test("number vs object", () => expect(deepEquals(1, {})).toBe(false));
  test("boolean vs array", () => expect(deepEquals(true, [])).toBe(false));
  test("boolean vs object", () => expect(deepEquals(true, {})).toBe(false));
  test("array vs object", () => expect(deepEquals([], {})).toBe(false));
});

describe("array equality", () => {
  test("single element", () => expect(deepEquals([1], [1])).toBe(true));
  test("multiple elements", () =>
    expect(deepEquals([1, 2, 3], [1, 2, 3])).toBe(true));
  test("nested arrays", () =>
    expect(deepEquals([1, [2, 3], 4], [1, [2, 3], 4])).toBe(true));
});

describe("array inequality", () => {
  test("different lengths", () =>
    expect(deepEquals([1, 2], [1, 2, 3])).toBe(false));
  test("different elements", () =>
    expect(deepEquals([1, 2, 3], [1, 2, 4])).toBe(false));
  test("different nested arrays", () =>
    expect(deepEquals([1, [2, 3], 4], [1, [2, 4], 4])).toBe(false));
});

describe("object equality", () => {
  test("single key", () => expect(deepEquals({ a: 1 }, { a: 1 })).toBe(true));
  test("multiple keys", () =>
    expect(deepEquals({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true));
  test("nested objects", () =>
    expect(deepEquals({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } })).toBe(
      true
    ));
});

describe("object inequality", () => {
  test("different keys", () =>
    expect(deepEquals({ a: 1 }, { b: 1 })).toBe(false));
  test("different values", () =>
    expect(deepEquals({ a: 1 }, { a: 2 })).toBe(false));
  test("different nested objects", () =>
    expect(deepEquals({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 3 } })).toBe(
      false
    ));
});
