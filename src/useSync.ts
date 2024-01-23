import { useCallback, useState } from "react";

export type SyncState = {
  /** Whether the sync function has settled. */
  isDone: boolean;
  /** Whether the sync function is currently running. */
  isLoading: boolean;
  /** Whether the sync function was successful. */
  isSuccess: boolean;
  /** The last error thrown by the sync function. */
  error: unknown;
};

/**
 * Returns an synchronous version of the given async function,
 * along with the state of the function.
 * @param fn The function to use.
 * @example
 * ```tsx
 * import useSync from "tyin/useSync";
 * import useNewNotes from "@/stores/useNewNotes";
 *
 * const SyncNotesButton = () => {
 *   const count = useNewNotes((notes) => notes.length);
 *   const [push, state] = useSync(useNewNotes.sync.push);
 *
 *   return (
 *     <>
 *       <SaveButton
 *         title={`Save ${count} new notes`}
 *         onClick={push}
 *         disabled={state.isLoading}
 *       />
 *       {state.error && <ErrorMessage error={state.error} />}
 *     </>
 *   );
 * }
 * ```
 */
export default function useSync<T extends (...args: any[]) => Promise<any>>(
  fn: T
): readonly [T, SyncState] {
  const [state, setState] = useState(initialState);

  const sync = useCallback(
    async (...args: Parameters<T>) => {
      setState(startingState);

      try {
        const result = await fn(...args);
        setState(successState);
        return result;
      } catch (error) {
        setState(errorState(error));
        throw error;
      }
    },
    [fn]
  );

  return [sync as T, state] as const;
}

const initialState: SyncState = Object.freeze({
  isLoading: false,
  isDone: false,
  isSuccess: false,
  error: null,
});

const startingState = Object.freeze({
  ...initialState,
  isLoading: true,
});

const successState = Object.freeze({
  ...initialState,
  isDone: true,
  isSuccess: true,
});

const errorState = (error: unknown): SyncState =>
  Object.freeze({ isLoading: false, isDone: true, isSuccess: false, error });
