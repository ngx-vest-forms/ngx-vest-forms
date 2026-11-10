# Zod Schema Demo

Route: `zod-schema-demo` · Title: "Zod Schema Demo"

## What & why

This page pairs an **external Zod schema** with a Vest suite for the same Form
Model. The two have separate jobs:

- **Zod describes the structure.** The schema is bound through `[formContract]` and
  is the Form Contract. In development, ngx-vest-forms runs it against the form
  value whenever the value changes and logs a warning for each issue. It never
  changes whether a field is valid.
- **Vest owns the rules.** Required fields, the email format, age 18 to 120 and
  the ZIP code pattern live in `test()` callbacks, because the suite is the
  only thing that produces Errors and Warnings.

Two separate choices follow from this. Every field in the schema is
`.optional()` because the Form Model is partial while the user types. The
schema carries no rules because a Form Contract issue only reaches the console
in development and never becomes a field Error. A rule such as
`age: z.number().min(18).optional()` would pass an empty field and only log
when the user typed a value below 18, with no message on the field.

Vest 6.3.x also supports schema-aware `create(..., schema)` suites, but only
with schemas written with Vest's own `n4s/enforce` primitives. To see
`create(..., enforce.shape(...))`, open the
[Native Vest Schema Demo](../native-schema-demo/README.md) (route
`native-schema-demo`).

## ngx-vest-forms public APIs showcased

- `[formContract]` — binds the Zod schema as the Form Contract on the form.
- `NgxVestForms` — template directives used by the form HTML.
- `FormDirective<ZodSchemaDemoModel>` — accessed via `viewChild` to read
  `formState()`.
- `createFormFeedbackSignals` — derives `formState`,
  `warnings`, `validatedFields`, and `pending` for the sidebar state card.
- `NgxVestSuite<T>` — typed suite contract.

## Key files

- `zod-schema-demo.validations.ts` — the Vest suite `zodSchemaDemoSuite`.
  The Zod contract lives in `zod-schema-demo.model.ts`.
- `zod-schema-demo.form.ts` / `.form.html` — the form body bound to the suite
  and contract.
- `zod-schema-demo.page.ts` / `.page.html` — page shell, title, sidebar
  explanation, and form state card.
- `zod-schema-demo.content.ts` — typed `ExampleContent` rendered by
  `<ngx-example-cards>`.

## Behavior

The Zod schema (`firstName`, `lastName`, `email`, `age` and a nested `address`)
describes structure only, and the Vest suite adds the rules and messages. During field
validation ngx-vest-forms runs `suite.only(field).run(model)`, so only the
matching `test()` callbacks fire per field. The Form Contract runs separately,
in development only, and only logs.
