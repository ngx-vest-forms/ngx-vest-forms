import { Component, computed, inject, input } from '@angular/core';
import { FormErrorDisplayDirective } from '../../directives/form-error-display.directive';
import { injectPendingLabel } from '../../tokens/pending-label.token';
import {
  buildMessageDescribedBy,
  MessageRegionIds,
} from '../../utils/aria-association.utils';
import { NgxIdGenerator } from '../../utils/id-generator';
import { createDebouncedPendingState } from '../../utils/pending-state.utils';

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
  selector: 'ngx-form-group-wrapper, [ngxFormGroupWrapper]',
  exportAs: 'ngxFormGroupWrapper',
  templateUrl: './form-group-wrapper.component.html',
  styleUrls: ['./form-group-wrapper.component.css'],
  host: {
    class: 'ngx-form-group-wrapper',
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

  protected readonly uniqueId = inject(NgxIdGenerator).next(
    'ngx-form-group-wrapper'
  );
  readonly errorId = `${this.uniqueId}-error`;
  readonly warningId = `${this.uniqueId}-warning`;
  readonly pendingId = `${this.uniqueId}-pending`;
  readonly #regionIds: MessageRegionIds = {
    errorId: this.errorId,
    warningId: this.warningId,
    pendingId: this.pendingId,
  };

  private readonly pendingState = createDebouncedPendingState(
    this.errorDisplay.isPending,
    this.pendingDebounce
  );
  protected readonly showPendingMessage = this.pendingState.showPendingMessage;
  /** Pending message text from `NGX_PENDING_LABEL`. */
  protected readonly pendingLabel = injectPendingLabel();

  /**
   * Helpful if consumers want to wire aria-describedby manually (e.g. fieldset/legend pattern).
   */
  readonly describedByIds = computed(() =>
    buildMessageDescribedBy(this.#regionIds, {
      errors: this.errorDisplay.shouldShowErrors(),
      warnings: this.errorDisplay.shouldShowWarnings(),
      pending: this.showPendingMessage(),
    })
  );
}
