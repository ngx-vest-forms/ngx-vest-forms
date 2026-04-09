---
name: composite-adapter
description: "Helps developers build composite adapter components that map one UI widget to multiple flat form model fields in ngx-vest-forms. Use this whenever the user mentions date range pickers, name splitters, address composites, multi-field adapters, hidden proxy fields, fan-out with `setValueAtPath`, error aggregation across fields, or asks how to wire a single control to several `ngModel` paths without `ControlValueAccessor`."
---

# ngx-vest-forms composite adapter guidance

Use this skill when a single UI widget must map to **multiple flat form model fields**.

## First decide if you really need a composite adapter

Ask yourself:

- Can the fields be shown as independent labeled controls? If yes, use separate `<ngx-control-wrapper>` instances — the library handles ARIA, display modes, pending, and warnings automatically. **This is the recommended approach.**
- Does the UI genuinely require a single composite widget (date range picker, name splitter, combined address search)? Only then reach for the composite adapter pattern.
- Is the composite a reusable design-system primitive? Consider a `ControlValueAccessor` instead — it integrates natively with Angular forms.

This recipe is specifically for cases where:

1. You need multiple flat field paths in the form model (no nested `ngModelGroup`).
2. A single composite UI presents those values together.
3. You do **not** want a `ControlValueAccessor` (too heavy, or you need per-field Vest validation).

## Recommended: Split Wrappers

If fields can have independent labels, wrap each in its own `<ngx-control-wrapper>`:

```html
<div class="grid grid-cols-2 gap-6">
  <ngx-control-wrapper>
    <label for="departureDate">Departure Date</label>
    <input id="departureDate" type="date" name="departureDate"
           [ngModel]="formValue().departureDate" />
  </ngx-control-wrapper>

  <ngx-control-wrapper>
    <label for="returnDate">Return Date</label>
    <input id="returnDate" type="date" name="returnDate"
           [ngModel]="formValue().returnDate" />
  </ngx-control-wrapper>
</div>
```

Wire `validationConfig.bidirectional('departureDate', 'returnDate')` for cross-field revalidation. Done — no hidden proxies, no error aggregation, no manual ARIA.

## The composite adapter pattern — five parts

### 1. Model and shape

Keep fields flat in the model. Do not introduce nesting just for the adapter.

```typescript
import { NgxDeepPartial, NgxDeepRequired } from 'ngx-vest-forms';

export type TravelFormModel = NgxDeepPartial<{
  departureDate: string;
  returnDate: string;
}>;

export const travelFormShape: NgxDeepRequired<TravelFormModel> = {
  departureDate: '',
  returnDate: '',
};
```

### 2. Vest suite with type-safe field names

Use `FormFieldName<T>` for compile-time path safety. Call `only(field)` unconditionally.

```typescript
import { enforce, omitWhen, only, staticSuite, test } from 'vest';
import { FormFieldName } from 'ngx-vest-forms';

export const travelValidationSuite = staticSuite(
  (model: TravelFormModel, field?: FormFieldName<TravelFormModel>) => {
    only(field);

    test('departureDate', 'Departure date is required', () => {
      enforce(model.departureDate).isNotEmpty();
    });

    test('returnDate', 'Return date is required', () => {
      enforce(model.returnDate).isNotEmpty();
    });

    omitWhen(!model.departureDate || !model.returnDate, () => {
      test('returnDate', 'Return date must be after departure', () => {
        enforce(new Date(model.returnDate!).getTime())
          .greaterThan(new Date(model.departureDate!).getTime());
      });
    });
  }
);
```

### 3. Presentational adapter component with display mode gating

The adapter is a **pure presentational component** — no `ngModel`, no `ControlValueAccessor`, no form awareness. It receives a composite value via `input()` and emits changes via `output()`.

Key points:

- Define a named value type (not positional tuples).
- Use `fieldset` + `legend` for accessible grouping.
- Accept `errors`, `warnings`, and `formSubmitted` inputs.
- Track `touched` state internally (set `true` on blur of either visible input).
- Gate error/warning display: show only when `(touched || formSubmitted) && hasErrors`. This mimics the library's default `on-blur-or-submit` display mode and prevents errors from flashing on page load.
- Compute `isInvalid` from `shouldShowErrors` — gates both `aria-invalid` and CSS classes.
- Provide an `aria-live="polite"` region for error announcements.
- Wire `aria-describedby` from visible inputs to the error region.
- Expose `resetTouched()` so the form body can clear touched state on form reset.

### 4. Hidden proxy fields + fan-out in the form body

Register each real field path via hidden `<input>` elements so the Angular form tree and Vest validation can discover them.

```html
<!-- Hidden proxy fields: register real field paths in the form tree -->
<input type="hidden" name="departureDate" [ngModel]="formValue().departureDate" />
<input type="hidden" name="returnDate" [ngModel]="formValue().returnDate" />

<!-- Adapter component uses the composite value -->
<app-date-range-adapter
  [value]="{ departureDate: formValue().departureDate, returnDate: formValue().returnDate }"
  [errors]="rangeErrors()"
  [warnings]="rangeWarnings()"
  [formSubmitted]="formSubmitted()"
  (valueChange)="onRangeChange($event)"
/>
```

Fan-out the adapter's output to individual field paths:

```typescript
protected onRangeChange(range: DateRangeValue): void {
  const next = structuredClone(this.formValue());
  setValueAtPath(next, 'departureDate', range.departureDate);
  setValueAtPath(next, 'returnDate', range.returnDate);
  this.formValueChange.emit(next);
}
```

### 5. Error aggregation, formSubmitted tracking, and validationConfig

The form body tracks submitted state and passes it to the adapter:

```typescript
readonly formSubmitted = signal(false);

protected onSubmit(): void {
  this.formSubmitted.set(true);
  this.submitted.emit();
}

resetFormState(value: TravelFormModel): void {
  this.formSubmitted.set(false);
  this.dateRangeAdapter()?.resetTouched();
  this.vestForm()?.resetForm(value);
}
```

Merge errors from the component fields into a single list for the adapter:

```typescript
readonly rangeErrors = computed(() => {
  const errors = this.formState().errors ?? {};
  return [
    ...new Set([
      ...(errors['departureDate'] ?? []),
      ...(errors['returnDate'] ?? []),
    ]),
  ];
});
```

Use `validationConfig` to wire bidirectional revalidation:

```typescript
protected readonly validationConfig =
  createValidationConfig<TravelFormModel>()
    .bidirectional('departureDate', 'returnDate')
    .build();
```

## PrimeNG `DatePicker` range mode

This recipe works well for PrimeNG's
[`DatePicker`](https://primeng.org/datepicker) with `selectionMode="range"`.
PrimeNG returns a `Date[] | undefined` where the first item is the start date
and the second item is the end date.

Recommended integration:

- Keep the real form fields flat, e.g. `departureDate` and `returnDate`.
- Keep the hidden proxy inputs as the real `ngx-vest-forms` registrations.
- Bind the PrimeNG widget inside the adapter using adapter-local `ngModel`
  state.
- Mark that widget `ngModel` as standalone:
  `[ngModelOptions]="{ standalone: true }"`.
- Fan out `value?.[0]` and `value?.[1]` to the real form model fields in the
  adapter's change handler.

If the user wants a **reusable child component** (for example `JsnDatePicker`)
and wants to avoid hidden inputs in the root form template, that is still the
same recipe — just move the proxy inputs into the child component.

In that variant:

- add `viewProviders: [vestFormsViewProviders]` in the child
- keep the visible PrimeNG widget standalone
- register only the hidden proxy inputs as the real form controls
- pass **full field paths** into the child, not relative leaf names

Examples:

- flat model: `departureDate`, `returnDate`
- grouped model: `travelDates.departureDate`, `travelDates.returnDate`

Do **not** register the visible `p-datepicker` as `name="travelDates"` when it
actually emits a composite `Date[]`. That path belongs to neither the split
field registrations nor the shape expected by the form.

Example adapter wiring:

```html
<p-datepicker
  selectionMode="range"
  [readonlyInput]="true"
  [ngModel]="pickerValue()"
  [ngModelOptions]="{ standalone: true }"
  (ngModelChange)="onPickerValueChange($event)"
/>
```

```ts
protected onPickerValueChange(value: Date[] | undefined): void {
  this.valueChange.emit({
    departureDate: value?.[0],
    returnDate: value?.[1],
  });
}
```

## Why `<ngx-control-wrapper>` cannot work for composites

`ControlWrapperComponent` uses `contentChild(NgModel)` to discover a single child `NgModel` directive. A composite adapter maps to **multiple** flat fields, so there is no single `NgModel` for the wrapper to bind. The hidden proxy fields are real `NgModel` inputs but they live alongside the adapter, not inside a single wrapper.

If your composite can be decomposed into completely independent labeled fields, prefer individual `<ngx-control-wrapper>` wrappers instead — you get ARIA wiring, display modes, pending states, and warnings for free.

## Accessibility checklist

- Use `<fieldset>` with `<legend>` to group the composite controls.
- Generate unique IDs for each rendered instance (counter or `crypto.randomUUID()`).
- Wire `aria-describedby` from each visible input to the shared error region.
- Set `aria-invalid` only when errors are actually displayed (gated by `shouldShowErrors`).
- Use `role="status"` with `aria-live="polite"` for the error region.
- Do not use `aria-live="assertive"` — these are field-level messages, not blocking alerts.

## Common mistakes to correct

- Passing `formState().errors` directly to the adapter without display-mode gating — errors appear on page load.
- Using `[(ngModel)]` instead of `[ngModel]` on the proxy inputs.
- Forgetting hidden proxy fields entirely — the adapter inputs are not in the Angular form tree.
- Using positional tuples instead of named value types.
- Rendering errors manually AND wrapping in `<ngx-control-wrapper>` — causes duplication.
- Missing `validationConfig` for cross-field revalidation.
- Forgetting to track `formSubmitted` state and pass it to the adapter.
- Forgetting to call `resetTouched()` on the adapter during form reset.
- Using `ngModelGroup` when flat fields with hidden proxies are simpler and keep field paths correct.
- Making the adapter form-aware (injecting `NgForm`, using `ngModel`) instead of keeping it pure.
- Registering a third-party widget's internal `ngModel` in the parent form instead of marking it standalone.
- Passing `departureDate` / `returnDate` into a grouped child component when the real paths are `travelDates.departureDate` / `travelDates.returnDate`.
- Using `field?: string` instead of `FormFieldName<T>` for the Vest suite parameter.

## When to reach for something else

| Situation | Better approach |
|-----------|----------------|
| Fields are independent and can have separate labels | Individual `<ngx-control-wrapper>` per field **(Recommended)** |
| Composite is a reusable design-system primitive | `ControlValueAccessor` |
| Error belongs to the whole form, not to specific fields | `ROOT_FORM` + `ngxValidateRootForm` |
| Fields share a common path prefix | `ngModelGroup` + `<ngx-form-group-wrapper>` |

## Repo references to consult when needed

- `../../../../docs/COMPOSITE-ADAPTER-RECIPE.md`
- `../../../../projects/examples/src/app/pages/date-range-adapter/`
- `../../../../projects/ngx-vest-forms/src/public-api.ts`
- `../../../../docs/VALIDATION-CONFIG-BUILDER.md`
- `../../../../docs/CUSTOM-CONTROL-WRAPPERS.md`

## Fast heuristic

If the user says "one control, multiple fields", "date range", "name splitter", "composite adapter", "hidden proxy", or "fan-out", this skill should trigger. Always recommend split wrappers first, then offer the composite adapter if split wrappers are not feasible.
