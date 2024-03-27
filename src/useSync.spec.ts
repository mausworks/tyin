import { act, renderHook } from "@testing-library/react-hooks";
import { describe, it, expect } from "bun:test";
import useSync from "./useSync";

describe("state tracking", () => {
  it("starts in the initial state", () => {
    const fn = () => Promise.resolve();
    const hook = renderHook(() => useSync(fn));
    const [, state] = hook.result.current;

    expect(state).toEqual({
      isLoading: false,
      isDone: false,
      isSuccess: false,
      error: null,
    });
  });

  it("has a loading state for pending promises", async () => {
    const fn = () => new Promise((resolve) => setTimeout(resolve, 100));
    const hook = renderHook(() => useSync(fn));
    const [sync] = hook.result.current;

    // Start the promise:
    sync();

    const [, state] = hook.result.current;

    expect(state).toEqual({
      isLoading: true,
      isDone: false,
      isSuccess: false,
      error: null,
    });
  });

  it("has a success state for resolved promises", async () => {
    const fn = () => Promise.resolve();
    const hook = renderHook(() => useSync(fn));
    const [sync] = hook.result.current;

    await act(async () => await sync());

    const [, state] = hook.result.current;

    expect(state).toEqual({
      isLoading: false,
      isDone: true,
      isSuccess: true,
      error: null,
    });
  });

  it("has an error state for rejected promises", async () => {
    const error = new Error("test");
    const fn = () => Promise.reject(error);
    const hook = renderHook(() => useSync(fn));
    const [sync] = hook.result.current;

    try {
      await act(async () => await sync());
    } catch (error) {
      // Ignore the error.
    }

    const [, state] = hook.result.current;

    expect(state).toEqual({
      isLoading: false,
      isDone: true,
      isSuccess: false,
      error,
    });
  });
});
