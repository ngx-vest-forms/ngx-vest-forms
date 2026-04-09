import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';

/**
 * Composite value for the date range adapter.
 * Uses named fields instead of positional tuples for clarity.
 */
export type DateRangeValue = {
  departureDate?: string;
  returnDate?: string;
};

let nextId = 0;

/**
 * Pure presentational adapter for a composite date range control.
 *
 * **Why this component handles its own error display:**
 * `<ngx-control-wrapper>` discovers a single `NgModel` child via `contentChild(NgModel)`.
 * A composite adapter maps one UI widget to _multiple_ flat model fields
 * (`departureDate` + `returnDate`), so there is no single NgModel for the wrapper
 * to bind to. The parent form body aggregates errors from both fields and passes
 * them in via the `errors` input.
 *
 * **Display mode gating:** The adapter mimics the library's default `on-blur-or-submit`
 * display mode. Errors and warnings are only shown after the user has interacted with
 * the adapter (blur) or after form submission. This prevents errors from flashing on
 * page load — matching the behavior of `<ngx-control-wrapper>`.
 *
 * If your date fields can be presented as two independent controls, prefer wrapping
 * each in its own `<ngx-control-wrapper>` instead — the library handles ARIA wiring,
 * display modes, pending states, and warnings automatically.
 */
@Component({
  selector: 'ngx-date-range-adapter',
  template: `
    <fieldset class="space-y-4" role="group" [attr.aria-labelledby]="legendId">
      <legend [id]="legendId" class="label-text font-semibold">
        Travel Date Range
      </legend>

      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div class="form-field">
          <label [for]="departureInputId">
            <span class="label-text">Departure Date</span>
            <input
              [id]="departureInputId"
              type="date"
              class="input-field"
              [class.input-field--invalid]="isDepartureInvalid()"
              [value]="departureValue()"
              [attr.aria-invalid]="isDepartureInvalid() || null"
              [attr.aria-describedby]="departureAriaDescribedBy()"
              (input)="onDepartureChange($event)"
              (blur)="onBlur()"
            />
          </label>
        </div>

        <div class="form-field">
          <label [for]="returnInputId">
            <span class="label-text">Return Date</span>
            <input
              [id]="returnInputId"
              type="date"
              class="input-field"
              [class.input-field--invalid]="isReturnInvalid()"
              [value]="returnValue()"
              [attr.aria-invalid]="isReturnInvalid() || null"
              [attr.aria-describedby]="returnAriaDescribedBy()"
              (input)="onReturnChange($event)"
              (blur)="onBlur()"
            />
          </label>
        </div>
      </div>

      <div
        [id]="errorRegionId"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        @for (error of displayErrors(); track $index) {
          <p class="mt-1 text-sm text-red-600 dark:text-red-400">{{ error }}</p>
        }
      </div>

      <div
        [id]="warningRegionId"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        @for (warning of displayWarnings(); track $index) {
          <p class="mt-1 text-sm text-yellow-700 dark:text-yellow-400">{{ warning }}</p>
        }
      </div>
    </fieldset>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangeAdapterComponent {
  private readonly uid = nextId++;

  protected readonly legendId = `date-range-legend-${this.uid}`;
  protected readonly departureInputId = `departure-date-${this.uid}`;
  protected readonly returnInputId = `return-date-${this.uid}`;
  protected readonly errorRegionId = `date-range-errors-${this.uid}`;
  protected readonly warningRegionId = `date-range-warnings-${this.uid}`;

  readonly value = input<DateRangeValue>({});
  readonly departureErrors = input<string[]>([]);
  readonly returnErrors = input<string[]>([]);
  readonly departureWarnings = input<string[]>([]);
  readonly returnWarnings = input<string[]>([]);
  readonly formSubmitted = input(false);

  private readonly touched = signal(false);

  /** Mimics the library's default `on-blur-or-submit` display mode. */
  protected readonly shouldShowDepartureErrors = computed(
    () =>
      (this.touched() || this.formSubmitted()) &&
      this.departureErrors().length > 0
  );

  protected readonly shouldShowReturnErrors = computed(
    () =>
      (this.touched() || this.formSubmitted()) && this.returnErrors().length > 0
  );

  protected readonly shouldShowDepartureWarnings = computed(
    () =>
      (this.touched() || this.formSubmitted()) &&
      this.departureWarnings().length > 0
  );

  protected readonly shouldShowReturnWarnings = computed(
    () =>
      (this.touched() || this.formSubmitted()) &&
      this.returnWarnings().length > 0
  );

  protected readonly displayErrors = computed(() =>
    Array.from(
      new Set([
        ...(this.shouldShowDepartureErrors() ? this.departureErrors() : []),
        ...(this.shouldShowReturnErrors() ? this.returnErrors() : []),
      ])
    )
  );

  protected readonly displayWarnings = computed(() =>
    Array.from(
      new Set([
        ...(this.shouldShowDepartureWarnings() ? this.departureWarnings() : []),
        ...(this.shouldShowReturnWarnings() ? this.returnWarnings() : []),
      ])
    )
  );

  protected readonly isDepartureInvalid = computed(
    () => this.shouldShowDepartureErrors()
  );

  protected readonly isReturnInvalid = computed(
    () => this.shouldShowReturnErrors()
  );

  protected readonly departureAriaDescribedBy = computed(() => {
    const ids: string[] = [];
    if (this.shouldShowDepartureErrors()) ids.push(this.errorRegionId);
    if (this.shouldShowDepartureWarnings()) ids.push(this.warningRegionId);
    return ids.length > 0 ? ids.join(' ') : null;
  });

  protected readonly returnAriaDescribedBy = computed(() => {
    const ids: string[] = [];
    if (this.shouldShowReturnErrors()) ids.push(this.errorRegionId);
    if (this.shouldShowReturnWarnings()) ids.push(this.warningRegionId);
    return ids.length > 0 ? ids.join(' ') : null;
  });

  readonly valueChange = output<DateRangeValue>();

  protected readonly departureValue = computed(
    () => this.value().departureDate ?? ''
  );
  protected readonly returnValue = computed(
    () => this.value().returnDate ?? ''
  );

  protected onBlur(): void {
    this.touched.set(true);
  }

  /** Reset touched state (called by form body on form reset). */
  resetTouched(): void {
    this.touched.set(false);
  }

  protected onDepartureChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value || undefined;
    this.valueChange.emit({ ...this.value(), departureDate: val });
  }

  protected onReturnChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value || undefined;
    this.valueChange.emit({ ...this.value(), returnDate: val });
  }
}
