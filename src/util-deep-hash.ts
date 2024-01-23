import isObject from "./util-is-object";

const view = new DataView(new ArrayBuffer(8));

function* serialize(input: unknown): Iterable<number> {
  if (input === undefined) {
    yield 0x1def9d;
  } else if (input === null) {
    yield 0xbadbad;
  } else if (input === true) {
    yield 0x17d0e5;
  } else if (input === false) {
    yield 0x0ff0ff;
  } else if (typeof input === "number") {
    yield 0xfffffff1;
    view.setFloat64(0, input);
    yield view.getInt32(0);
    yield view.getInt16(4);
    yield view.getInt16(6);
  } else if (typeof input === "bigint") {
    yield 0xfffffff2;
    yield* serialize(input.toString(36));
  } else if (typeof input === "string") {
    yield 0xfffffff3;
    yield input.length | 0;
    for (let i = 0; i < input.length; i += 2) {
      yield input.charCodeAt(i) | (input.charCodeAt(i + 1) << 16);
    }
  } else if (Array.isArray(input)) {
    yield 0xfffffff4;
    for (let i = 0; i < input.length; i++) {
      yield i;
      yield* serialize(input[i]);
    }
  } else if (isObject(input)) {
    yield 0xfffffff5;
    for (const [key, value] of Object.entries(input)) {
      yield* serialize(key);
      yield* serialize(value);
    }
  }

  yield 0xee00ff;
}

/**
 * Hashes the a sequence of 32-bit numbers using the CYRB53A algorithm
 * created by https://github.com/bryc (with slight modifications).
 * @param input A sequence of 32-bit numbers to hash.
 * @param seed (Optional) A seed to use for the hash.
 */
const cyrb53a = (input: Iterable<number>, seed = 0) => {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;

  for (const value of input) {
    h1 = Math.imul(h1 ^ value, 0x85ebca77);
    h2 = Math.imul(h2 ^ value, 0xc2b2ae3d);
  }

  h1 ^= Math.imul(h1 ^ (h2 >>> 15), 0x735a2d97);
  h2 ^= Math.imul(h2 ^ (h1 >>> 15), 0xcaf649a9);
  h1 ^= h2 >>> 16;
  h2 ^= h1 >>> 16;

  return 2097152 * (h2 >>> 0) + (h1 >>> 11);
};

/**
 * Serializes the given arguments into a sequence of numbers,
 * then hashes the sequence using the cyrb53a algorithm
 * producing a number containing 53 bits of entropy.
 *
 * **Note:** This function does not hash anything that is not
 * a plain object, array, string, number, boolean, null, or undefined.
 *
 * @param args The arguments to hash.
 */
const deepHash = (...args: any[]) => cyrb53a(serialize(args));

export default deepHash;
