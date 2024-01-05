export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type DeepPatch<T extends object> = DeepPartial<T> | Record<string, any>;

type Coalesce<T, P, V = undefined> = V extends T ? P : T;

type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];
type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

/**
 * Merge the two object using the following semantics:
 * - Merge keys recursively if both values are objects.
 * - Otherwise, overwrite the target value with the source value.
 *
 * Note: Arrays are not merged, they are overwritten.
 */
export type DeepMerged<
  T extends Record<string, unknown>,
  P extends Record<string, unknown>
> = {
  [K in RequiredKeys<T | P>]: K extends keyof T
    ? K extends keyof P
      ? T[K] | P[K]
      : T[K]
    : P[K];
} & {
  [K in OptionalKeys<T | P>]?: K extends keyof T
    ? K extends keyof P
      ? T[K] | P[K]
      : T[K]
    : P[K];
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/**
 * Merge the two object using the following semantics:
 * - Merge keys recursively if both values are objects.
 * - Otherwise, overwrite the target value with the source value.
 * - Additional keys in the patch are appended the target.
 *
 * Note: Arrays are not merged, they are overwritten.
 * @param target The target object to merge into.
 * @param patch The patch object to merge from.
 * @example
 * ```
 * import storeHook from "tyin/store";
 * import extend from "tyin/extend";
 * import objectAPI from "tyin/object";
 * import deepMerge from "tyin/util-deep-merge";
 *
 * const useExample = extend(storeHook({ a: 1, b: { c: 2 } }))
 *  .with(objectAPI({ merge: deepMerge }))
 *  .seal();
 * ```
 */
export default function deepMerge<
  T extends Record<string, any>,
  P extends DeepPatch<T>
>(target: T, patch: P): DeepMerged<T, P> {
  const merged: Record<string, any> = {};

  for (const key of Object.keys(target)) {
    if (!(key in patch)) {
      merged[key] = target[key];
    } else if (Array.isArray(target[key])) {
      merged[key] = patch[key];
    } else if (isObject(target[key]) && isObject(patch[key])) {
      merged[key] = deepMerge(target[key], patch[key]);
    }
  }

  for (const key of Object.keys(patch)) {
    if (!(key in merged)) merged[key] = patch[key];
  }

  return merged as DeepMerged<T, P>;
}
