import { useCallback, useEffect, useState } from "react";
import { PullFunction } from "./index";
import { StoreHook } from "../hook";
import { AnyState } from "../store";

export type SyncAPIWithPull<P extends PullFunction<any>> = {
  sync: { pull: P };
};

export type PullStatus = "idle" | "loading" | "error" | "success";

export default function usePull<T extends AnyState, P extends PullFunction<T>>(
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
