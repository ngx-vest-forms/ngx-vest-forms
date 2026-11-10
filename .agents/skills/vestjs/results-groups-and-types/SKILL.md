---
name: results-groups-and-types
description: Reading Vest 6 results and structuring larger typed suites. Read it for result selectors (`isValid`, `hasErrors`, `getErrors`, `isPending`, `isTested`), `group`, `each`, execution `mode`, multi-step forms, dynamic lists, typed suites, `result.value`, or Standard Schema interop.
---

# Vest 6 results, groups and types

The invariants live in the router, [`../SKILL.md`](../SKILL.md).

## Read the result

The same state is available from three places: the value `suite.run(data)` returns, `suite.get()`, and the selector methods on the suite itself. Use one of them per example.

| Question                                   | Selector                                                      |
| ------------------------------------------ | ------------------------------------------------------------- |
| does this field, or the suite, have errors | `hasErrors(field?)`                                           |
| the messages                               | `getErrors(field?)`, `getWarnings(field?)`                    |
| the first message                          | `getError(field?)`, `getWarning(field?)`, `getMessage(field)` |
| warnings present                           | `hasWarnings(field?)`                                         |
| async tests still running                  | `isPending(field?)`                                           |
| has this field been validated yet          | `isTested(field)`                                             |
| can the form be submitted                  | `isValid(field?)`                                             |

`isValid()` is `true` only when every required test ran and passed. It is `false` while a field is untested or pending, so `!isValid()` is no reason to show an error; `hasErrors(field)` is.

`result.run` describes the run itself: `run.focus` holds the focus modifiers, `run.data.raw` the input, `run.data.parsed` the schema output, `run.time` the `Date` of the run.

## Execution modes

Call `mode(...)` at the top of the suite callback:

```ts
import { Modes, create, enforce, mode, test } from 'vest';

export const passwordSuite = create((data: { password?: string }) => {
  mode(Modes.ALL);

  test('password', 'At least 8 characters', () => {
    enforce(data.password).longerThanOrEquals(8);
  });
  test('password', 'At least one digit', () => {
    enforce(data.password).matches(/[0-9]/);
  });
});
```

| Mode                    | Behaviour                                  | Fits                                |
| ----------------------- | ------------------------------------------ | ----------------------------------- |
| `Modes.EAGER` (default) | each field stops at its first failing test | interactive forms                   |
| `Modes.ALL`             | every test runs                            | a full list of problems per field   |
| `Modes.ONE`             | the suite stops at the first failing test  | fail-fast checks, often server-side |

## Groups

`group('name', () => { ... })` names a section, such as a step of a multi-step form. A named group can be focused (`suite.focus({ onlyGroup: 'name' })`) and queried: `isValidByGroup`, `hasErrorsByGroup`, `hasWarningsByGroup`, `getErrorsByGroup`, `getWarningsByGroup`.

Name a group only when something focuses or queries it by that name.

## Dynamic lists

`each(list, (item) => { ... })` declares tests per item. Give every test in it a stable key as the last argument, taken from the item's identity:

```ts
each(data.travelers, (traveler) => {
  test(
    `travelers.${traveler.id}.name`,
    'Name is required',
    () => {
      enforce(traveler.name).isNotBlank();
    },
    traveler.id
  );
});
```

The result of a test follows its key when items are inserted, removed or reordered. An array index is a stable key only when the list never reorders.

## Types

Pick the lightest form that gives the names you need:

| Form                                                                           | Gives                                                                                    |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `create((data: Model) => { ... })`                                             | typed `data`; field and group names are any string                                       |
| `create<{ fields: 'username' \| 'email'; groups: 'auth' }>((data) => { ... })` | field and group names checked in `test`, `only`, `focus`, `resetField` and the selectors |
| `create((data) => { ... }, enforce.shape({ ... }))`                            | `data` and the field names inferred from the schema                                      |
| `create<null>((data: any) => { ... })`                                         | opts out: every name is accepted                                                         |

`const { test, group, include, optional } = suite;` gives helpers that carry the suite's field and group names.

A schema suite adds typed output: `suite.run(...)` takes the schema's input type, the callback and `result.value` use its output type, and `result.value` exists only when `result.valid === true`. A failed result carries `result.issues`, a list of `{ message, path }`.

The exported types are `Suite`, `SuiteResult`, `SuiteSummary` and `SuiteConfig`.

## Standard Schema

A suite is a Standard Schema. Pass the suite itself to a library that accepts one; that library calls `suite['~standard'].validate(data)`. For normal runs keep `suite.run()` and `suite.runStatic()`.

## Answer shape

Answer with the one selector that matches the question, and add group or type machinery only when the user's code needs it.
