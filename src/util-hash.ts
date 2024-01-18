const signature = (input: unknown) => {
  if (input === null) return 0xffffffe0;
  else if (typeof input === "string") return 0xffffffe1;
  else if (typeof input === "number") return 0xffffffe2;
  else if (typeof input === "boolean") return 0xffffffe3;
  else if (Array.isArray(input)) return 0xffffffe4;
  else if (typeof input === "object") return 0xffffffe5;
  else if (typeof input === "bigint") return 0xffffffe6;
  else if (typeof input === "function") return 0xffffffe7;
  else if (typeof input === "symbol") return 0xffffffe8;
  else return 0xffffffe9;
};

function* serialize(input: unknown): Iterable<number> {
  if (input === null) {
    yield 0xbadbad;
  } else if (input === undefined) {
    yield 0x1def9d;
  } else if (input === true) {
    yield 0x17d0e5;
  } else if (input === false) {
    yield 0x0ff0ff;
  } else if (input === -0) {
    yield 0xffffffff;
    yield 0;
  } else if (typeof input === "number") {
    yield input & 0xffffffff;
    yield (input >>> 32) & 0xffffffff;
  } else if (typeof input === "bigint") {
    yield Number(input & 0xffffffffn);
    yield Number((input >> 32n) & 0xffffffffn);
  } else if (typeof input === "string") {
    for (let i = 0; i < input.length; i += 4) {
      yield (input.charCodeAt(i + 0) << 24) |
        (input.charCodeAt(i + 1) << 16) |
        (input.charCodeAt(i + 2) << 8) |
        (input.charCodeAt(i + 3) << 0);
    }
  } else if (Array.isArray(input)) {
    yield input.length;
    for (const value of input) {
      yield* serialize(value);
    }
  } else if (typeof input === "object") {
    for (const [key, value] of Object.entries(input)) {
      yield* serialize(key);
      yield* serialize(value);
    }
  } else if (typeof input === "function") {
    yield input.length;
  }
}

/**
 * Hashes the given input string using the public domain cyrb53a algorithm
 * created by https://github.com/bryc.
 * @param input A sequence of 32-bit numbers to hash.
 * @param seed (Optional) A seed to use for the hash.
 */
const cyrb53a = (input: Iterable<number>, seed = 0) => {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;

  for (const val of input) {
    h1 = Math.imul(h1 ^ val, 0x85ebca77);
    h2 = Math.imul(h2 ^ val, 0xc2b2ae3d);
  }

  h1 ^= Math.imul(h1 ^ (h2 >>> 15), 0x735a2d97);
  h2 ^= Math.imul(h2 ^ (h1 >>> 15), 0xcaf649a9);
  h1 ^= h2 >>> 16;
  h2 ^= h1 >>> 16;

  return 2097152 * (h2 >>> 0) + (h1 >>> 11);
};

/**
 * Hashes the given args using the CYRB53A algorithm.
 *
 * @param args The arguments to hash.
 */
const hash = <T>(...args: T[]) =>
  cyrb53a(serialize(args.map((arg) => [signature(arg), arg])));

export default hash;
