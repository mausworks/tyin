import { test, expect, jest } from "bun:test";
import debounce from "./util-debounce";

test("debounce", async () => {
  const callback = jest.fn();
  const debounced = debounce(3, callback);

  debounced();
  debounced();
  debounced();

  expect(callback).not.toHaveBeenCalled();

  await new Promise((resolve) => setTimeout(resolve, 3.01));

  expect(callback).toHaveBeenCalledTimes(1);
});