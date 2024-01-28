import { describe, test, expect } from "bun:test";
import isObject from "./util-is-object";

describe("supported examples", () => {
  test("empty object", () => expect(isObject({})).toBe(true));
  test("object with keys", () => expect(isObject({ a: 1 })).toBe(true));
  test("object with null prototype", () =>
    expect(isObject(Object.create(null))).toBe(true));
});

describe("unsupported examples", () => {
  test("array", () => expect(isObject([])).toBe(false));
  test("class", () => expect(isObject(new Event("click"))).toBe(false));
  test("null", () => expect(isObject(null)).toBe(false));
  test("undefined", () => expect(isObject(undefined)).toBe(false));
  test("string", () => expect(isObject("")).toBe(false));
  test("number", () => expect(isObject(0)).toBe(false));
  test("boolean", () => expect(isObject(false)).toBe(false));
  test("function", () => expect(isObject(() => {})).toBe(false));
});
