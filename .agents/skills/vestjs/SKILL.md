---
name: vestjs
description: Writes, reviews and debugs Vest.js 6 validation suites. Use for a new or refactored suite, focused runs (`suite.only`, `suite.focus`), conditional tests (`skipWhen`, `omitWhen`, `optional`, `include`), async tests and warnings, result access, groups and `each`, typed and schema suites, custom `enforce` rules, server-side runs, or an upgrade from Vest 5.
license: MIT
metadata:
  author: ngx-vest-forms
---

# Vest.js

Vest validates with a suite of named tests and keeps the result of every field between runs. The guidance in this skill is for Vest 6.3.

## 1. Pin the installed version

Before writing code, read the `version` field of `node_modules/vest/package.json`. When dependencies are not installed yet, use the `vest` range in the project's `package.json`. The step is done when you know which branch applies.

| Installed            | Branch                                                                                                                                                                                                                                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `6.3` or later       | Continue with this skill.                                                                                                                                                                                                                                                                                                            |
| `6.0` to `6.2`       | The behaviour in this skill is verified on 6.3.4, and an earlier 6.x release can differ, for example in a focused run of a schema suite. Recommend the update to 6.3.4 or later; until then, test a behaviour on the installed package before you rely on it.                                                                        |
| `5.x`                | Answer from the Vest 5 docs; every page lives under `https://vestjs.dev/docs/5.x/`. A Vest 5 suite is callable (`suite(data, field)`): `create(...)` makes the stateful suite for a form, `staticSuite(...)` the stateless one, and completion is result `.done(cb)`. Say that the code targets Vest 5, and offer the upgrade below. |
| user asks to upgrade | Apply the replacements below, then check the code against the invariants. The full list is the [upgrade guide](https://vestjs.dev/docs/upgrade_guide).                                                                                                                                                                               |

| Vest 5                             | Vest 6                                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| `suite(data)`                      | `suite.run(data)`                                                                                |
| `staticSuite(cb)` + `suite(data)`  | `create(cb)` + `suite.runStatic(data)`                                                           |
| `promisify(suite)(data)`           | `await suite.run(data)`                                                                          |
| `result.done(cb)`                  | `const result = await suite.run(data)`, then the body of `cb`                                    |
| `result.done('field', cb)`         | `suite.afterField('field', () => { if (!suite.isPending('field')) cb(suite.get()); }).run(data)` |
| `test.memo(name, msg, fn, deps)`   | `memo(() => { test(name, msg, fn); }, deps)` with `import { memo } from 'vest/memo'`             |
| `only(field)` driven by a UI event | `suite.only(field).run(data)`                                                                    |

`suite.afterEach(cb)` and `suite.afterField(field, cb)` are the Vest 6 hooks, but they are no drop-in for `done`: the callback gets no result (read `suite.get()`), and it also runs after the synchronous pass, while async tests are still pending.

## 2. Use the installed API

The authority for which exports and methods exist is the installed type declarations: the file named by the `types` field of `node_modules/vest/package.json`. The docs describe a newer state than the published package and sometimes differ from it. Example: the docs import `compose` from `'vest'`, and Vest 6.3.4 exports it only from `n4s`. When a doc sample fails to compile or behaves differently, trust the installed package and say so.

For the docs, start from the index [`https://vestjs.dev/llms.txt`](https://vestjs.dev/llms.txt), which lists every page. The problem-first guides live under `https://vestjs.dev/docs/guides/`.

## 3. Hold the invariants

Every answer and code sample follows these. When the user's code breaks one, correct it before anything else.

1. **Suite object.** `create((data) => { ... })` returns a suite. Run it with `suite.run(data)`.
2. **Focus at the call site.** A UI event runs `suite.only(field).run(data)` or `suite.focus({ only, skip, onlyGroup, skipGroup }).run(data)`. A focus applies to the next run only, and the other fields keep their stored results. `only()` and `skip()` inside the callback are for inclusion that business data decides.
3. **`suite.run()` is stateful.** `suite.reset()` starts a new form; `suite.resetField(field)` clears one field and cancels its pending async tests; `suite.remove(field)` drops a field that no longer exists. `suite.runStatic(data)` is the stateless run for servers, scripts and unit tests.
4. **Read validation state from the result.** `hasErrors`, `getErrors`, `isPending` and `isTested(field)` replace hand-kept error and pending flags. `isValid()` is also `false` while a required test is untested or pending, so show messages from `hasErrors`. Dirty and touched state belong to the form, outside the suite.
5. **Declarative conditions.** `skipWhen`, `omitWhen`, `include(...).when(...)` and `optional` replace `if` branches around tests. `omitWhen` is the one that stops an inactive section from counting toward validity.
6. **Cancellable async tests.** The test takes `{ signal }` and passes it to the request. Vest aborts that signal when the same test runs again. Completion is `await suite.run(data)`, `suite.afterEach(cb)` or `suite.afterField(field, cb)`.
7. **Warnings.** A warning leaves its field valid. Call `warn()` before the first `await` in the test body; for a severity decided after an `await`, take the setter from `useWarn()` first.
8. **Schema suites.** `create((data) => { ... }, enforce.shape({ ... }))` validates and parses the input before the tests run. When the schema fails, the tests still run and the callback gets the raw input, so a test must tolerate a value of the wrong type. A focused run validates and parses only the focused part of the schema, so decide a submit, and read `result.value`, from a full `suite.run(data)`.

## 4. Route to the workflow

Read the sub-skill whose triggers match; combine several when the question spans them.

| Sub-skill                                                       | Triggers                                                                                                                                                  |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`core`](core/SKILL.md)                                         | first suite, suite structure, `create`, `test`, `enforce` basics, which run to call                                                                       |
| [`conditional-control-flow`](conditional-control-flow/SKILL.md) | `suite.only`, `suite.focus`, `skipGroup`, `onlyGroup`, `include`, `skipWhen`, `omitWhen`, `optional`, dependent fields, hidden sections, multi-step forms |
| [`async-and-warnings`](async-and-warnings/SKILL.md)             | remote checks, stale requests, `signal`, `debounce`, `memo`, pending state, `warn()`, `useWarn()`, `afterEach`, `afterField`                              |
| [`results-groups-and-types`](results-groups-and-types/SKILL.md) | result selectors, `group`, `each`, execution modes, typed suites, `result.value`, Standard Schema                                                         |
| [`enforce-and-custom-rules`](enforce-and-custom-rules/SKILL.md) | `enforce.shape` and other schema rules, parsers, `enforce.condition`, `enforce.extend`, `compose`, `enforce.context()`, typing custom rules               |
| [`server-side-validation`](server-side-validation/SKILL.md)     | request validation, `runStatic` on a server, error responses, `SuiteSerializer`, SSR                                                                      |

In an Angular project that uses ngx-vest-forms, combine this skill with the `ngx-vest-forms` skill: the form directive runs the suite, and that skill holds the rules for the suite's shape.
