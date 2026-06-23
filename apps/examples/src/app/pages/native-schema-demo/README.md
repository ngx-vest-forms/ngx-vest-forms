# Native Vest Schema Demo

Route: `native-schema-demo` · Title: "Native Vest Schema Demo"

## What & why

This page shows how to give a Vest suite a **native structural schema** without
reaching for an external schema library. The schema is built with Vest's own
`n4s/enforce` primitives (`enforce.shape`, `enforce.optional`, `enforce.isString`,
`enforce.isNumber`) and passed directly as the second argument to `create()`:

```ts
create((model) => { /* test() rules */ }, nativeVestSchema);
```

The schema keeps the model structurally safe and typed, while field-level
`test()` callbacks carry the user-facing business rules and messages. This is
the recommended approach in Vest 6.3.x for schema-aware suites — contrast it
with the sibling **Zod Schema Demo**, which keeps an external schema separate
from the suite.

## ngx-vest-forms public APIs showcased

- `provideFormContract(nativeSchemaDemoContract)` — registers the shape contract
  for the form body.
- `NgxVestForms` — template directives (`ngxVestForm`, `[ngModel]`, control
  wrappers) used by the form HTML.
- `FormDirective<NativeSchemaDemoModel>` — accessed via `viewChild` to read
  `formState()`.
- `createFormFeedbackSignals` / `createEmptyFormState` — derive `formState`,
  `warnings`, `validatedFields`, and `pending` for the sidebar state card.
- `NgxVestSuite<T>` — typed suite contract.

## Key files

- `native-schema-demo.validations.ts` — the `enforce.shape(...)` schema plus the
  Vest suite (`nativeSchemaDemoSuite`).
- `native-schema-demo.form.ts` / `.form.html` — the form body component bound to
  the suite and contract.
- `native-schema-demo.page.ts` / `.page.html` — page shell, title, sidebar
  explanation, and form state card.
- `native-schema-demo.content.ts` — typed `ExampleContent` rendered by
  `<ngx-example-cards>`.

## Behavior

`ngx-vest-forms` validates one field at a time via
`suite.only(field).run(model)`. Because the model is partial during typing, the
schema marks every property `enforce.optional(...)`, so a focused run never
fails purely because sibling fields are absent. The nested `address` object is
described once inside the schema instead of being duplicated in an external
contract, and business rules (required fields, email pattern, age 18–120, ZIP
4–6 digits) live in `test()` callbacks close to the form UI.
