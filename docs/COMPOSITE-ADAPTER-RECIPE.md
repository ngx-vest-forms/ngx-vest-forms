# Composite Adapter Recipe

> **Status**: Official recipe — no library runtime changes required.
> **Related**:
> - [GitHub Issue #100](https://github.com/ngx-vest-forms/ngx-vest-forms/issues/100)
> - [Maintainer direction: official adapter pattern, not a core runtime API](https://github.com/ngx-vest-forms/ngx-vest-forms/issues/100#issuecomment-4207068952)
> - [Follow-up question from Matt Attalla about reusable child components, grouped paths, and standalone PrimeNG wiring](https://github.com/ngx-vest-forms/ngx-vest-forms/issues/100#issuecomment-4211960869)

## Problem

`ngx-vest-forms` works well when one Angular control maps to one form field path. But some composite UI controls expose a **single value** that needs to map to **multiple fields** in the form model.

Common examples:

| Composite control | Model fields |
| --- | --- |
| Date range picker | `departureDate` + `returnDate` |
| Amount/currency control | `amount` + `currency` |
| Full-name control | `firstName` + `lastName` |
| Geo picker | `lat` + `lng` |
| Address autocomplete | `street` + `city` + `zip` + ... |

## Recommended: Split Wrappers

If the composite fields can be shown as **independent labeled controls**, use separate `<ngx-control-wrapper>` instances. This gives you full library integration for free:

- ARIA wiring (`aria-invalid`, `aria-describedby`) — automatic
- Display modes (`on-blur`, `on-submit`, `on-blur-or-submit`) — automatic
- Warning display — automatic
- Pending/validation spinner — automatic
- `focusFirstInvalidControl()` — works out of the box

### Model and shape

```ts
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

### Validation suite

```ts
import { enforce, omitWhen, only, staticSuite, test, warn } from 'vest';
import { FormFieldName } from 'ngx-vest-forms';
import { TravelFormModel } from '../../models/travel-form.model';

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
      test('returnDate', 'Return date must be after departure date', () => {
        if (!model.departureDate || !model.returnDate) return;
        const departure = new Date(model.departureDate);
        const returnD = new Date(model.returnDate);
        enforce(returnD.getTime()).greaterThan(departure.getTime());
      });
    });
  }
);
```

### Cross-field revalidation

```ts
import { createValidationConfig } from 'ngx-vest-forms';

protected readonly validationConfig =
  createValidationConfig<TravelFormModel>()
    .bidirectional('departureDate', 'returnDate')
    .build();
```

### Template

```html
<ngx-form-section title="Date Range">
  <div class="grid grid-cols-2 gap-6">
    <ngx-control-wrapper>
      <label for="departureDate">Departure Date</label>
      <input
        id="departureDate"
        type="date"
        name="departureDate"
        [ngModel]="formValue().departureDate"
      />
    </ngx-control-wrapper>

    <ngx-control-wrapper>
      <label for="returnDate">Return Date</label>
      <input
        id="returnDate"
        type="date"
        name="returnDate"
        [ngModel]="formValue().returnDate"
      />
    </ngx-control-wrapper>
  </div>
</ngx-form-section>
```

That's it. No hidden fields, no manual error aggregation, no custom ARIA wiring.

---

## Alternative: Composite Adapter

Use this pattern only when a **single composite UI widget** is mandatory — for example, a third-party date range picker that outputs one combined value, or a design-system component that cannot be decomposed into independent controls.

### Trade-offs vs Split Wrappers

| Concern | Split Wrappers | Composite Adapter |
| ------- | :------------: | :---------------: |
| Display modes | Library-managed | Manual (`on-blur-or-submit` hardcoded) |
| Focus management | Library-managed | Works via `aria-invalid` on adapter inputs |
| ARIA wiring | Library-managed | Manual |
| Error aggregation | Not needed | Manual |
| Pending states | Library-managed | Not supported |
| Warning display | Library-managed | Manual |

### The pattern — five parts

#### 1. Model and shape

Same as the split wrappers approach — keep fields flat.

#### 2. Validation suite

Same as the split wrappers approach — validate on the real field paths.

#### 3. Presentational adapter component

The adapter is a **pure presentational component** — no `ngModel`, no `ControlValueAccessor`, no form awareness. It receives a composite value via `input()` and emits changes via `output()`.

Key design decisions:

- Define a **named value type** (not positional tuples)
- Use `<fieldset>` + `<legend>` for accessible grouping
- Accept `errors`, `warnings`, and `formSubmitted` inputs
- Track `touched` state internally (set on blur of either visible input)
- Gate error display: show only when `(touched || formSubmitted) && hasErrors`
- Wire `aria-invalid` and `aria-describedby` to the visible inputs
- Provide an `aria-live="polite"` region for error announcements

```ts
export type DateRangeValue = {
  departureDate?: string;
  returnDate?: string;
};

@Component({
  selector: 'app-date-range-adapter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fieldset role="group" [attr.aria-labelledby]="legendId">
      <legend [id]="legendId">Travel Date Range</legend>

      <label [for]="departureInputId">
        Departure Date
        <input
          [id]="departureInputId"
          type="date"
          [value]="departureValue()"
          [attr.aria-invalid]="isInvalid() || null"
          [attr.aria-describedby]="ariaDescribedBy()"
          (input)="onDepartureChange($event)"
          (blur)="onBlur()"
        />
      </label>

      <label [for]="returnInputId">
        Return Date
        <input
          [id]="returnInputId"
          type="date"
          [value]="returnValue()"
          [attr.aria-invalid]="isInvalid() || null"
          [attr.aria-describedby]="ariaDescribedBy()"
          (input)="onReturnChange($event)"
          (blur)="onBlur()"
        />
      </label>

      <div [id]="errorRegionId" role="status" aria-live="polite" aria-atomic="true">
        @for (error of displayErrors(); track error) {
          <p>{{ error }}</p>
        }
      </div>
    </fieldset>
  `,
})
export class DateRangeAdapterComponent {
  readonly value = input<DateRangeValue>({});
  readonly errors = input<string[]>([]);
  readonly warnings = input<string[]>([]);
  readonly formSubmitted = input(false);

  private readonly touched = signal(false);

  protected readonly shouldShowErrors = computed(
    () => (this.touched() || this.formSubmitted()) && this.errors().length > 0
  );

  protected readonly displayErrors = computed(() =>
    this.shouldShowErrors() ? this.errors() : []
  );

  protected readonly isInvalid = computed(() => this.shouldShowErrors());

  readonly valueChange = output<DateRangeValue>();

  protected onBlur(): void {
    this.touched.set(true);
  }

  resetTouched(): void {
    this.touched.set(false);
  }

  // ... unique IDs, computed values, event handlers
}
```

#### 4. Hidden proxy fields + fan-out in the form body

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

```ts
protected onRangeChange(range: DateRangeValue): void {
  const next = structuredClone(this.formValue());
  setValueAtPath(next, 'departureDate', range.departureDate);
  setValueAtPath(next, 'returnDate', range.returnDate);
  this.formValueChange.emit(next);
}
```

#### 5. Error aggregation, formSubmitted tracking, and validationConfig

The form body tracks submitted state and passes it to the adapter:

```ts
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

```ts
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

```ts
protected readonly validationConfig =
  createValidationConfig<TravelFormModel>()
    .bidirectional('departureDate', 'returnDate')
    .build();
```

### PrimeNG `DatePicker` range example

This pattern is a good fit for widgets like PrimeNG's
[`DatePicker`](https://primeng.org/datepicker) when using
`selectionMode="range"`.

PrimeNG returns a composite `Date[] | undefined` value where:

- `value?.[0]` is the start date
- `value?.[1]` is the end date

If your form shape still needs separate flat fields such as
`departureDate` and `returnDate`, keep the PrimeNG widget inside the adapter
and fan its composite value back out to the real field paths.

#### Important caveat

The PrimeNG widget's `ngModel` should be **adapter-local state**, not the real
`ngx-vest-forms` field registration.

- Keep the hidden proxy inputs as the real registered fields in the form tree.
- Mark the PrimeNG widget's `ngModel` as standalone so Angular does not try to
  register the widget itself as another control in the parent form.
- Continue validating the real flat field paths (`departureDate`,
  `returnDate`) in your Vest suite.

#### Example adapter

```ts
export type TravelFormModel = NgxDeepPartial<{
  departureDate: Date;
  returnDate: Date;
}>;

export type TravelRangeValue = {
  departureDate?: Date;
  returnDate?: Date;
};
```

```ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
  selector: 'app-primeng-date-range-adapter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePickerModule],
  template: `
    <fieldset class="space-y-3" role="group" [attr.aria-labelledby]="legendId">
      <legend [id]="legendId">Travel Date Range</legend>

      <p-datepicker
        inputId="travel-range"
        selectionMode="range"
        [readonlyInput]="true"
        [ngModel]="pickerValue()"
        [ngModelOptions]="{ standalone: true }"
        (ngModelChange)="onPickerValueChange($event)"
        [invalid]="shouldShowErrors()"
        [attr.aria-describedby]="ariaDescribedBy()"
      />

      <div [id]="errorRegionId" role="status" aria-live="polite" aria-atomic="true">
        @for (error of displayErrors(); track $index) {
          <p>{{ error }}</p>
        }
      </div>
    </fieldset>
  `,
})
export class PrimeDateRangeAdapterComponent {
  readonly value = input<TravelRangeValue>({});
  readonly errors = input<string[]>([]);
  readonly formSubmitted = input(false);
  readonly valueChange = output<TravelRangeValue>();

  private readonly touched = signal(false);
  protected readonly legendId = 'travel-range-legend';
  protected readonly errorRegionId = 'travel-range-errors';

  protected readonly pickerValue = computed(() => {
    const { departureDate, returnDate } = this.value();
    if (!departureDate && !returnDate) return undefined;
    return [departureDate, returnDate].filter(Boolean) as Date[];
  });

  protected readonly shouldShowErrors = computed(
    () => (this.touched() || this.formSubmitted()) && this.errors().length > 0
  );

  protected readonly displayErrors = computed(() =>
    this.shouldShowErrors() ? this.errors() : []
  );

  protected readonly ariaDescribedBy = computed(() =>
    this.displayErrors().length > 0 ? this.errorRegionId : null
  );

  protected onPickerValueChange(value: Date[] | undefined): void {
    this.touched.set(true);

    this.valueChange.emit({
      departureDate: value?.[0],
      returnDate: value?.[1],
    });
  }
}
```

#### Example form body wiring

```html
<!-- Hidden proxy fields: these remain the real ngx-vest-forms registrations -->
<input type="hidden" name="departureDate" [ngModel]="formValue().departureDate" />
<input type="hidden" name="returnDate" [ngModel]="formValue().returnDate" />

<app-primeng-date-range-adapter
  [value]="{ departureDate: formValue().departureDate, returnDate: formValue().returnDate }"
  [errors]="rangeErrors()"
  [formSubmitted]="formSubmitted()"
  (valueChange)="onRangeChange($event)"
/>
```

This keeps the PrimeNG widget as a single composite UI control while preserving
flat field paths in the form shape.

### Reusable child component variant (`JsnDatePicker`)

This variant specifically addresses the follow-up question in
[Matt Attalla's Issue #100 reply](https://github.com/ngx-vest-forms/ngx-vest-forms/issues/100#issuecomment-4211960869)
about:

- keeping hidden proxy inputs out of the root form template
- supporting both flat and grouped field paths
- preventing the visible PrimeNG widget from registering as the wrong control

If you want to keep the **root form template clean**, you can move the hidden
proxy inputs into a reusable child component. The key idea does **not** change:

- the visible PrimeNG widget stays **standalone**
- the hidden proxy inputs remain the **real registered form controls**
- the proxy input `name` values must be the **full form field paths**

This means the parent form can stay free of top-level hidden inputs while the
child component still participates in the same `NgForm` tree.

#### Parent form usage — flat model

```html
<jsn-date-picker
  label="Travel Dates"
  [startDate]="formValue().departureDate"
  startDatePath="departureDate"
  [endDate]="formValue().returnDate"
  endDatePath="returnDate"
/>
```

#### Parent form usage — grouped model

```html
<jsn-date-picker
  label="Travel Dates"
  [startDate]="formValue().travelDates?.departureDate"
  startDatePath="travelDates.departureDate"
  [endDate]="formValue().travelDates?.returnDate"
  endDatePath="travelDates.returnDate"
/>
```

For grouped models, pass the **absolute dotted field paths**. Do **not** pass
relative names such as `departureDate` / `returnDate` when the real model paths
are `travelDates.departureDate` / `travelDates.returnDate`.

#### Child component wiring

```ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { vestFormsViewProviders } from 'ngx-vest-forms';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
  selector: 'jsn-date-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePickerModule],
  viewProviders: [vestFormsViewProviders],
  template: `
    <p-datepicker
      selectionMode="range"
      [readonlyInput]="true"
      [ngModel]="pickerValue()"
      [ngModelOptions]="{ standalone: true }"
      (ngModelChange)="onPickerValueChange($event)"
    />

    <input type="hidden" [name]="startDatePath()" [ngModel]="startDate()" />
    <input type="hidden" [name]="endDatePath()" [ngModel]="endDate()" />
  `,
})
export class JsnDatePicker {
  readonly label = input.required<string>();

  readonly startDate = model<Date | undefined>(undefined);
  readonly endDate = model<Date | undefined>(undefined);

  readonly startDatePath = input.required<string>();
  readonly endDatePath = input.required<string>();

  protected readonly pickerValue = computed(() => {
    const start = this.startDate();
    const end = this.endDate();
    if (!start && !end) return undefined;
    return [start, end].filter(Boolean) as Date[];
  });

  protected onPickerValueChange(value: Date[] | undefined): void {
    this.startDate.set(value?.[0]);
    this.endDate.set(value?.[1]);
  }
}
```

This variant answers two common questions from Issue #100:

- **Can the hidden inputs live inside the reusable child component?** Yes.
- **Can the parent avoid a custom `onRangeChange()` fan-out handler?** Also yes,
  as long as the child updates the proxy-backed field signals directly.

#### Important rules for this child-component variant

- Add `viewProviders: [vestFormsViewProviders]` so the hidden proxy inputs join
  the parent form tree.
- Keep the visible PrimeNG `ngModel` **standalone** with
  `[ngModelOptions]="{ standalone: true }"`.
- Do **not** register the visible `p-datepicker` as `name="travelDates"` (or
  any other real form path) when it represents a composite `Date[]` value.
- Register only the hidden proxy fields against the real form paths.
- Use full dotted field paths for grouped forms.

If you skip the standalone `ngModelOptions`, Angular may try to register the
visible widget into the form tree, which leads to the exact shape/path mismatch
warnings this recipe is meant to avoid.

### Display mode considerations

The library's `<ngx-control-wrapper>` uses `FormErrorDisplayDirective` to gate error display based on configurable modes (`on-blur`, `on-submit`, `on-blur-or-submit`, etc.). The composite adapter **cannot use this directive** because it has no `NgModel` for the directive to bind to.

Instead, the adapter mimics the library's default `on-blur-or-submit` mode:

- Tracks its own `touched` state (set to `true` on blur of either visible input)
- Accepts a `formSubmitted` input from the parent
- Shows errors/warnings only when `(touched || formSubmitted) && hasErrors`

This means:

- Errors are **hidden on page load** (matches library behavior)
- Errors appear **after the user blurs an adapter input** or **after form submission**
- Errors clear when the form is reset (via `resetTouched()`)
- Other display modes (`on-dirty`, `always`, `on-submit`) are **not supported** — if needed, extend the adapter's gating logic

### Why `<ngx-control-wrapper>` cannot work for composites

`ControlWrapperComponent` uses `contentChild(NgModel)` to discover a single child `NgModel` directive. A composite adapter maps to **multiple** flat fields, so there is no single `NgModel` for the wrapper to bind. The hidden proxy fields are real `NgModel` inputs but they are invisible and don't represent the user-facing control.

## When NOT to use either pattern

If a **single composite field** in the model is acceptable, skip both patterns:

```ts
type TravelFormModel = NgxDeepPartial<{
  travelRange: [string?, string?];
}>;
```

Bind the composite control directly to that field and map to/from the domain model on load/save. This is simpler but means the live form model does not have separate field paths for each value.

## Full working example

See the **Composite Adapter Recipe** page in the examples app: `projects/examples/src/app/pages/date-range-adapter/`.

Run `ng serve examples` and navigate to `/date-range-adapter`. The page defaults to **Split Wrappers** (recommended) with a toggle to compare against the **Composite Adapter** approach.

## Accessibility checklist

- Use `<fieldset>` with `<legend>` to group the composite controls.
- Generate unique IDs for each rendered instance (counter or `crypto.randomUUID()`).
- Wire `aria-describedby` from each visible input to the shared error region.
- Set `aria-invalid` only when errors are actually displayed (gated by display mode).
- Use `role="status"` with `aria-live="polite"` for the error region.
- Do not use `aria-live="assertive"` — these are field-level messages, not blocking alerts.

## FAQ

### Does this work with PrimeNG `DatePicker` range mode?

Yes. PrimeNG's range mode returns a two-item `Date[]`, which fits the
composite-adapter pattern well.

Use the PrimeNG widget inside the adapter as standalone composite state, keep
hidden proxy inputs for the real field paths, and fan out the selected range to
the flat form model fields.

### Can the hidden proxy inputs live inside a reusable child component?

Yes. A reusable child component such as `JsnDatePicker` can host both the
visible standalone PrimeNG widget and the hidden proxy inputs.

The important part is that the proxy input `name` values still point to the
real field paths in the parent form model:

- flat: `departureDate`, `returnDate`
- grouped: `travelDates.departureDate`, `travelDates.returnDate`

Use `viewProviders: [vestFormsViewProviders]` in the child so those hidden
inputs still participate in the parent `ngxVestForm` tree.

### Why not a runtime API?

The library's core invariant is that one registered Angular control maps to one field path. A runtime mapping API would raise complex design questions around field ownership, error display, touched state, `focusFirstInvalidControl` behavior, and wrapper/ARIA associations. See the [maintainer direction on Issue #100](https://github.com/ngx-vest-forms/ngx-vest-forms/issues/100#issuecomment-4207068952) for the full reasoning.

If the adapter recipe proves insufficient in real-world usage, a dedicated runtime API can be reconsidered in a future major version.
