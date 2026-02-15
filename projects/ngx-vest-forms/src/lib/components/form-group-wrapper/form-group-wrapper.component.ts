import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { FormErrorDisplayDirective } from '../../directives/form-error-display.directive';
import { createDebouncedPendingState } from '../../utils/pending-state.utils';

let nextUniqueId = 0;

/**
 * Group-safe wrapper for `NgModelGroup` containers.
 *
 * This component renders group-level errors/warnings/pending UI, but intentionally
 * does **not** stamp `aria-describedby` / `aria-invalid` onto descendant controls.
 *
 * Use this when you want a wrapper around a container that has multiple inputs.
 * For single inputs, prefer `<ngx-control-wrapper>`.
 */
@Component({
  selector:
    'ngx-form-group-wrapper, sc-form-group-wrapper, [ngxFormGroupWrapper], [scFormGroupWrapper]',
  exportAs: 'ngxFormGroupWrapper',
  templateUrl: './form-group-wrapper.component.html',
  // Minimal structural styling: custom elements are inline by default.
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ngx-form-group-wrapper sc-form-group-wrapper',
    '[class.ngx-form-group-wrapper--invalid]':
      'errorDisplay.shouldShowErrors()',
    '[attr.aria-busy]': "errorDisplay.isPending() ? 'true' : null",
  },
  hostDirectives: [
    {
      directive: FormErrorDisplayDirective,
      inputs: ['errorDisplayMode', 'warningDisplayMode'],
    },
  ],
})
export class FormGroupWrapperComponent {
  protected readonly errorDisplay = inject(FormErrorDisplayDirective, {
    self: true,
  });

  /**
   * Controls the debounce behavior for the pending message.
   * Defaults are conservative to avoid flashing.
   */
  readonly pendingDebounce = input<{
    showAfter: number;
    minimumDisplay: number;
  }>({
    showAfter: 500,
    minimumDisplay: 500,
  });

  protected readonly uniqueId = `ngx-form-group-wrapper-${nextUniqueId++}`;
  readonly errorId = `${this.uniqueId}-error`;
  readonly warningId = `${this.uniqueId}-warning`;
  readonly pendingId = `${this.uniqueId}-pending`;

  private readonly pendingState = createDebouncedPendingState(
    this.errorDisplay.isPending,
    this.pendingDebounce()
  );
  protected readonly showPendingMessage = this.pendingState.showPendingMessage;

  /**
   * Helpful if consumers want to wire aria-describedby manually (e.g. fieldset/legend pattern).
   */
  readonly describedByIds = computed(() => {
    const ids: string[] = [];

    if (this.errorDisplay.shouldShowErrors()) {
      ids.push(this.errorId);
    }

    if (this.errorDisplay.shouldShowWarnings()) {
      ids.push(this.warningId);
    }

    if (this.showPendingMessage()) {
      ids.push(this.pendingId);
    }

    return ids.length > 0 ? ids.join(' ') : null;
  });
}
