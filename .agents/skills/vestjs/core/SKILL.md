---
name: core
description: Default structure of a Vest 6 suite. Read it for a first suite, a "proper example", `create` versus `create(..., schema)`, `run` versus `runStatic`, `test` and `enforce` basics, or a refactor of an existing suite.
---

# Vest 6 core workflow

The invariants live in the router, [`../SKILL.md`](../SKILL.md). This file is the default suite they add up to.

## Build a suite

Build in this order; the suite is done when every step is present:

1. A type for the data the suite validates.
2. `create((data) => { ... })` in its own file, separate from UI code. Add a schema as the second argument when the input needs structural validation or parsing; [`../enforce-and-custom-rules/SKILL.md`](../enforce-and-custom-rules/SKILL.md) covers schemas.
3. One `test(fieldName, message, body)` per rule. The field name stays stable between runs, and the message is the text the user reads.
4. `enforce(value)` chains in each test body.
5. The run that matches the caller, from the table below.

```ts
import { create, enforce, test } from 'vest';

type Signup = { username?: string; email?: string };

export const signupSuite = create((data: Signup) => {
  test('username', 'Username is required', () => {
    enforce(data.username).isNotBlank();
  });

  test('username', 'Username has at least 3 characters', () => {
    enforce(data.username).longerThanOrEquals(3);
  });

  test('email', 'Enter a valid email', () => {
    enforce(data.email).matches(/^[^@\s]+@[^@\s]+$/);
  });
});
```

Tests of one field run in order, and by default the field stops at its first failure, so put the cheapest rule first.

## Choose the run

| Caller                                      | Call                                                            |
| ------------------------------------------- | --------------------------------------------------------------- |
| the user edited one field                   | `suite.only('email').run(data)`                                 |
| several fields, or a named group            | `suite.focus({ only: ['email', 'username'] }).run(data)`        |
| submit                                      | `const result = await suite.run(data)`, then `result.isValid()` |
| server request, script, unit test of a rule | `suite.runStatic(data)`                                         |
| the form is reset                           | `suite.reset()`                                                 |

`suite.run()` and its focused forms keep state: each run merges into the results of earlier runs, which is why a focused run still reports the whole form. `suite.runStatic()` starts from nothing every time.

The run returns the result at once; with async tests it is also a promise for the settled result. [`../results-groups-and-types/SKILL.md`](../results-groups-and-types/SKILL.md) lists the selectors.

## Answer shape

Give one complete suite plus the call that runs it, and say whether the run is stateful or stateless and why.
