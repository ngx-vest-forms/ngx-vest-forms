# Composite adapter recipe

How to connect a single composite UI control (such as a date-range picker or currency input) to multiple flat field paths in an ngx-vest-forms model.

## Prefer split wrappers whenever possible

Before building a composite adapter, check if the fields can be rendered as separate labeled inputs inside individual `<ngx-control-wrapper>` instances. Split wrappers give you automatic display modes, ARIA wiring, warnings, pending indicators, and first-invalid focus with no extra plumbing.

```ts
import {
  createValidationConfig,
  type NgxDeepPartial,
  type NgxDeepRequired,
  type NgxVestSuite,
} from 'ngx-vest-forms';
import { create, enforce, omitWhen, test } from 'vest';

export type TravelFormModel = NgxDeepPartial<{
  departureDate: string;
  returnDate: string;
}>;

export const travelFormContract: NgxDeepRequired<TravelFormModel> = {
  departureDate: '',
  returnDate: '',
};

export const travelValidationSuite: NgxVestSuite<TravelFormModel> = create(
  (model) => {
    test('departureDate', 'Departure date is required', () => {
      enforce(model.departureDate).isNotEmpty();
    });

    test('returnDate', 'Return date is required', () => {
      enforce(model.returnDate).isNotEmpty();
    });

    omitWhen(!model.departureDate || !model.returnDate, () => {
      test('returnDate', 'Return date must be after departure date', () => {
        if (!model.departureDate || !model.returnDate) return;
        enforce(new Date(model.returnDate).getTime()).greaterThan(
          new Date(model.departureDate).getTime()
        );
      });
    });
  }
);

export const travelValidationConfig = createValidationConfig<TravelFormModel>()
  .bidirectional('departureDate', 'returnDate')
  .build();
```

```html
<ngx-control-wrapper>
  <label for="departureDate">Departure date</label>
  <input
    id="departureDate"
    type="date"
    name="departureDate"
    [ngModel]="formValue().departureDate"
  />
</ngx-control-wrapper>

<ngx-control-wrapper>
  <label for="returnDate">Return date</label>
  <input
    id="returnDate"
    type="date"
    name="returnDate"
    [ngModel]="formValue().returnDate"
  />
</ngx-control-wrapper>
```

## When a single composite widget is required

Use the composite adapter pattern when you must render one third-party widget (for example, PrimeNG `<p-datepicker selectionMode="range">`) while keeping separate flat field paths in your form model and Vest suite.

If a single tuple field in the form model (for example `travelRange?: [string?, string?]`) is acceptable, bind the widget directly to that field and map on load/save instead of using this recipe.

### Trade-offs

| Concern | Split wrappers | Composite adapter |
| --- | --- | --- |
| Display modes | Automatic | Manual per-input touched + `formSubmitted` |
| ARIA wiring | Automatic | Manual per-input `aria-invalid` and `aria-describedby` |
| First-invalid focus | Automatic | Works via `aria-invalid="true"` on the adapter's inputs |
| Pending spinner | Automatic | Manual |
| Warnings | Automatic | Manual |

### Why `<ngx-control-wrapper>` cannot wrap a composite directly

`FormControlStateDirective` (used by `ControlWrapperComponent`) binds to a single `NgModel` via `contentChild(NgModel)`. A composite widget updates multiple model fields, so there is no single `NgModel` for the wrapper to observe.

## The five-part composite adapter pattern

Keep the model (`TravelFormModel`), Vest suite (`travelValidationSuite`), and `validationConfig` identical to the split-wrapper version above.

### 1. Presentational adapter component

Keep the adapter free of parent form coupling (`ngModel` / `ControlValueAccessor`). Pass a typed composite value plus per-field errors and warnings, and emit value updates:

```ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';

export type DateRangeValue = {
  departureDate?: string;
  returnDate?: string;
};

@Component({
  selector: 'app-date-range-adapter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fieldset role="group" [attr.aria-labelledby]="legendId">
      <legend [id]="legendId">Travel date range</legend>

      <label [for]="departureInputId">
        Departure date
        <input
          [id]="departureInputId"
          type="date"
          [value]="value().departureDate ?? ''"
          [attr.aria-invalid]="shouldShowDepartureErrors() || null"
          [attr.aria-describedby]="departureAriaDescribedBy()"
          (input)="onDepartureChange($event)"
          (blur)="departureTouched.set(true)"
        />
      </label>

      <label [for]="returnInputId">
        Return date
        <input
          [id]="returnInputId"
          type="date"
          [value]="value().returnDate ?? ''"
          [attr.aria-invalid]="shouldShowReturnErrors() || null"
          [attr.aria-describedby]="returnAriaDescribedBy()"
          (input)="onReturnChange($event)"
          (blur)="returnTouched.set(true)"
        />
      </label>

      <!-- Shared visible summary -->
      <div role="status" aria-live="polite" aria-atomic="true">
        @for (error of visibleErrors(); track error) {
          <p>{{ error }}</p>
        }
      </div>

      <!-- Per-field sr-only regions so each input announces only its own errors -->
      <div [id]="departureErrorRegionId" class="sr-only">
        @for (error of departureDisplayErrors(); track error) {
          <p>{{ error }}</p>
        }
      </div>
      <div [id]="returnErrorRegionId" class="sr-only">
        @for (error of returnDisplayErrors(); track error) {
          <p>{{ error }}</p>
        }
      </div>
    </fieldset>
  `,
})
export class DateRangeAdapterComponent {
  readonly value = input<DateRangeValue>({});
  readonly departureErrors = input<string[]>([]);
  readonly returnErrors = input<string[]>([]);
  readonly formSubmitted = input(false);
  readonly valueChange = output<DateRangeValue>();

  protected readonly departureTouched = signal(false);
  protected readonly returnTouched = signal(false);

  private readonly uid = crypto.randomUUID();
  protected readonly legendId = `${this.uid}-legend`;
  protected readonly departureInputId = `${this.uid}-departure`;
  protected readonly returnInputId = `${this.uid}-return`;
  protected readonly departureErrorRegionId = `${this.uid}-departure-error`;
  protected readonly returnErrorRegionId = `${this.uid}-return-error`;

  protected readonly shouldShowDepartureErrors = computed(
    () =>
      (this.departureTouched() || this.formSubmitted()) &&
      this.departureErrors().length > 0
  );

  protected readonly shouldShowReturnErrors = computed(
    () =>
      (this.returnTouched() || this.formSubmitted()) &&
      this.returnErrors().length > 0
  );

  protected readonly departureDisplayErrors = computed(() =>
    this.shouldShowDepartureErrors() ? [...new Set(this.departureErrors())] : []
  );

  protected readonly returnDisplayErrors = computed(() =>
    this.shouldShowReturnErrors() ? [...new Set(this.returnErrors())] : []
  );

  protected readonly visibleErrors = computed(() => [
    ...new Set([
      ...this.departureDisplayErrors(),
      ...this.returnDisplayErrors(),
    ]),
  ]);

  protected readonly departureAriaDescribedBy = computed(() =>
    this.departureDisplayErrors().length > 0 ? this.departureErrorRegionId : null
  );

  protected readonly returnAriaDescribedBy = computed(() =>
    this.returnDisplayErrors().length > 0 ? this.returnErrorRegionId : null
  );

  protected onDepartureChange(event: Event): void {
    const departureDate = (event.target as HTMLInputElement).value || undefined;
    this.valueChange.emit({ ...this.value(), departureDate });
  }

  protected onReturnChange(event: Event): void {
    const returnDate = (event.target as HTMLInputElement).value || undefined;
    this.valueChange.emit({ ...this.value(), returnDate });
  }

  resetTouched(): void {
    this.departureTouched.set(false);
    this.returnTouched.set(false);
  }
}
```

### 2. Hidden proxy inputs and fan-out in the form

Hidden `<input>` elements register the real field paths with Angular's form tree and Vest validation:

```html
<form
  ngxVestForm
  [suite]="suite"
  [formValue]="formValue()"
  (formValueChange)="formValue.set($event)"
  (ngSubmit)="onSubmit()"
  #vestForm="ngxVestForm"
>
  <!-- Hidden proxy controls register real field paths in the form tree -->
  <input type="hidden" name="departureDate" [ngModel]="formValue().departureDate" />
  <input type="hidden" name="returnDate" [ngModel]="formValue().returnDate" />

  <app-date-range-adapter
    [value]="{
      departureDate: formValue().departureDate,
      returnDate: formValue().returnDate
    }"
    [departureErrors]="departureErrors()"
    [returnErrors]="returnErrors()"
    [formSubmitted]="formSubmitted()"
    (valueChange)="onRangeChange($event)"
  />

  <button type="submit">Submit</button>
</form>
```

```ts
private readonly feedback = createFormFeedbackSignals(this.vestForm);
protected readonly formState = this.feedback.formState;
protected readonly warnings = this.feedback.warnings;
protected readonly formSubmitted = signal(false);

protected readonly departureErrors = computed(
  () => this.formState().errors['departureDate'] ?? []
);
protected readonly returnErrors = computed(
  () => this.formState().errors['returnDate'] ?? []
);

protected onSubmit(): void {
  this.formSubmitted.set(true);
}

protected onRangeChange(range: DateRangeValue): void {
  const next = structuredClone(this.formValue());
  setValueAtPath(next, 'departureDate', range.departureDate);
  setValueAtPath(next, 'returnDate', range.returnDate);
  this.formValue.set(next);
}

protected resetForm(initial: TravelFormModel = {}): void {
  this.formSubmitted.set(false);
  this.dateRangeAdapter()?.resetTouched();
  this.vestForm()?.resetForm(initial);
}
```

## Third-party widgets (PrimeNG `DatePicker` range mode) and reusable child adapters

When wrapping a third-party widget that itself uses `ngModel` (such as PrimeNG `<p-datepicker selectionMode="range">`), keep the visible widget's `ngModel` **standalone** (`[ngModelOptions]="{ standalone: true }"`) so Angular does not register the composite `Date[]` value into the parent form.

You can also house both the standalone widget and the hidden proxy inputs inside a reusable child component by providing `viewProviders: [vestFormsViewProviders]`:

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
  selector: 'app-range-date-picker',
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

    <input type="hidden" [name]="startDateName()" [ngModel]="startDate()" />
    <input type="hidden" [name]="endDateName()" [ngModel]="endDate()" />
  `,
})
export class RangeDatePickerComponent {
  readonly startDate = model<Date | undefined>(undefined);
  readonly endDate = model<Date | undefined>(undefined);
  readonly startDateName = input.required<string>();
  readonly endDateName = input.required<string>();

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

For nested models, place the child component inside the matching `ngModelGroup` so the hidden proxy inputs register at `travelDates.departureDate` and `travelDates.returnDate`:

```html
<div ngModelGroup="travelDates">
  <app-range-date-picker
    [(startDate)]="departureDate"
    startDateName="departureDate"
    [(endDate)]="returnDate"
    endDateName="returnDate"
  />
</div>
```

## Accessibility checklist

- Group multi-input adapters inside `<fieldset>` + `<legend>`.
- Generate unique IDs per instance.
- Wire each visible input's `aria-describedby` to its own per-field error region (or, for a single-input widget like a range datepicker, to its single error region).
- Set `aria-invalid="true"` only when errors for that input are displayed.
- Use `role="status"` with `aria-live="polite"` for inline field feedback; do not use `aria-live="assertive"`.

## Runnable example

See `/date-range-adapter` (`apps/examples/src/app/pages/date-range-adapter/`), which compares Split Wrappers (default) against the Composite Adapter side by side.
