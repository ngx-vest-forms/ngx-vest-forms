# Composite Adapter Recipe

Route: `date-range-adapter` · Title: "Composite Adapter Recipe"

## What & why

This page shows how to map **one composite UI control to multiple form fields**
with split-field validation. A travel form needs a departure date and a return
date that cross-validate each other. The page offers two switchable approaches:

1. **Split Wrappers** — each date is its own `[ngModel]` inside a separate
   `<ngx-control-wrapper>`. The library handles ARIA wiring, display modes,
   pending state, and warnings automatically. The trade-off is two visually
   separate controls instead of a unified date-range widget.
2. **Composite Adapter** — a single `ngx-date-range-adapter` widget drives
   hidden proxy `[ngModel]` fields. The adapter must reproduce the library's
   display-mode gating and ARIA wiring itself, because `<ngx-control-wrapper>`
   discovers exactly one `NgModel` child and cannot bind a one-widget /
   many-fields control.

Either way, `validationConfig` keeps the two dates cross-validated.

## ngx-vest-forms public APIs showcased

- `createValidationConfig<TravelFormModel>().bidirectional('departureDate',
  'returnDate').build()` — bidirectional cross-field revalidation.
- `setValueAtPath` — fan the composite adapter value out to flat model paths.
- `provideFormContract(travelFormContract)` — shape contract for the form body.
- `ControlWrapperComponent` / `NgxVestForms` — wrapper-based field approach and
  template directives.
- `FormDirective<TravelFormModel>` — `triggerFormValidation()`, `resetForm()`,
  `formState()`, `fieldWarnings()`, `touchedFieldPaths()`.
- `fieldWarningsToRecord` / `createEmptyFormState` — feedback helpers for the
  sidebar state card.

## Key files

- `travel.validations.ts` — Vest suite with `omitWhen` ordering rule and a
  `warn()` advance-notice suggestion.
- `date-range-adapter.component.ts` — the composite adapter: value fan-in,
  manual on-blur-or-submit gating, error/warning aggregation, ARIA regions.
- `travel.form.ts` / `.form.html` — form body switching approaches; performs
  fan-out via `setValueAtPath` and defers `triggerFormValidation()` until proxy
  inputs sync.
- `travel.page.ts` / `.page.html` — page shell, approach selector, sidebar, and
  form state card.
- `travel.content.ts` — typed `ExampleContent` rendered by
  `<ngx-example-cards>`.

## Behavior

The adapter emits `{ departureDate, returnDate }`; the form body clones the
model, writes both paths with `setValueAtPath`, emits the new model, then waits
for the hidden proxy `[ngModel]`s to render (`afterNextRender` + a macrotask)
before calling `triggerFormValidation()`. The Vest suite requires both dates,
enforces return-after-departure inside `omitWhen`, and adds a non-blocking
`warn()` suggesting at least three days between dates. Switching approaches
resets the form and the adapter's touched state.
