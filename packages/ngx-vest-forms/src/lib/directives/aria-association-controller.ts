import {
  afterRenderEffect,
  DestroyRef,
  inject,
  Signal,
  signal,
} from '@angular/core';
import {
  AriaAssociationMode,
  mergeAriaDescribedBy,
  parseAriaIdTokens,
  resolveAssociationTargets,
} from '../utils/aria-association.utils';

/**
 * @internal
 *
 * Reactive inputs the shared ARIA-association controller needs in order to
 * stamp `aria-describedby` / `aria-invalid` (and optionally `aria-required`)
 * onto descendant form controls.
 *
 * This consolidates the previously-duplicated ~80 lines of MutationObserver +
 * ARIA-association logic shared by `ControlWrapperComponent` and
 * `FormErrorControlDirective`. The DOM reads and writes are performed inside
 * `afterRenderEffect` so they run in the render phase (zoneless-safe) instead
 * of a plain `effect()`.
 *
 * NOT exported from the public API barrel — strictly an internal helper.
 */
export type AriaAssociationControllerConfig = {
  /** Host element whose `input/select/textarea` descendants are targeted. */
  readonly host: HTMLElement;
  /** Current association mode (`all-controls` | `single-control` | `none`). */
  readonly mode: Signal<AriaAssociationMode>;
  /** Whether content has initialized and effects may touch the DOM. */
  readonly contentInitialized: Signal<boolean>;
  /** Whether errors are currently shown (drives `aria-invalid`). */
  readonly shouldShowErrors: Signal<boolean>;
  /** Computed `aria-describedby` value for the currently relevant regions. */
  readonly ariaDescribedBy: Signal<string | null>;
  /** IDs owned by the consuming wrapper/directive (merged, not clobbered). */
  readonly ownedDescribedByIds: readonly string[];
  /**
   * Optional `aria-required` management. When omitted, `aria-required` is left
   * untouched (the directive variant does not manage it).
   */
  readonly ariaRequired?: Signal<boolean>;
};

/**
 * @internal
 *
 * Public surface returned to the consumer so it can expose the discovered
 * form controls (e.g. for tests) without re-implementing discovery.
 */
export type AriaAssociationController = {
  /** Live list of discovered descendant form controls. */
  readonly formControls: Signal<HTMLElement[]>;
};

/**
 * @internal
 *
 * Wires up the shared ARIA-association behavior. Must be called from an
 * injection context (component/directive constructor).
 */
export function createAriaAssociationController(
  config: AriaAssociationControllerConfig
): AriaAssociationController {
  const destroyRef = inject(DestroyRef);

  const formControls = signal<HTMLElement[]>([]);

  // Tracks whether a control already had a consumer-provided `aria-required`
  // before this controller first touched it, so toggling the wrapper input
  // back to false does not clobber a consumer-provided attribute.
  const consumerAriaRequired = new WeakMap<HTMLElement, boolean>();

  let mutationObserver: MutationObserver | null = null;

  const updateFormControls = (): void => {
    const controls = config.host.querySelectorAll('input, select, textarea');
    formControls.set(Array.from(controls) as HTMLElement[]);
  };

  const disconnectObserver = (): void => {
    mutationObserver?.disconnect();
    mutationObserver = null;
  };

  destroyRef.onDestroy(disconnectObserver);

  // Observer lifecycle: enable/disable DOM observation based on mode. Runs in
  // the render phase so the initial control query reflects projected content.
  afterRenderEffect((onCleanup) => {
    if (!config.contentInitialized()) return;

    const mode = config.mode();

    if (mode === 'none') {
      disconnectObserver();
      if (formControls().length > 0) {
        formControls.set([]);
      }
      return;
    }

    updateFormControls();

    if (!mutationObserver) {
      mutationObserver = new MutationObserver(() => {
        updateFormControls();
      });
      mutationObserver.observe(config.host, {
        childList: true,
        subtree: true,
      });
    }

    onCleanup(disconnectObserver);
  });

  // ARIA stamping: write `aria-describedby` / `aria-invalid` (and optionally
  // `aria-required`) onto descendant controls. DOM writes happen in the
  // render phase via afterRenderEffect (zoneless-safe).
  afterRenderEffect(() => {
    if (!config.contentInitialized()) return;

    const mode = config.mode();
    if (mode === 'none') return;

    const describedBy = config.ariaDescribedBy();
    const activeIds = parseAriaIdTokens(describedBy);
    const shouldShowErrors = config.shouldShowErrors();
    const ariaRequired = config.ariaRequired?.() ?? null;

    const targets = resolveAssociationTargets(formControls(), mode);

    for (const control of targets) {
      const nextDescribedBy = mergeAriaDescribedBy(
        control.getAttribute('aria-describedby'),
        activeIds,
        config.ownedDescribedByIds
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

      // aria-required is only managed when the consumer opts in.
      if (ariaRequired !== null) {
        if (!consumerAriaRequired.has(control)) {
          consumerAriaRequired.set(
            control,
            control.hasAttribute('aria-required')
          );
        }
        if (ariaRequired) {
          control.setAttribute('aria-required', 'true');
        } else if (!consumerAriaRequired.get(control)) {
          control.removeAttribute('aria-required');
        }
      }
    }
  });

  return { formControls };
}
