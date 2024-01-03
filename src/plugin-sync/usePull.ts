import { useCallback, useEffect, useState } from "react";
import { StoreHook } from "../hook";
import { AnyState } from "../store";

export type SyncFunction = (...args: any[]) => Promise<unknown>;

export type SyncAPIWithPull<PULL extends SyncFunction> = {
  sync: { pull: PULL };
};

export type PullStatus = "idle" | "loading" | "error" | "success";

/**
 * Automatically pull the state from the when the component mounts.
 * @param useStore The store to pull from.
 * @param args The args to pass to the pull function.
 */
export default function usePull<T extends AnyState, P extends SyncFunction>(
  useStore: StoreHook<T> & SyncAPIWithPull<P>,
  ...args: Parameters<P>
) {
  const [status, setStatus] = useState<PullStatus>("idle");
  const [error, setError] = useState<unknown>(null);
  const state = useStore();

  const attempt = useCallback(() => {
    setStatus("loading");

    useStore.sync
      .pull(...args)
      .then(() => {
        setStatus("success");
        setError(null);
      })
      .catch((error) => {
        setStatus("error");
        setError(error);
      });
  }, [useStore.sync.pull]);

  useEffect(attempt, [useStore.sync.pull]);

  return { state, error, status, retry: attempt };
}
