import { Component, computed, input, model, output } from '@angular/core';
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
      class="focus-visible:ring-primary-500 relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-gray-800"
      [class]="trackClasses()"
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

  /**
   * Track colours with at least 3:1 non-text contrast (WCAG 1.4.11) for the
   * track against the card and for the white knob against the track:
   * - off, light: gray-500 track, 4.8:1 on white, knob 4.8:1;
   * - off, dark: gray-600 track with a gray-400 edge, edge 5.6:1 on the
   *   gray-800 card, knob 7.6:1;
   * - on: primary-600 track, 4.3:1 on white and 3.4:1 on gray-800, knob
   *   4.3:1.
   */
  protected readonly trackClasses = computed(() =>
    this.checked()
      ? 'border-transparent bg-primary-600'
      : 'border-transparent bg-gray-500 dark:border-gray-400 dark:bg-gray-600'
  );
}
