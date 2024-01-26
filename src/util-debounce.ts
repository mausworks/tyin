/**
 * Delay the execution of a function until a timer has elapsed.
 * Repeated calls within the time period resets the timer.
 * @param timeout A minimum time between calls in milliseconds.
 * @param callback A function to call.
 * @example
 * ```ts
 * import storeHook from "tyin/hook";
 * import debounce from "tyin/util-debounce";
 *
 * const useExample = storeHook({ a: 1, b: 2 });
 *
 * useExample.subscribe(debounce((_, newState) => {
 *   fetch("/draft", { method: "PUT", body: JSON.stringify(newState) });
 * }, 5000));
 * ```
 */
export default function debounce<T extends (...args: any[]) => void>(
  callback: T,
  timeout: number
): T {
  if (timeout <= 0) return callback;

  let handle: any;

  return ((...args: any[]) => {
    clearTimeout(handle);
    handle = setTimeout(() => callback(...args), timeout);
  }) as T;
}
