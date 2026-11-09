import { Component, input, model, output } from '@angular/core';
import type { FormCheckboxControl } from '@angular/forms/signals';

/**
 * An on/off switch built as a Signal Forms `FormCheckboxControl`.
 *
 * `NgModel` binds the `checked` model (instead of `value`) because this is a
 * checkbox-style control, listens to `touch`, and writes `disabled`. No
 * `ControlValueAccessor` is involved.
 *
 * The `role="switch"` button is an ARIA form widget, so `ngx-control-wrapper`
 * stamps `aria-invalid` and `aria-describedby` on it. A `<label for>` pointing
 * at `switchId` gives it its accessible name.
 */
@Component({
  selector: 'ngx-consent-switch',
  template: `
    <button
      type="button"
      role="switch"
      [id]="switchId()"
      [attr.aria-checked]="checked() === true"
      [disabled]="disabled()"
      (click)="checked.set(checked() !== true)"
      (blur)="touch.emit()"
      class="focus-visible:ring-primary-500 relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-gray-800"
      [class.bg-primary-600]="checked() === true"
      [class.bg-gray-400]="checked() !== true"
      [class.dark:bg-gray-500]="checked() !== true"
    >
      <span
        aria-hidden="true"
        class="inline-block h-5 w-5 rounded-full bg-white shadow transition-transform motion-reduce:transition-none"
        [class.translate-x-5]="checked() === true"
        [class.translate-x-0]="checked() !== true"
      ></span>
    </button>
  `,
  host: { style: 'display: inline-flex;' },
})
export class ConsentSwitchComponent implements FormCheckboxControl {
  /** Bound by `NgModel` (template-driven) or `[formField]` (Signal Forms). */
  readonly checked = model(false);
  /** Written by `NgModel` from the control's disabled state. */
  readonly disabled = input(false);
  /** Tells `NgModel` the user is done with the control (blur). */
  readonly touch = output();

  /** `id` of the switch button, so a `<label for>` can name it. */
  readonly switchId = input.required<string>();
}
