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
