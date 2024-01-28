import { expect, test } from "bun:test";
import fc from "fast-check";
import deepHash from "./util-deep-hash";
import { deepEquals } from "bun";

const VERBOSE = false;
const COLLISION_TEST = true;
const ITERATIONS = process.env.CI ? 10_000 : 100_000;

test("clones have the same hash", () => {
  fc.assert(
    fc.property(
      fc.anything(),
      (value) => deepHash(value) === deepHash(structuredClone(value))
    )
  );
});

test("true !== false", () => {
  expect(deepHash(true)).not.toBe(deepHash(false));
});

test("null !== undefined", () => {
  expect(deepHash(null)).not.toBe(deepHash(undefined));
});

test("increment changes", () => {
  for (let i = -10000000; i < 10000000; i += 2) {
    expect(deepHash(i)).not.toBe(deepHash(i + 1));
  }
});

test.if(!process.env.CI)("16-bit range", () => {
  const map = new Map<number, number>();

  for (let i = -32768; i < -32767; i++) {
    const hash = deepHash(i);
    expect(map.has(hash)).toBe(false);
    map.set(hash, i);
  }
});

const fuzzTest = (arb: fc.Arbitrary<any>, count = 1) => {
  return (name: string, runs: number) => {
    test.skipIf(!COLLISION_TEST)(`hash ${name} (x${runs})`, () => {
      let collisions = 0;
      let identical = 0;

      fc.assert(
        fc.property(
          fc.array(arb, { minLength: count, maxLength: count }),
          fc.array(arb, { minLength: count, maxLength: count }),
          (left, right) => {
            if (deepEquals(left, right)) {
              identical++;
              if (VERBOSE) {
                console.log("Identical:", left, "=", right);
              }
              return;
            }

            if (VERBOSE) {
              console.log("Test:", left, "!==", right);
            }

            const leftHash = deepHash(...left);
            const rightHash = deepHash(...right);

            if (leftHash === rightHash) {
              console.error("FAIL:", left, "===", right);
              collisions++;
            }
          }
        ),
        {
          numRuns: runs,
          seed: Date.now(),
          ignoreEqualValues: true,
        }
      );

      console.log(
        `Collisions: ${collisions}/${runs - identical}. ` +
          `(${identical} identical)`
      );
      expect(collisions).toBe(0);
    });
  };
};

fuzzTest(fc.integer({ min: -25_000_000, max: 25_000_000 }))(
  "reasonable integers",
  ITERATIONS
);

fuzzTest(fc.double({ min: -25_000_000, max: 25_000_000 }))(
  "reasonable doubles",
  ITERATIONS
);

fuzzTest(fc.string({ minLength: 1, maxLength: 32 }), 10)(
  "short strings",
  ITERATIONS
);

fuzzTest(fc.string({ minLength: 32, maxLength: 256 }), 10)(
  "long strings",
  ITERATIONS
);

fuzzTest(fc.unicodeString({ minLength: 1, maxLength: 32 }), 10)(
  "short unicode strings",
  ITERATIONS
);

fuzzTest(fc.unicodeString({ minLength: 32, maxLength: 256 }), 10)(
  "long unicode strings",
  ITERATIONS
);

fuzzTest(
  fc.record({
    id: fc.uuid(),
    email: fc.emailAddress({ size: "small" }),
    username: fc.option(fc.asciiString({ minLength: 1, maxLength: 12 })),
  })
)("user states", ITERATIONS);

fuzzTest(
  fc.array(
    fc.record({
      id: fc.uuid(),
      text: fc.string({ minLength: 1, maxLength: 32 }),
      completed: fc.boolean(),
    })
  )
)("todo lists", ITERATIONS);
