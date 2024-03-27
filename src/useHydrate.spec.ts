import { jest, describe, expect, it } from "bun:test";
import { renderHook, act } from "@testing-library/react-hooks";
import useHydrate from "./useHydrate";

describe("on mount option", () => {
  it("hydrates immediately on mount by default", () => {
    const hydrate = jest.fn(() => Promise.resolve());

    renderHook(() => useHydrate(hydrate, []));

    expect(hydrate).toHaveBeenCalledTimes(1);
  });

  it("hydrates immediately when onMount is true", () => {
    const hydrate = jest.fn(() => Promise.resolve());

    renderHook(() =>
      useHydrate(hydrate, [], {
        onMount: true,
        onFocus: false,
        onOnline: false,
      })
    );

    expect(hydrate).toHaveBeenCalledTimes(1);
  });

  it("does not hydrate immediately when onMount is false", () => {
    const hydrate = jest.fn(() => Promise.resolve());

    renderHook(() =>
      useHydrate(hydrate, [], {
        onMount: false,
        onFocus: false,
        onOnline: false,
      })
    );

    expect(hydrate).not.toHaveBeenCalled();
  });
});

describe("onFocus option", () => {
  it("does not hydrate on focus by default", async () => {
    const hydrate = jest.fn(() => Promise.resolve());
    const hook = renderHook(() =>
      useHydrate(hydrate, [], {
        onMount: false,
        onOnline: false,
      })
    );

    await act(async () => {
      window.dispatchEvent(new Event("focus"));

      // There shouldn't be any next update:
      expect(hook.waitForNextUpdate({ timeout: 100 })).rejects.toThrow();
    });

    expect(hydrate).not.toHaveBeenCalled();
  });

  it("hydrates on focus when onFocus is true", async () => {
    const hydrate = jest.fn(() => Promise.resolve());
    const hook = renderHook(() =>
      useHydrate(hydrate, [], {
        onFocus: true,
        onMount: false,
        onOnline: false,
      })
    );

    await act(async () => {
      window.dispatchEvent(new Event("focus"));
      await hook.waitForNextUpdate();
    });

    expect(hydrate).toHaveBeenCalledTimes(1);
  });

  it("does not hydrate on focus when onFocus is false", async () => {
    const hydrate = jest.fn(() => Promise.resolve());
    const hook = renderHook(() =>
      useHydrate(hydrate, [], {
        onFocus: false,
        onMount: false,
        onOnline: false,
      })
    );

    await act(async () => {
      window.dispatchEvent(new Event("focus"));

      // There shouldn't be any next update:
      expect(hook.waitForNextUpdate({ timeout: 100 })).rejects.toThrow();
    });

    expect(hydrate).not.toHaveBeenCalled();
  });
});

describe("onOnline option", () => {
  it("hydrates on online by default", async () => {
    const hydrate = jest.fn(() => Promise.resolve());
    const hook = renderHook(() =>
      useHydrate(hydrate, [], {
        onMount: false,
        onFocus: false,
      })
    );

    await act(async () => {
      window.dispatchEvent(new Event("online"));

      // There shouldn't be any next update:
      expect(hook.waitForNextUpdate({ timeout: 100 })).rejects.toThrow();
    });

    expect(hydrate).toHaveBeenCalledTimes(1);
  });

  it("hydrates on online when onOnline is true", async () => {
    const hydrate = jest.fn(() => Promise.resolve());
    const hook = renderHook(() =>
      useHydrate(hydrate, [], {
        onOnline: true,
        onMount: false,
        onFocus: false,
      })
    );

    await act(async () => {
      window.dispatchEvent(new Event("online"));

      // There shouldn't be any next update:
      expect(hook.waitForNextUpdate({ timeout: 100 })).rejects.toThrow();
    });

    expect(hydrate).toHaveBeenCalledTimes(1);
  });

  it("does not hydrate on online when onOnline is false", async () => {
    const hydrate = jest.fn(() => Promise.resolve());
    const hook = renderHook(() =>
      useHydrate(hydrate, [], {
        onOnline: false,
        onMount: false,
        onFocus: false,
      })
    );

    await act(async () => {
      window.dispatchEvent(new Event("online"));

      // There shouldn't be any next update:
      expect(hook.waitForNextUpdate({ timeout: 100 })).rejects.toThrow();
    });

    expect(hydrate).not.toHaveBeenCalled();
  });
});

describe("staleTime option", () => {
  it("can rehydrate immediately if stale time is 0", async () => {
    const hydrate = jest.fn(() => Promise.resolve());
    const hook = renderHook(() =>
      useHydrate(hydrate, [], {
        staleTime: 0,
        onMount: true,
        onFocus: true,
        onOnline: false,
      })
    );

    await act(async () => {
      await hook.waitFor(() => hook.result.current.isHydrated);

      // Should rehydrate immediately because the stale time is 0:
      window.dispatchEvent(new Event("focus"));

      await hook.waitForNextUpdate();
    });

    expect(hydrate).toHaveBeenCalledTimes(2);
  });

  it("does not rehydrate if the stale time has not elapsed", async () => {
    const hydrate = jest.fn(() => Promise.resolve());
    const hook = renderHook(() =>
      useHydrate(hydrate, [], {
        staleTime: 1000,
        // Use onMount for the initial hydration:
        onMount: true,
        // Use the onFocus event as a way to trigger the rehydration:
        onFocus: true,
        onOnline: false,
      })
    );

    await act(async () => {
      await hook.waitFor(() => hook.result.current.isHydrated);

      // This has no effect since the stale time has not elapsed.
      window.dispatchEvent(new Event("focus"));

      // There shouldn't be any next update:
      expect(hook.waitForNextUpdate({ timeout: 100 })).rejects.toThrow();
    });

    expect(hydrate).toHaveBeenCalledTimes(1);
  });

  it("can rehydrate if the stale time has elapsed", async () => {
    const hydrate = jest.fn(() => Promise.resolve());
    const hook = renderHook(() =>
      useHydrate(hydrate, [], {
        staleTime: 5,
        // Use onMount for the initial hydration:
        onMount: true,
        // Use the onFocus event as a way to trigger the rehydration:
        onFocus: true,
        onOnline: false,
      })
    );

    await act(async () => {
      await hook.waitFor(() => hook.result.current.isHydrated);

      // This has no effect since the stale time has not elapsed.
      window.dispatchEvent(new Event("focus"));

      await new Promise((resolve) => setTimeout(resolve, 6));

      // Should rehydrate because the stale time has elapsed:
      window.dispatchEvent(new Event("focus"));

      await hook.waitForNextUpdate();
    });

    expect(hydrate).toHaveBeenCalledTimes(2);
  });
});

describe("args changed", () => {
  it("rehydrates when args change regardless of staleTime", async () => {
    const hydrate = jest.fn((gen: number) => Promise.resolve(gen));
    const hook = renderHook(
      (gen: number) =>
        useHydrate(hydrate, [gen], {
          staleTime: Infinity,
          onMount: true,
          onFocus: false,
          onOnline: false,
        }),
      { initialProps: 1 }
    );

    await act(async () => {
      await hook.waitFor(() => hook.result.current.isHydrated);

      hook.rerender(2);

      await hook.waitForNextUpdate();
    });

    expect(hydrate).toHaveBeenCalledTimes(2);
    expect(hydrate).toHaveBeenNthCalledWith(1, 1);
    expect(hydrate).toHaveBeenNthCalledWith(2, 2);
  });

  it("does not rehydrate when the args do not change", async () => {
    const hydrate = jest.fn((gen: number) => Promise.resolve(gen));
    const hook = renderHook(
      (gen: number) =>
        useHydrate(hydrate, [gen], {
          onMount: true,
          onFocus: false,
          onOnline: false,
        }),
      { initialProps: 1 }
    );

    await act(async () => {
      await hook.waitFor(() => hook.result.current.isHydrated);

      hook.rerender(1);

      // There shouldn't be any next update:
      expect(hook.waitForNextUpdate({ timeout: 100 })).rejects.toThrow();
    });

    expect(hydrate).toHaveBeenCalledTimes(1);
  });
});
