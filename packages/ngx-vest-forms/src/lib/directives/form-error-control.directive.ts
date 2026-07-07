import {
  AfterContentInit,
  computed,
  Directive,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { AriaAssociationMode } from '../utils/aria-association.utils';
import { createDebouncedPendingState } from '../utils/pending-state.utils';
import { createAriaAssociationController } from './aria-association-controller';
import { FormErrorDisplayDirective } from './form-error-display.directive';

let nextUniqueId = 0;

/**
 * Wires a control container to its error/warning/pending regions.
 *
 * This directive is intended for custom wrappers/components.
 * It composes `FormErrorDisplayDirective` (and thus `FormControlStateDirective`)
 * and applies `aria-invalid` / `aria-describedby` to descendant controls.
 *
 * It does not render any UI; you can use the generated IDs to render messages.
 */
@Directive({
  selector: '[ngxErrorControl]',
  exportAs: 'ngxErrorControl',
  hostDirectives: [
    {
      directive: FormErrorDisplayDirective,
      inputs: ['errorDisplayMode', 'warningDisplayMode'],
    },
  ],
})
export class FormErrorControlDirective implements AfterContentInit {
  protected readonly errorDisplay = inject(FormErrorDisplayDirective, {
    self: true,
  });

  readonly #elementRef = inject(ElementRef<HTMLElement>);

  /**
   * Controls how this directive applies ARIA attributes to descendant controls.
   *
   * - `all-controls` (default): apply ARIA attributes to all input/select/textarea descendants.
   * - `single-control`: apply ARIA attributes only when exactly one control is found.
   * - `none`: do not mutate descendant controls.
   */
  readonly ariaAssociationMode = input<AriaAssociationMode>('all-controls');

  /**
   * Unique ID prefix for this instance.
   * Use these IDs to render message regions and to support aria-describedby.
   */
  protected readonly uniqueId = `ngx-error-control-${nextUniqueId++}`;
  readonly errorId = `${this.uniqueId}-error`;
  readonly warningId = `${this.uniqueId}-warning`;
  readonly pendingId = `${this.uniqueId}-pending`;

  readonly #contentInitialized = signal(false);

  readonly #pendingState = createDebouncedPendingState(
    this.errorDisplay.isPending,
    { showAfter: 500, minimumDisplay: 500 }
  );
  readonly showPendingMessage = this.#pendingState.showPendingMessage;

  /**
   * aria-describedby value representing the *currently relevant* message regions.
   */
  readonly ariaDescribedBy = computed(() => {
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

  readonly #ownedDescribedByIds: string[] = [
    this.errorId,
    this.warningId,
    this.pendingId,
  ];

  /**
   * Shared MutationObserver + ARIA-association controller. DOM reads/writes
   * run in the render phase via afterRenderEffect (see the controller).
   */
  private readonly aria = createAriaAssociationController({
    host: this.#elementRef.nativeElement,
    mode: this.ariaAssociationMode,
    contentInitialized: this.#contentInitialized,
    shouldShowErrors: this.errorDisplay.shouldShowErrors,
    ariaDescribedBy: this.ariaDescribedBy,
    ownedDescribedByIds: this.#ownedDescribedByIds,
  });

  ngAfterContentInit(): void {
    this.#contentInitialized.set(true);
  }
}
