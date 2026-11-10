---
name: conditional-control-flow
description: Which Vest 6 primitive decides what runs and what counts toward validity. Read it for `suite.only`, `suite.focus`, `skipGroup`, `onlyGroup`, `include`, `skip`, `skipWhen`, `omitWhen`, `optional`, dependent fields, hidden sections, multi-step forms, or a form that stays invalid after a section is hidden.
---

# Vest 6 conditional control flow

The primitives differ in one property: whether the tests they leave out still count toward validity. The invariants live in the router, [`../SKILL.md`](../SKILL.md).

## Decide the primitive

| Need                                                              | Use                                             | Tests left out                                                   |
| ----------------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------- |
| validate the field the user edited                                | `suite.only(field).run(data)`                   | keep their stored result and still count                         |
| run only one step or tab                                          | `suite.focus({ onlyGroup: 'step1' }).run(data)` | keep their stored result and still count                         |
| leave one step or tab out of this run                             | `suite.focus({ skipGroup: 'step2' }).run(data)` | keep their stored result and still count                         |
| rerun a dependent field together with its trigger                 | `include('confirm').when('password')`           | not applicable: `include` adds tests to a focused run            |
| hold a test back until a condition clears, such as a remote check | `skipWhen(condition, () => { ... })`            | keep their previous result; a test that never ran stays untested |
| remove a section that does not apply to the current data          | `omitWhen(condition, () => { ... })`            | do not run, give no messages, do not count                       |
| let a field stay empty                                            | `optional('field')`                             | do not count while the field is empty; it must pass once filled  |
| inclusion that business data decides, independent of the UI event | `only(field)` or `skip(field)` in the callback  | keep their stored result and still count                         |

Three questions decide most cases:

- "This hidden section must stop blocking submit" is `omitWhen`.
- "This step is not active yet" is `skipGroup` or `onlyGroup`.
- "This field may be left empty" is `optional`. A field that is required but hidden right now is `omitWhen`.

## Focus

- `suite.only(field)` is the short form of `suite.focus({ only: field })`. Both take one name or an array.
- `skip` leaves out a field wherever it appears. `skipGroup` leaves out a named `group(...)`. `onlyGroup` runs the named groups and leaves out every test outside a group.
- When modifiers conflict, the order is `skipGroup`, then `onlyGroup`, then `skip`, then `only`.
- A focus applies to the next `run()` only.
- In a schema suite, a focused run validates only the focused part of the schema. Vest 6.3.4 drops the earlier schema errors of the other fields, and the docs describe a later release that keeps them. Decide a submit from a full `suite.run(data)`, which is correct in both.

## Dependent fields

`include('confirm').when('password')` runs the `confirm` tests whenever `password` is in the focus. `.when(...)` also takes a boolean or a function of the draft result, for a dependent that must wait for more than "the trigger changed":

```ts
include('confirm').when((result) => !result.hasErrors('password'));
```

## `skipWhen` and `omitWhen`

Both take a boolean or a function of the draft result, and a callback that declares the tests.

- `skipWhen` is for a test that is still required for the final result. Its callback body still executes; only the tests inside are skipped. Keep other work out of that body.
- `omitWhen` is for a section that is irrelevant while the condition holds: a "company" block for a private customer, a promo code behind an unticked checkbox.

```ts
import { create, enforce, omitWhen, skipWhen, test } from 'vest';

type Order = { coupon?: string; usesCoupon?: boolean };

declare function couponExists(
  code: string,
  signal: AbortSignal
): Promise<boolean>;

export const orderSuite = create((data: Order) => {
  omitWhen(!data.usesCoupon, () => {
    test('coupon', 'Enter the coupon code', () => {
      enforce(data.coupon).isNotBlank();
    });

    skipWhen(
      (result) => result.hasErrors('coupon'),
      () => {
        test('coupon', 'This coupon does not exist', async ({ signal }) => {
          enforce(await couponExists(data.coupon ?? '', signal)).isTruthy();
        });
      }
    );
  });
});
```

## `optional`

`optional('field')` and `optional(['a', 'b'])` treat an empty value as valid. Vest reads the value from the suite's data argument: `undefined`, `null`, `''` and a blank string are empty. In Vest 6.3.4 a key that is absent from the data object is not empty, so the field's tests fail the suite. For data that can lack the key, such as a partial form model, use the function form.

`optional({ field: () => !data.field })` makes the field optional while your own condition is true, in place of the empty check.

## Answer shape

State what happens to validity first, then show the primitive next to the tests it controls.

The docs for each primitive are linked from the "Writing Your Suite" section of [`https://vestjs.dev/llms.txt`](https://vestjs.dev/llms.txt); the guides `focused-validation`, `dependent-fields`, `conditional-sections` and `multi-step-workflows` under `https://vestjs.dev/docs/guides/` show full flows.
