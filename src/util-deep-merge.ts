import isObject, { PlainObject } from "./util-is-object";

/**
 * Merge two object types using the following semantics:
 * - Merge keys recursively if both values are plain objects.
 * - Otherwise, overwrite the target type with the source type.
 * - Additional keys in the patch type are appended the target type.
 *
 * Note: Arrays types are not merged.
 */
export type DeepMerged<T extends PlainObject, P extends PlainObject> = {
  [K in keyof T]: K extends keyof P
    ? T[K] extends PlainObject
      ? P[K] extends PlainObject
        ? DeepMerged<T[K], P[K]>
        : Required<P>[K]
      : Required<P>[K]
    : T[K];
} & Omit<P, keyof T>;

/**
 * Merges two objects using the following semantics:
 * - Merge keys recursively if both values are plain objects.
 * - Otherwise, overwrite the target value with the patch value.
 * - Additional keys in the patch object are appended the target object.
 *
 * **Note:** Only plain objects are merged; not arrays or classes.
 * @param target The target object to merge into.
 * @param patch The patch object to merge from.
 * @example
 * ```
 * import storeHook from "tyin";
 * import extend from "tyin/extend";
 * import objectAPI from "tyin/object";
 * import deepMerge from "tyin/util-deep-merge";
 *
 * const useExample = extend(storeHook({ a: 1, b: { c: 2 } }))
 *  .with(objectAPI({ merge: deepMerge }))
 *  .seal();
 * ```
 */
export default function deepMerge<T extends PlainObject, P extends PlainObject>(
  target: T,
  patch: P
): DeepMerged<T, P> {
  const merged: PlainObject = {};

  for (const key of Object.keys(target)) {
    if (!(key in patch)) {
      merged[key] = target[key];
    } else if (isObject(target[key]) && isObject(patch[key])) {
      merged[key] = deepMerge(target[key], patch[key]);
    }
  }

  for (const key of Object.keys(patch)) {
    if (!(key in merged)) {
      merged[key] = patch[key];
    }
  }

  return merged as DeepMerged<T, P>;
}
