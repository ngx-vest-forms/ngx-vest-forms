# Zod Schema Demo

Route: `zod-schema-demo` · Title: "Zod Schema Demo"

## What & why

This page demonstrates pairing an **external Zod schema** with a Vest suite for
the same form model. The Zod `z.object` schema acts as a shared structural /
type contract, while the Vest `test()` callbacks own the per-field business
rules that ngx-vest-forms surfaces in the UI.

Vest 6.3.x supports schema-aware `create(..., schema)` suites when the schema is
built with Vest's native `n4s/enforce` primitives. This example intentionally
keeps Zod **separate** from `create()` to show how an external schema library
can still serve as a structural contract alongside Vest-powered field
validation. For the native approach, see the sibling **Native Vest Schema
Demo**.

## ngx-vest-forms public APIs showcased

- `provideFormContract(zodSchemaDemoContract)` — registers the shape contract
  for the form body.
- `NgxVestForms` — template directives used by the form HTML.
- `FormDirective<ZodSchemaDemoModel>` — accessed via `viewChild` to read
  `formState()` and bind `(errorsChange)`.
- `createFormFeedbackSignals` / `createEmptyFormState` — derive `formState`,
  `warnings`, `validatedFields`, and `pending` for the sidebar state card.
- `NgxVestSuite<T>` — typed suite contract.

## Key files

- `zod-schema-demo.validations.ts` — exported `zodFormSchema` (Zod) plus the
  separate Vest suite `zodSchemaDemoSuite`.
- `zod-schema-demo.form.ts` / `.form.html` — the form body bound to the suite
  and contract; tracks errors via the directive's `(errorsChange)` event for
  more reactive updates.
- `zod-schema-demo.page.ts` / `.page.html` — page shell, title, sidebar
  explanation, and form state card.
- `zod-schema-demo.content.ts` — typed `ExampleContent` rendered by
  `<ngx-example-cards>`.

## Behavior

The Zod schema (`firstName`, `lastName`, `email`, `age` int 18–120, and a nested
`address` with a ZIP regex) documents and can validate the structural model
independently. The Vest suite mirrors those rules with `enforce` and adds
form-facing messages. During field validation ngx-vest-forms runs
`suite.only(field).run(model)`, so only the matching `test()` callbacks fire per
field; the exported Zod schema remains usable for separate structural checks.
