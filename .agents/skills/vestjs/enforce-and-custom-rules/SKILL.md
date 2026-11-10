---
name: enforce-and-custom-rules
description: Schemas and reusable `enforce` rules in Vest 6. Read it for `create(..., schema)`, `enforce.shape`, `enforce.loose`, `enforce.isArrayOf`, `enforce.record`, `enforce.lazy`, `enforce.tuple`, parser chains, `enforce.condition`, `enforce.extend`, `compose`, `enforce.context()`, or typing custom rules.
---

# Vest 6 enforce rules and schemas

The invariants live in the router, [`../SKILL.md`](../SKILL.md).

## Decide the level of reuse

| Need                                               | Use                                                  |
| -------------------------------------------------- | ---------------------------------------------------- |
| the structure and types of the whole input         | a schema: `create(callback, enforce.shape({ ... }))` |
| custom logic in one test                           | `enforce(value).condition((value) => ...)`           |
| a named rule used across fields or suites          | `enforce.extend({ ruleName })`                       |
| several existing rules that always travel together | `compose(ruleA, ruleB)`                              |

Start at the lowest row that fits. A rule used once stays a `condition`.

## Schema suites

```ts
import { create, enforce, test } from 'vest';

const userSchema = enforce.shape({
  username: enforce.isString(),
  age: enforce.isNumeric().toNumber(),
  tags: enforce.isArrayOf(enforce.isString()),
});

export const userSuite = create((data) => {
  test('age', 'You must be 18 or older', () => {
    enforce(data.age).greaterThanOrEquals(18);
  });
}, userSchema);

const result = userSuite.run({ username: 'alice', age: '30', tags: [] });
```

- The schema runs before the tests, and its field names type `test`, `only`, `focus` and the selectors.
- A parser such as `.toNumber()` or `.trim()` gives the field two types: `suite.run(...)` takes the input type (`string | number` for `age`), and the callback and `result.value` use the output type (`number`).
- A focused run validates only the focused part of the schema, so `suite.only('age').run({ age: '30' })` accepts a partial input. Decide a submit from a full `suite.run(data)`.
- In Vest 6.3.4 a schema violation fails its field without a message: `hasErrors(field)` is `true` and `getErrors(field)` is empty. A message for the user comes from a `test`.
- `enforce.shape` rejects unknown keys; `enforce.loose` allows them. `enforce.record`, `enforce.lazy` and `enforce.tuple` are for dynamic keys, recursive structures and fixed-length arrays.

## `condition` and `extend`

A custom rule returns a boolean, or `{ pass, message }` where `message` is a string or a function that returns one. Write the message for the person who reads it.

```ts
enforce(data.email).condition((value) => ({
  pass: typeof value === 'string' && value.endsWith('@example.com'),
  message: 'Use your company email address',
}));
```

`enforce.extend({ ... })` registers named rules. Each rule receives the enforced value first, then the arguments of the call.

Type the rules by merging into the global `n4s.EnforceMatchers` interface, in the file that registers them:

```ts
import { enforce } from 'vest';

const customRules = {
  isCompanyEmail: (value: string) => value.endsWith('@example.com'),
  isWithinRange: (value: number, min: number, max: number) =>
    value >= min && value <= max,
};

enforce.extend(customRules);

declare global {
  namespace n4s {
    interface EnforceMatchers {
      isCompanyEmail: (value: string) => boolean;
      isWithinRange: (value: number, min: number, max: number) => boolean;
    }
  }
}
```

## `compose`

```ts
import { compose } from 'n4s';
import { enforce } from 'vest';

export const isValidAge = compose(
  enforce.isNumber().greaterThanOrEquals(18),
  enforce.isNumber().lessThan(120)
);

export const personSchema = enforce.shape({ age: isValidAge });
```

Each argument is a rule chain that starts from a type rule such as `enforce.isNumber()`; a bare `enforce.greaterThanOrEquals(18)`, as the docs sample has it, does not exist in Vest 6.3.4. `isValidAge.run(20).pass` is `true`.

Vest 6.3.4 exports `compose` from `n4s`, its `enforce` package, and from no `vest` entry point. `n4s` is a transitive dependency, so add it to the project's dependencies at the version Vest uses (`npm ls n4s` prints it); a strict package manager such as pnpm fails the import otherwise. When composed `shape` rules extend one another, use `enforce.loose` for the parts that must accept extra keys.

## `enforce.context()`

Inside a custom rule, `enforce.context()` reads the surrounding schema value, for example a sibling field through `context?.parent()?.value`. It couples the rule to the shape of the object, so pass the other value as a rule argument when the call site has it.

## Answer shape

Name the reuse level first, then show the rule with its TypeScript declaration when the project uses TypeScript.

The docs for these rules are in the "Enforce (Assertions)" section of [`https://vestjs.dev/llms.txt`](https://vestjs.dev/llms.txt); the guide `typed-schemas` under `https://vestjs.dev/docs/guides/` shows a full schema flow.
