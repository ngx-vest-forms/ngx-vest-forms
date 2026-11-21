# Conditional structure and field clearing

Route: `conditional-structure` · Title: "Conditional Structure & Field Clearing"

Demonstrates keeping model state and validation aligned when `@switch` branches switch between form controls (`shippingAddress`, `deliveryEmail`) and static informational content (`pickup`).

## What it shows

- Clearing hidden fields inside `(formValueChange)` with `clearFieldsWhen()` as soon as `deliveryMode` changes, avoiding `NGX-100` same-tick sync conflicts.
- Filtering the outgoing payload with `keepFieldsWhen()` so the submitted data includes only fields relevant to the active delivery mode.
- Conditional Vest 6 rules with `omitWhen` matching the rendered branches.
- Dev-mode form contract checking via `provideFormContract()`.

## Public API used

`NgxVestForms`, `FormDirective`, `clearFieldsWhen`, `keepFieldsWhen`, `provideFormContract`, `createFormFeedbackSignals`, `NgxSubmitSettledEvent`, `NgxVestSuite`, `NgxDeepPartial`, `NgxDeepRequired`.

## Key files

| File | Responsibility |
| --- | --- |
| `conditional-structure.page.ts` / `.html` | Page shell, `clearFieldsWhen` on mode switch, `keepFieldsWhen` payload preview |
| `conditional-structure.form.ts` / `.html` | Form body with `@switch` branches between inputs and static text |
| `conditional-structure.validations.ts` | Vest 6 suite using `omitWhen` |
| `conditional-structure.model.ts` | Model, contract, and initial value |
| `conditional-structure.content.ts` | In-app "What this demonstrates / learn" cards |
