---
name: validation-config-builder
description: Dependent-field revalidation in ngx-vest-forms with `validationConfig` and `createValidationConfig()`. Read it when one field should revalidate after another changes: confirm password, date ranges, country/state, `omitWhen`/`skipWhen` conditions across fields.
---

# ngx-vest-forms validationConfig

`validationConfig` tells the form **when** to rerun a dependent field's tests. The rule itself stays in the Vest suite. The invariants live in the router, [`../SKILL.md`](../SKILL.md).

## Decide the tool

| The error…                                          | Use                                                                                  |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ |
| belongs to one field but depends on another's value | `validationConfig`                                                                   |
| belongs to the whole form, no single owner          | `ROOT_FORM` → [`../root-form-validation/SKILL.md`](../root-form-validation/SKILL.md) |
| goes stale because controls appeared or disappeared | [`../dynamic-form-behavior/SKILL.md`](../dynamic-form-behavior/SKILL.md)             |

[`references/decision-guide.md`](references/decision-guide.md) has diagnostic questions for questions that mix the three.

When stale cross-field errors are the bug, a missing `validationConfig` is the missing wiring, not optional polish. Any suite with `omitWhen`, `skipWhen` or `optional` keyed on another field, or a test comparing two fields, needs one.

## Write it

1. Keep the rule in the suite with `test(...)`, `omitWhen(...)`, `skipWhen(...)` or `optional(...)`, on the field that should show the message.
2. List which field's change must rerun which dependent.
3. Encode that with the typed builder, so a wrong path fails to compile:

   | Builder call                                    | For                                                                   |
   | ----------------------------------------------- | --------------------------------------------------------------------- |
   | `.whenChanged('country', 'state')`              | one-way; the second argument also takes an array                      |
   | `.bidirectional('password', 'confirmPassword')` | pairs that check each other: matching fields, start/end dates         |
   | `.group(['a', 'b', 'c'])`                       | small clusters where every field affects every other (N×(N−1) reruns) |
   | `.merge(otherConfig)`                           | combining reusable fragments                                          |
   | `.build()`                                      | the `ValidationConfigMap<T>` to bind                                  |

4. When the graph depends on UI state, wrap the builder in `computed(() => …)`.
5. Bind it: `<form ngxVestForm … [validationConfig]="validationConfig">`.

```ts
import { createValidationConfig, type NgxVestSuite } from 'ngx-vest-forms';
import { create, enforce, omitWhen, test } from 'vest';

export const signupSuite: NgxVestSuite<Signup> = create((model) => {
  test('password', 'Password is required', () => {
    enforce(model.password).isNotBlank();
  });
  omitWhen(!model.password, () => {
    test('confirmPassword', 'Passwords do not match', () => {
      enforce(model.confirmPassword).equals(model.password);
    });
  });
});

// in the component
protected readonly validationConfig = createValidationConfig<Signup>()
  .bidirectional('password', 'confirmPassword')
  .build();
```

A raw object works too when it is clearer; annotate it as `NgxValidationConfig<Model>` so the paths are checked. Runtime paths `FieldPath<T>` cannot express (`'addresses.0.street'`) need an explicit cast of the built object.

## Calm dependents

Dependents revalidate silently: `validationConfig` does not mark them touched, so with the default `'on-blur-or-submit'` mode their error appears only after their own blur or a submit. Setting `[errorDisplayMode]="'on-blur'"` on the dependent's `<ngx-control-wrapper>` makes that choice explicit at the field. That pairing (config for timing, wrapper for visibility, suite for the rule) replaces `(blur)` handlers that call `triggerFormValidation()`. For blur-driven saving on top, add [`../field-blur-events/SKILL.md`](../field-blur-events/SKILL.md).

## Known limits

- The trigger control must stay mounted. A trigger destroyed and recreated behind `@if` stops driving its dependents; hide it with `[hidden]` or disable it instead.
- Rapid edits to a trigger inside the 500 ms loop-prevention cooldown are deferred and replayed, not dropped.
- `NGX-106` means the dependent pipeline gave up waiting for a `PENDING` form (an async test that never settles); `NGX-107` means a dependent path never appeared (hidden or misspelled). A duplicate-builder warning means the same edge was added twice. See [`TROUBLESHOOTING.md`](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/docs/TROUBLESHOOTING.md).

## When answering

Explain the dependency graph in a sentence, then show the Vest test and the config together, and name the field that owns the message.

## References

- [`VALIDATION-CONFIG-BUILDER.md`](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/docs/VALIDATION-CONFIG-BUILDER.md)
- [`VALIDATION-CONFIG-VS-ROOT-FORM.md`](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/docs/VALIDATION-CONFIG-VS-ROOT-FORM.md)
- [`FIELD-PATHS.md`](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/docs/FIELD-PATHS.md)
