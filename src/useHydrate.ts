import { useCallback, useEffect, useRef, useState } from "react";
import useSync, { SyncState } from "./useSync";

/**
 * A function that hydrates a state somewhere.
 *
 * Note: This function is expected to be a sync function from `tyin/plugin-sync`,
 * but it can be any async function as long as it handles its own promise deduplication.
 */
export type Hydrator = (...args: any[]) => Promise<any>;

/** Configures the `useHydrate` hook. */
export type HydrateOptions = {
  /**
   * Hydrate when the component mounts.
   *
   * Defaults to `true`.
   */
  onMount?: boolean;
  /**
   * Rehydrate when the window or tab is focused.
   *
   * Defaults to `false`.
   */
  onFocus?: boolean;
  /**
   * Rehydrate when connection status changes to online.
   *
   * Defaults to `true`.
   */
  onOnline?: boolean;
  /**
   * Rehydrate at a given interval, in milliseconds.
   * Set to `Infinity` to disable the interval.
   *
   * Defaults to `Infinity`.
   */
  interval?: number;
  /**
   * How long before the result is considered stale and can be rehydrated, in milliseconds.
   * If set to `Infinity`, rehydration will be disabled entirely, regardless of the other options.
   *
   * Defaults to `0`.
   */
  staleTime?: number;
};

export type HydrationState = {
  /** Whether the data has gone stale and can be refreshed. */
  isStale: boolean;
  /** Whether the data has been hydrated at least once. */
  isHydrated: boolean;
};

export type Hydration<T extends Promise<any>> = T & HydrationState & SyncState;

/**
 * Calls the given sync function on mount to hydrate a state, and then again when the `args` change.
 * Depending on the options, it may also be called when the window or tab is focused,
 * when the connection is regained, or at a regular interval.
 *
 * The returned promise is the result of the last call to the sync function,
 * augmented with information about the hydration state.
 * @param hydrate A function that syncs a state.
 * This function is expected to be a function from `tyin/plugin-sync`,
 * but it can be any async function as long as it handles its own promise deduplication.
 * @param args The arguments to pass to the sync function, if any. When changed, the state will be rehydrated.
 * @param options (Optional) Configure when to hydrate the state.
 * @example
 * ```tsx
 * import { use } from "react";
 * import useHydrate from "tyin/useHydrate";
 * import useUserNotes from "@/stores/useUserNotes";
 *
 * type UserNoteListProps = { userId: string };
 *
 * const UserNoteList = ({ userId }: UserNoteListProps) => {
 *   const notes = useUserNotes();
 *   const hydration = useHydrate(useUserNotes.sync.pull, [userId], {
 *     onOnline: true,
 *     onFocus: true,
 *   });
 *
 *   use(hydration);
 *
 *   return <NoteList notes={notes} isLoading={hydration.isLoading} />;
 * };
 * ```
 */
export default function useHydrate<T extends Hydrator>(
  hydrate: T,
  args: Parameters<T>,
  options: HydrateOptions = {}
): Hydration<ReturnType<T>> {
  const { interval = Infinity, staleTime = 0 } = options;
  const [sync, syncState] = useSync(hydrate);
  const [isStale, setIsStale] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const [promise, setPromise] = useState(new Promise<any>(() => {}));
  const staleHandle = useRef<number | undefined>(undefined);

  const run = useCallback(async () => {
    if (syncState.isLoading || !isStale) return;

    const promise = sync(...args);
    setPromise(promise);

    await promise;

    setIsStale(false);
    setIsHydrated(true);

    window.clearTimeout(staleHandle.current);

    if (staleTime > 0 && staleTime !== Infinity) {
      staleHandle.current = window.setTimeout(() => {
        setIsStale(true);
      }, staleTime);
    }
  }, [sync, staleTime, ...args]);

  useEffect(() => {
    if (!isHydrated && (options.onMount ?? true)) run();
  }, [run, isHydrated, options.onMount]);

  useEffect(() => setIsStale(true), args);
  useEffect(() => {
    if (isHydrated) run();
  }, [...args, run, isHydrated]);

  useEffect(() => {
    if (!options.onFocus) return;

    addEventListener("focus", run);
    return () => removeEventListener("focus", run);
  }, [run, options.onFocus]);

  useEffect(() => {
    if (interval <= 0 || interval === Infinity) return;

    const handle = setInterval(() => document.hidden || run(), interval);
    return () => clearInterval(handle);
  }, [run, interval]);

  useEffect(() => {
    if (!options.onOnline) return;

    window.addEventListener("online", run);
    return () => window.removeEventListener("online", run);
  }, [run, options.onOnline]);

  useEffect(() => {
    const handle = staleHandle.current;
    return () => window.clearTimeout(handle);
  }, []);

  return Object.assign(promise as ReturnType<T>, syncState, {
    isStale,
    isHydrated,
  });
}
