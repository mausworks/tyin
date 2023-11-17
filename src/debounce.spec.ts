import { test, expect, jest } from "bun:test";
import debounce from "./debounce";

test("debounce", async () => {
  const callback = jest.fn();
  const debounced = debounce(3, callback);

  debounced();

  expect(callback).not.toHaveBeenCalled();

  await new Promise((resolve) => setTimeout(resolve, 10));

  expect(callback).toHaveBeenCalledTimes(1);
});
