/**
 * Ensures that a function is called only once for a given duration.
 * The last repeated call within the time period is delayed until the time period has elapsed.
 * @param duration A minimum time between calls in milliseconds.
 * @param callback A function to call.
 * @example
 * ```ts
 * import storeHook from "tyin/hook";
 * import extend from "tyin/extend";
 * import throttle from "tyin/util-throttle";
 *
 * const useScrollX = extend(storeHook(0))
 *   .with((store) => {
 *      const onScroll = throttle(() => {
 *        store.set(window.scrollX);
 *      }, 50);
 *
 *      window.addEventListener("scroll", onScroll);
 *    })
 *    .seal();
 * ```
 */
export default function throttle<T extends (...args: any[]) => void>(
  callback: T,
  duration: number
): T {
  if (duration <= 0) return callback;

  let throttled = false;
  let lastArgs: any[] | null = null;

  const restore = () => {
    if (!lastArgs) {
      throttled = false;
    } else {
      callback(...lastArgs);
      setTimeout(restore, duration);

      lastArgs = null;
    }
  };

  return ((...args: any[]) => {
    if (throttled) {
      lastArgs = args;
    } else {
      callback(...args);
      throttled = true;

      setTimeout(restore, duration);
    }
  }) as T;
}
