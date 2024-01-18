import { expect, test } from "bun:test";
import fc from "fast-check";
import hash from "./util-hash";
import { deepEquals } from "bun";

const optionalish = <T>(gen: fc.Arbitrary<T>) =>
  fc.oneof(gen, fc.constant(null), fc.constant(undefined));

const userState = fc.record({
  id: fc.integer(),
  name: optionalish(fc.string()),
  email: fc.emailAddress(),
  age: optionalish(fc.integer()),
  admin: fc.boolean(),
  verified: fc.boolean(),
});

test.skip("user state", () =>
  fc.assert(
    fc.property(
      userState,
      userState,
      (left, right) => hash(left) !== hash(right)
    )
  ));

test("integers", () =>
  fc.assert(
    fc.property(
      fc.integer(),
      fc.integer(),
      (left, right) => left === right || hash(left) !== hash(right)
    ),
    {
      numRuns: 1000000,
    }
  ));

test.skip("anything", () =>
  fc.assert(
    fc.property(
      fc.array(fc.anything()),
      fc.array(fc.anything()),
      (left, right) =>
        deepEquals(left, right as any) || hash(...left) !== hash(...right)
    ),
    {
      numRuns: 1000000,
    }
  ));

// [[0],[5e-324]]
