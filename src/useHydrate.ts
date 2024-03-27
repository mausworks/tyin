import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

/** A promise augmented with the hydration state and sync state. */
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
  const {
    interval = Infinity,
    onMount = true,
    onFocus = false,
    onOnline = true,
  } = options;

  // Memoize args by its contents, not its reference.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  args = useMemo(() => args, args);
  const argsRef = useRef(args);

  const [sync, syncState] = useSync(hydrate);
  const [promise, setPromise] = useState(forever());
  const [isHydrated, setIsHydrated] = useState(false);
  const staleTimeRef = useRef(options.staleTime ?? 0);
  const staleHandle = useRef<any>();
  const staleRef = useRef(true);
  const loadingRef = useRef(false);
  const hydratedRef = useRef(false);

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    if (!staleRef.current) return;

    loadingRef.current = true;

    const promise = sync(...argsRef.current);
    setPromise(promise);
    await promise;

    loadingRef.current = false;

    if (staleTimeRef.current > 0) {
      staleRef.current = false;
    }

    hydratedRef.current = true;
    setIsHydrated(true);
    clearTimeout(staleHandle.current);

    if (staleTimeRef.current > 0 && staleTimeRef.current !== Infinity) {
      staleHandle.current = setTimeout(() => {
        staleRef.current = true;
      }, staleTimeRef.current);
    }
  }, [sync]);

  useEffect(() => {
    if (!onMount || isHydrated) return;

    load();
  }, [load, onMount, isHydrated]);

  useEffect(() => {
    argsRef.current = args;

    if (hydratedRef.current) {
      staleRef.current = true;
      load();
    }
  }, [load, args]);

  useEffect(() => {
    if (!onFocus) return;

    addEventListener("focus", load);
    return () => removeEventListener("focus", load);
  }, [load, onFocus]);

  useEffect(() => {
    if (!onOnline) return;

    addEventListener("online", load);
    return () => removeEventListener("online", load);
  }, [load, onOnline]);

  useEffect(() => {
    if (interval <= 0 || interval === Infinity) return;

    const handle = setInterval(() => document.hidden || load(), interval);
    return () => clearInterval(handle);
  }, [load, interval]);

  useEffect(() => {
    const handle = staleHandle.current;
    return () => clearTimeout(handle);
  }, []);

  return Object.assign(promise as ReturnType<T>, syncState, {
    isStale: staleRef.current,
    isHydrated,
  });
}

/** A promise that never resolves. */
const forever = () => new Promise(() => {});
