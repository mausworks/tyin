import { useCallback, useEffect, useRef, useState } from "react";
import useSync, { SyncState } from "./useSync";

/**
 * A function that hydrates a state upstream or downstream.
 * Note: This function is expected to be a sync function from `tyin/plugin-sync`,
 * but can be any async function as long as it handles its own promise deduplication and caching.
 */
export type Hydrator = (...args: any[]) => Promise<any>;

export type HydrateOptions = {
  /**
   * Hydrate when the component mounts.
   *
   * Defaults to `true`.
   */
  onMount?: boolean;
  /**
   * Hydrate when the window or tab is (re)focused.
   *
   * Defaults to `false`.
   */
  onFocused?: boolean;
  /**
   * Hydrate when connection is regained.
   *
   * Defaults to `true`.
   */
  onOnline?: boolean;
  /**
   * Hydrate at the given interval, in milliseconds.
   * Set to `Infinity` to disable the interval.
   *
   * Defaults to `Infinity`.
   */
  interval?: number;
  /**
   * How long it takes before data is considered stale, in milliseconds.
   */
  staleDuration?: number;
};

export type HydrationState = SyncState & {
  isStale: boolean;
  isHydrated: boolean;
};

/**
 * Calls the given sync function on mount to hydrate a state, and then again when the `args` change.
 * Depending on the options, it may also be called when the window or tab is (re)focused,
 * when the connection is regained, or at a regular interval.
 *
 * The returned promise is the result of the last call to the sync function,
 * augmented with information about the hydration state.
 * @param hydrate A function that syncs a state; either upstream or downstream.
 * This function is expected to be a function from `tyin/plugin-sync`,
 * but it can be any async function as long as it handles its own deduplication.
 * @param args The arguments to pass to the sync function, if any.
 * @param options (Optional) Configure when to hydrate the state.
 * @example
 * ```tsx
 * import useHydrate from "tyin/plugin-sync/useHydrate";
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
 *   return <NoteList notes={userNotes} isLoading={hydration.isLoading} />;
 * };
 * ```
 */
export default function useHydrate<T extends Hydrator>(
  hydrate: T,
  args: Parameters<T>,
  options: HydrateOptions = {}
): ReturnType<T> & HydrationState {
  const { interval = Infinity, staleDuration = 0 } = options;

  const staleHandle = useRef<number | undefined>(undefined);
  const [isStale, setIsStale] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const [sync, syncState] = useSync(hydrate);
  const [promise, setPromise] = useState(new Promise<any>(() => {}));
  const run = useCallback(async () => {
    const promise = sync(...args);
    setPromise(promise);

    await promise;

    setIsStale(false);
    setIsHydrated(true);

    window.clearTimeout(staleHandle.current);

    if (staleDuration > 0 && staleDuration !== Infinity) {
      staleHandle.current = window.setTimeout(() => {
        setIsStale(true);
      }, staleDuration);
    }
  }, [sync, staleDuration, ...args]);

  useEffect(() => {
    const handle = staleHandle.current;
    return () => window.clearTimeout(handle);
  }, []);

  useEffect(() => {
    if (!isHydrated && (options.onMount ?? true)) run();
  }, [run, isHydrated, options.onMount]);

  useEffect(() => {
    if (!options.onFocused) return;

    addEventListener("focus", run);
    return () => removeEventListener("focus", run);
  }, [run, options.onFocused]);

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

  return Object.assign(promise as ReturnType<T>, syncState, {
    isStale,
    isHydrated,
  });
}
