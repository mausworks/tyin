/**
 * Calls the function once the specified delay has passed since the last call.
 * @param delay The delay in milliseconds.
 * If the delay is zero (or less), the function will be called immediately
 * without a `setTimeout`.
 * @param fn The function to debounce. Return values are ignored.
 */
export default function debounce<T extends (...args: any[]) => void>(
  delay: number,
  fn: T
): T {
  if (delay <= 0) return fn;

  let handle: any;

  return ((...args: any[]) => {
    clearTimeout(handle);
    handle = setTimeout(() => fn(...args), delay);
  }) as T;
}
