import { test, expect, jest } from "bun:test";
import sync from "./plugin-sync";
import createStore from "./store";
import extend from "./extend";

test("push calls the setup function with the extra args and returns the result", async () => {
  const push = jest.fn((a: number) => Promise.resolve("result"));
  const store = extend(createStore({ a: 1 }))
    .with(sync({ push: push as any }))
    .seal();

  const result = await store.sync.push(2);

  expect(push).toHaveBeenCalledWith({ a: 1 }, 2);
  expect(result).toEqual("result");
});

test("pull calls the setup function with the given args and sets the store to the result", async () => {
  const pull = jest.fn((a: number) => Promise.resolve({ a }));
  const store = extend(createStore({ a: 1 }))
    .with(sync({ pull }))
    .seal();

  await store.sync.pull(2);

  expect(pull).toHaveBeenCalledWith(2);
  expect(store.get()).toEqual({ a: 2 });
});

test("delete calls the setup function with the extra args and returns the result", async () => {
  const del = jest.fn((..._: any[]) => Promise.resolve("result"));
  const store = extend(createStore({ a: 1 }))
    .with(sync({ delete: del as any }))
    .seal();

  const result = await store.sync.delete(2);

  expect(del).toHaveBeenCalledWith({ a: 1 }, 2);
  expect(result).toEqual("result");
});

test("the sync API only contains the setup functions", () => {
  const none = extend(createStore({ a: 1 }))
    .with(sync({}))
    .seal();
  const withPush = extend(createStore({ a: 1 }))
    .with(sync({ push: () => Promise.resolve() }))
    .seal();
  const withPull = extend(createStore({ a: 1 }))
    .with(sync({ pull: (a: number) => Promise.resolve({ a }) }))
    .seal();
  const withDelete = extend(createStore({ a: 1 }))
    .with(sync({ delete: () => Promise.resolve() }))
    .seal();

  expect(none.sync).toEqual({});
  expect(withPush.sync).toEqual({ push: expect.any(Function) });
  expect(withPull.sync).toEqual({ pull: expect.any(Function) });
  expect(withDelete.sync).toEqual({ delete: expect.any(Function) });
});

test("pull deduplication", async () => {
  const pull = jest.fn((a: number) => Promise.resolve({ a }));
  const store = extend(createStore({ a: 1 }))
    .with(sync({ pull }))
    .seal();

  await Promise.all([
    store.sync.pull(1),
    store.sync.pull(1),
    store.sync.pull(1),
  ]);

  expect(pull).toHaveBeenCalledTimes(1);
});

test("push deduplication", async () => {
  const push = jest.fn((..._: any[]) => Promise.resolve());
  const store = extend(createStore({ a: 1 }))
    .with(sync({ push: push as any }))
    .seal();

  await Promise.all([
    store.sync.push(1),
    store.sync.push(1),
    store.sync.push(1),
  ]);

  expect(push).toHaveBeenCalledTimes(1);
});

test("delete deduplication", async () => {
  const del = jest.fn((..._: any[]) => Promise.resolve());
  const store = extend(createStore({ a: 1 }))
    .with(sync({ delete: del as any }))
    .seal();

  await Promise.all([
    store.sync.delete(1),
    store.sync.delete(1),
    store.sync.delete(1),
  ]);

  expect(del).toHaveBeenCalledTimes(1);

  await store.sync.delete(1);

  expect(del).toHaveBeenCalledTimes(2);
});
