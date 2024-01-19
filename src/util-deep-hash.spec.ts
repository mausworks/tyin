import { expect, test } from "bun:test";
import fc from "fast-check";
import deepHash from "./util-deep-hash";
import { deepEquals } from "bun";

const VERBOSE = false;
const COLLISION_TEST = true;

const collisionTest = (arb: fc.Arbitrary<any>, count = 1) => {
  return (name: string, runs: number) => {
    test.skipIf(!COLLISION_TEST)(`hash ${name} (x${runs})`, () => {
      let failures = 0;

      fc.assert(
        fc.property(
          fc.array(arb, { minLength: count, maxLength: count }),
          fc.array(arb, { minLength: count, maxLength: count }),
          (left, right) => {
            if (deepEquals(left, right)) return;

            if (VERBOSE) {
              console.log("Test:", left, "!==", right);
            }

            const leftHash = deepHash(...left);
            const rightHash = deepHash(...right);

            if (leftHash === rightHash) {
              console.error("FAIL:", left, "===", right);
              failures++;
            }
          }
        ),
        { numRuns: runs }
      );

      console.log(`Collision test status: ${failures}/${runs} failed.`);
      expect(failures).toBe(0);
    });
  };
};

collisionTest(fc.bigInt(), 1)("bigInt", 10000);
collisionTest(fc.boolean(), 1)("boolean", 10000);
collisionTest(fc.char(), 1)("char", 10000);
collisionTest(fc.double(), 1)("double", 10000);
collisionTest(fc.float(), 1)("float", 10000);
collisionTest(fc.integer(), 1)("integer", 10000);
collisionTest(fc.string(), 1)("string", 10000);
collisionTest(fc.array(fc.anything()), 1)("array", 10000);
collisionTest(fc.object(), 1)("object", 10000);
collisionTest(fc.anything(), 1)("anything", 10000);
