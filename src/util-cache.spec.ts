import { test, expect } from "bun:test";
import createCache from "./util-cache";

test("set permanent value", () => {
  const cache = createCache<number>();

  expect(cache.set("a", 1)).toEqual(1);
  expect(cache.get("a")).toEqual(1);
});

test("set transient value", async () => {
  const cache = createCache<number>();

  expect(cache.set("a", 1, 5)).toEqual(1);
  expect(cache.get("a")).toEqual(1);

  await new Promise((resolve) => setTimeout(resolve, 5.1));

  expect(cache.get("a")).toBeNull();
});

test("set with default lifetime", async () => {
  const cache = createCache<number>({ lifetime: 5 });

  expect(cache.set("a", 1)).toEqual(1);
  expect(cache.get("a")).toEqual(1);

  await new Promise((resolve) => setTimeout(resolve, 5.1));

  expect(cache.get("a")).toBeNull();
});

test("get with factory", async () => {
  const cache = createCache<number>();

  expect(cache.get("a", () => 1)).toEqual(1);
  expect(cache.get("a")).toEqual(1);
});

test("get without factory", () => {
  const cache = createCache<number>();

  expect(cache.get("a")).toBeNull();
});

test("eviction", () => {
  const cache = createCache<number>();

  cache.set("a", 1);
  cache.evict("a");

  expect(cache.get("a")).toBeNull();
});

test("delayed eviction", async () => {
  const cache = createCache<number>();

  cache.set("a", 1);
  cache.evict("a", 5);

  expect(cache.get("a")).toEqual(1);

  await new Promise((resolve) => setTimeout(resolve, 5.1));

  expect(cache.get("a")).toBeNull();
});
