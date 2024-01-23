import { test, expect, jest } from "bun:test";
import throttle from "./util-throttle";

test("throttle", async () => {
  const callback = jest.fn();
  const throttled = throttle(callback, 3);

  throttled();

  expect(callback).toHaveBeenCalledTimes(1);

  throttled();
  throttled();
  throttled();

  await new Promise((resolve) => setTimeout(resolve, 3.01));

  throttled();
  throttled();
  throttled();

  expect(callback).toHaveBeenCalledTimes(2);

  await new Promise((resolve) => setTimeout(resolve, 3.01));

  expect(callback).toHaveBeenCalledTimes(3);
});
