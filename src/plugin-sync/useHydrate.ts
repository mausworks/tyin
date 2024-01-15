import { useCallback, useEffect, useRef, useState } from "react";
import useSync from "./useSync";

/**
 * A function that hydrates a state upstream or downstream.
 * Note: This function is expected to be a sync function from `tyin/plugin-sync`,
 * but can be any async function as long as it handles its own promise deduplication and caching.
 */
export type Hydrator = (...args: any[]) => Promise<void>;

export type HydrateOptions = {
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

export type HydrationState = {
  isStale: boolean;
  isHydrated: boolean;
};

/**
 * Calls the given sync function immediately to hydrate the state, and then again when the `args` change.
 * Depending on the options, it may also be called when the window or tab is (re)focused,
 * when the connection is regained, or at a regular interval.
 *
 * Note: The `hydrate` function is expected to be a function from `tyin/plugin-sync`,
 * but it can be any async function as long as it handles its own deduplication.
 * @param hydrate A function that syncs a state; either upstream or downstream.
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
 *   const state = useHydrate(useUserNotes.sync.pull, [userId], {
 *     onOnline: true,
 *     onFocus: true,
 *   });
 *
 *   return <NoteList notes={userNotes} isLoading={state.isLoading} />;
 * };
 * ```
 */
export default function useHydrate<T extends Hydrator>(
  hydrate: T,
  args: Parameters<T>,
  options: HydrateOptions = {}
) {
  const { interval = Infinity, staleDuration = 0 } = options;

  const staleHandle = useRef<number | undefined>(undefined);
  const [isStale, setIsStale] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const [sync, syncState] = useSync(hydrate);
  const run = useCallback(async () => {
    await sync(...args);

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
    if (!isHydrated) run();
  }, [run, isHydrated]);

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

  return { ...syncState, isStale };
}
