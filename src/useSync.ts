import { useCallback, useState } from "react";

export type AsyncFunction = (...args: any[]) => Promise<any>;

export type SyncState = {
  isDone: boolean;
  isLoading: boolean;
  isSuccess?: boolean;
  error?: unknown;
};

const initialState: SyncState = {
  isLoading: false,
  isDone: false,
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
export default function useSync<T extends AsyncFunction>(
  fn: T
): readonly [T, SyncState] {
  const [state, setState] = useState(initialState);

  const sync = useCallback(
    async (...args: Parameters<T>) => {
      setState({ isLoading: true, isDone: false });

      try {
        const result = await fn(...args);
        setState({ isLoading: false, isDone: true, isSuccess: true });
        return result;
      } catch (error) {
        setState({ isLoading: false, isDone: true, isSuccess: false, error });
        throw error;
      }
    },
    [fn]
  );

  return [sync as T, state] as const;
}
