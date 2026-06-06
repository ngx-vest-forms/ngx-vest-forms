# Purchase Form

A near-complete checkout flow that exercises most of the ngx-vest-forms surface
in one place: conditional fields, cross-field rules, async uniqueness, a
form-level rule, imperative helpers, and a resilient remote data load.

## Why it exists

Most demos isolate a single concept. This page is the opposite: a realistic,
busy form where many features have to coexist without fighting each other. It is
the reference for "how do all of these pieces fit together in a real form".

## What it does

- Collects identity, an age-gated emergency contact, gender (with an "other"
  free-text branch), a product and quantity, billing and optional shipping
  addresses, a password pair, and a dynamic list of phone numbers.
- Validates a **User ID** asynchronously against a mock SWAPI-style service. The
  test is wrapped in Vest `memo()` and cancels the in-flight request when the
  validation `signal` aborts.
- Enforces **cross-field** rules: passwords must match, and the billing and
  shipping addresses must not be identical when shipping differs.
- Enforces a **ROOT_FORM** rule ("Brecht is not 30 anymore") that spans
  `firstName`, `lastName`, and `age`.
- Emits **non-blocking warnings** (`warn()`) for weak passwords alongside the
  blocking "password is required" error.
- "Fetch Luke" loads demo data through Angular `httpResource`. A toolbar lets
  you choose a success response or a simulated failure (random, 404, 401, 500,
  network). On error the fetched fields are cleared via `clearFields()`.
- "Clear Sensitive Data" wipes passwords and identity fields; "Prefill Billing
  Address" writes deep paths with `setValueAtPath()`.

## ngx-vest-forms APIs showcased

- `NgxVestForms`, `FormDirective`, `provideFormContract`
- `createValidationConfig()` with `.bidirectional()` and `.whenChanged()`,
  rebuilt reactively from the current form value
- `createFormFeedbackSignals()` for packaged `formState`, `warnings`,
  `validatedFields`, and `pending`
- `clearFields()`, `setValueAtPath()`
- `FormDirective.focusFirstInvalidControl()`, `resetForm()`
- `ROOT_FORM` token for form-level errors
- `NGX_VALIDATION_DEBOUNCE_PRESETS` (`typing` and `async`)
- `NgxVestSuite` / Vest `create`, `test`, `enforce`, `omitWhen`, `warn`,
  `memo`

## Key files

- `purchase.page.ts` / `.html` — page shell, toolbar, and form-state card
- `purchase.form.ts` / `.html` — the form component, fetch logic, helpers
- `purchase.validations.ts` — the Vest suite and error/warning rule maps
- `purchase.validations.spec.ts` — suite unit tests
- `swapi.service.ts`, `product.service.ts` — mock data sources
- `../../models/purchase-form.model.ts` — model, contract, initial value

## Behaviour notes

- Typing "Luke" as the first name auto-triggers the data fetch; a manual fetch
  temporarily overrides that.
- Typing "Brecht Billiet" auto-fills some fields to make the ROOT_FORM rule and
  password mismatch easy to observe.
- `validationConfig` is a `computed` — extra dependencies (gender → genderOther,
  quantity ↔ justification) are added only when those branches are active.
