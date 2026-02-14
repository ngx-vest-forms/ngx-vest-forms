import {
  AfterContentInit,
  computed,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  signal,
} from '@angular/core';
import {
  AriaAssociationMode,
  mergeAriaDescribedBy,
  parseAriaIdTokens,
  resolveAssociationTargets,
} from '../utils/aria-association.utils';
import { createDebouncedPendingState } from '../utils/pending-state.utils';
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
  selector: '[formErrorControl], [ngxErrorControl]',
  exportAs: 'formErrorControl, ngxErrorControl',
  hostDirectives: [
    {
      directive: FormErrorDisplayDirective,
      inputs: ['errorDisplayMode', 'warningDisplayMode'],
    },
  ],
})
export class FormErrorControlDirective implements AfterContentInit, OnDestroy {
  protected readonly errorDisplay = inject(FormErrorDisplayDirective, {
    self: true,
  });

  private readonly elementRef = inject(ElementRef<HTMLElement>);

  /**
   * Controls how this directive applies ARIA attributes to descendant controls.
   *
   * - `all-controls` (default): apply ARIA attributes to all input/select/textarea descendants.
   * - `single-control`: apply ARIA attributes only when exactly one control is found.
   * - `none`: do not mutate descendant controls.
   */
  readonly ariaAssociationMode = input<
    AriaAssociationMode
  >('all-controls');

  /**
   * Unique ID prefix for this instance.
   * Use these IDs to render message regions and to support aria-describedby.
   */
  protected readonly uniqueId = `ngx-error-control-${nextUniqueId++}`;
  readonly errorId = `${this.uniqueId}-error`;
  readonly warningId = `${this.uniqueId}-warning`;
  readonly pendingId = `${this.uniqueId}-pending`;

  private readonly formControls = signal<HTMLElement[]>([]);
  private readonly contentInitialized = signal(false);
  private mutationObserver: MutationObserver | null = null;

  private readonly pendingState = createDebouncedPendingState(
    this.errorDisplay.isPending,
    { showAfter: 500, minimumDisplay: 500 }
  );
  readonly showPendingMessage = this.pendingState.showPendingMessage;

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

  private readonly ownedDescribedByIds: string[] = [
    this.errorId,
    this.warningId,
    this.pendingId,
  ];

  constructor() {
    // Effect for ARIA attribute updates
    effect(() => {
      if (!this.contentInitialized()) return;

      const mode = this.ariaAssociationMode();
      if (mode === 'none') return;

      const describedBy = this.ariaDescribedBy();
      const activeIds = parseAriaIdTokens(describedBy);
      const shouldShowErrors = this.errorDisplay.shouldShowErrors();

      const targets = resolveAssociationTargets(this.formControls(), mode);

      for (const control of targets) {
        const nextDescribedBy = mergeAriaDescribedBy(
          control.getAttribute('aria-describedby'),
          activeIds,
          this.ownedDescribedByIds
        );
        if (nextDescribedBy) {
          control.setAttribute('aria-describedby', nextDescribedBy);
        } else {
          control.removeAttribute('aria-describedby');
        }

        if (shouldShowErrors) {
          control.setAttribute('aria-invalid', 'true');
        } else {
          control.removeAttribute('aria-invalid');
        }
      }
    });

    // Effect for MutationObserver setup with proper cleanup
    effect((onCleanup) => {
      if (!this.contentInitialized()) return;

      const mode = this.ariaAssociationMode();

      if (mode === 'none') {
        this.mutationObserver?.disconnect();
        this.mutationObserver = null;
        if (this.formControls().length > 0) {
          this.formControls.set([]);
        }
        return;
      }

      this.updateFormControls();

      if (!this.mutationObserver) {
        this.mutationObserver = new MutationObserver(() => {
          this.updateFormControls();
        });

        this.mutationObserver.observe(this.elementRef.nativeElement, {
          childList: true,
          subtree: true,
        });
      }

      // Proper cleanup using onCleanup callback (Angular 21 best practice)
      onCleanup(() => {
        this.mutationObserver?.disconnect();
        this.mutationObserver = null;
      });
    });
  }

  ngAfterContentInit(): void {
    this.contentInitialized.set(true);
  }

  ngOnDestroy(): void {
    this.mutationObserver?.disconnect();
    this.mutationObserver = null;
  }

  private updateFormControls(): void {
    const controls = this.elementRef.nativeElement.querySelectorAll(
      'input, select, textarea'
    );
    this.formControls.set(Array.from(controls) as HTMLElement[]);
  }
}
