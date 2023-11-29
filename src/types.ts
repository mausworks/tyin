/** An object with keys */
export type ObjectLike = { [key: string]: any };

/** Keeps only the required fields of an object. */
export type Pruned<T extends ObjectLike | null> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
};

/** Keeps only the optional fields of an object. */
export type Extras<T extends ObjectLike | null> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
};

/** Only the required keys of an object. */
export type RequiredKey<T extends ObjectLike | null> = Pruned<T>[keyof T];

/** Only the optional keys of an object. */
export type OptionalKey<T extends ObjectLike | null> = Extras<T>[keyof T];

/** Simplifies the type to make it more aesthetically pleasing in e.g. intellisense */
export type Unify<T> = T extends ObjectLike ? { [K in keyof T]: T[K] } : T;
