import {
  Component,
  ElementRef,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import { SEAT_LIMITS } from '../../models/signal-forms-interop.model';

/**
 * A seat stepper built as a Signal Forms `FormValueControl`.
 *
 * There is no `ControlValueAccessor` and no `NG_VALUE_ACCESSOR` provider.
 * Angular's `NgModel` recognises the `value` model and the `touch` output and
 * binds them itself, so `[ngModel]` inside an `ngxVestForm` works as-is:
 *
 * - `value` (model): the view-to-model and model-to-view channel.
 * - `touch` (output): emitted when focus leaves the control; `NgModel` marks
 *   the control touched, which drives ngx-vest-forms' on-blur error display.
 * - `disabled` (input): `NgModel` writes the control's disabled state here.
 *
 * The inner `<input>` is a native element, so `ngx-control-wrapper` stamps
 * `aria-invalid` and `aria-describedby` on it, and first-invalid focus lands
 * on it. It follows the APG spinbutton pattern: Arrow Up/Down step the value.
 *
 * It deliberately declares no `name`, `required`, `min` or `max` inputs: those
 * names are part of the Signal Forms control contract, and `[formField]` (or,
 * for some of them, `NgModel`) writes to them.
 */
@Component({
  selector: 'ngx-seat-stepper',
  template: `
    <div class="flex items-stretch gap-2" (focusout)="onFocusOut($event)">
      <button
        type="button"
        class="btn btn-secondary px-3"
        aria-label="One seat fewer"
        [attr.aria-controls]="inputId()"
        [disabled]="disabled()"
        (click)="step(-1)"
      >
        <span aria-hidden="true">−</span>
      </button>
      <input
        [id]="inputId()"
        type="text"
        inputmode="numeric"
        [attr.maxlength]="maxDigits"
        role="spinbutton"
        autocomplete="off"
        [attr.aria-describedby]="hintId() ?? null"
        class="input-field w-20 text-center"
        [attr.aria-valuemin]="limits.min"
        [attr.aria-valuemax]="limits.max"
        [attr.aria-valuenow]="value() ?? null"
        [value]="value() ?? ''"
        [disabled]="disabled()"
        (input)="onInput($event)"
        (keydown)="onKeydown($event)"
      />
      <button
        type="button"
        class="btn btn-secondary px-3"
        aria-label="One seat more"
        [attr.aria-controls]="inputId()"
        [disabled]="disabled()"
        (click)="step(1)"
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  `,
  host: { style: 'display: block;' },
})
export class SeatStepperComponent implements FormValueControl<
  number | null | undefined
> {
  /** Bound by `NgModel` (template-driven) or `[formField]` (Signal Forms). */
  readonly value = model<number | null>();
  /** Written by `NgModel` from the control's disabled state. */
  readonly disabled = input(false);
  /** Tells `NgModel` the user is done with the control (blur). */
  readonly touch = output();

  /** `id` of the inner input, so a `<label for>` outside can name it. */
  readonly inputId = input.required<string>();
  /**
   * Optional hint `id` for the inner input's `aria-describedby`. The wrapper
   * keeps it and appends its own error and warning ids.
   */
  readonly hintId = input<string>();

  protected readonly limits = SEAT_LIMITS;
  /**
   * Room for one digit more than the maximum needs, so an out-of-range count
   * such as 12 can be typed and the range error shown, but not a number so
   * long that `Number()` turns it into `1e+21`.
   */
  protected readonly maxDigits = String(SEAT_LIMITS.max).length + 1;

  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected step(delta: number): void {
    const current = this.value() ?? 0;
    const next = Math.min(
      this.limits.max,
      Math.max(this.limits.min, current + delta)
    );
    this.value.set(next);
  }

  protected onInput(event: Event): void {
    const element = event.target as HTMLInputElement;
    const digits = element.value
      .replaceAll(/\D/g, '')
      .slice(0, this.maxDigits);
    const next = digits === '' ? undefined : Number(digits);
    // Show what the model holds ("05" becomes "5"). Writing the element
    // directly matters when the model does not change: `[value]` would not
    // re-render and the typed text would stay.
    const text = next === undefined ? '' : String(next);
    if (element.value !== text) {
      element.value = text;
    }
    this.value.set(next);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.step(1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.step(-1);
    }
  }

  /** Emit `touch` only when focus leaves the whole stepper, not between its parts. */
  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (!next || !this.#host.nativeElement.contains(next)) {
      this.touch.emit();
    }
  }
}
