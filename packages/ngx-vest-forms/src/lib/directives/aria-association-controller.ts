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
  /** Host element whose form-control descendants are targeted (native controls and ARIA form widgets). */
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

  /** Controls this controller last wrote ARIA state to. */
  let stamped = new Set<HTMLElement>();

  const releaseControl = (control: HTMLElement): void => {
    const describedBy = mergeAriaDescribedBy(
      control.getAttribute('aria-describedby'),
      [],
      config.ownedDescribedByIds
    );
    if (describedBy) {
      control.setAttribute('aria-describedby', describedBy);
    } else {
      control.removeAttribute('aria-describedby');
    }
    control.removeAttribute('aria-invalid');
    if (consumerAriaRequired.get(control) === false) {
      control.removeAttribute('aria-required');
    }
  };

  const updateFormControls = (): void => {
    formControls.set(findFormControls(config.host));
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
      // `role` decides whether an element is a target, so a role added or
      // changed after render must refresh the list too.
      mutationObserver.observe(config.host, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['role'],
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
    const targets =
      mode === 'none' ? [] : resolveAssociationTargets(formControls(), mode);

    // An element can stop being a target while it stays in the DOM (its role
    // changed, or the mode did). Take back what this controller set on it.
    for (const control of stamped) {
      if (!targets.includes(control)) {
        releaseControl(control);
      }
    }
    stamped = new Set(targets);

    if (mode === 'none') return;

    const describedBy = config.ariaDescribedBy();
    const activeIds = parseAriaIdTokens(describedBy);
    const shouldShowErrors = config.shouldShowErrors();
    const ariaRequired = config.ariaRequired?.() ?? null;

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
      if (ariaRequired !== null && supportsAriaRequired(control)) {
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

/**
 * ARIA widget roles that accept `aria-invalid` and `aria-errormessage` and
 * hold a form value (MDN, "Associated roles"). They cover custom controls
 * built from non-form elements, such as a button-based `role="radiogroup"`
 * ControlValueAccessor.
 */
const ARIA_FORM_WIDGET_ROLES: ReadonlySet<string> = new Set([
  'checkbox',
  'combobox',
  'listbox',
  'radiogroup',
  'searchbox',
  'slider',
  'spinbutton',
  'switch',
  'textbox',
]);

const NATIVE_CONTROL_SELECTOR = 'input, select, textarea';

/**
 * The role an element exposes. `role` may list fallbacks
 * (`role="switch checkbox"`); browsers use the first token they support, and
 * every role in `ARIA_FORM_WIDGET_ROLES` is supported, so the first token is
 * the one that counts.
 */
function primaryRole(element: Element): string | undefined {
  return element.getAttribute('role')?.trim().split(/\s+/)[0]?.toLowerCase();
}

function isAriaFormWidget(element: Element): boolean {
  const role = primaryRole(element);
  return role !== undefined && ARIA_FORM_WIDGET_ROLES.has(role);
}

/**
 * Finds the controls that carry the wrapper's ARIA state. A control nested
 * inside an ARIA form widget (for example the inner `<input>` of a
 * `role="combobox"` element) is skipped: the widget owns its parts and is the
 * element assistive technology reports. When the host itself is such a widget
 * (`<div ngxControlWrapper role="radiogroup">` around native radios), the
 * host is the only target.
 */
function findFormControls(host: HTMLElement): HTMLElement[] {
  if (isAriaFormWidget(host)) {
    return [host];
  }

  return Array.from(
    host.querySelectorAll<HTMLElement>(`${NATIVE_CONTROL_SELECTOR}, [role]`)
  ).filter(
    (control) =>
      (control.matches(NATIVE_CONTROL_SELECTOR) || isAriaFormWidget(control)) &&
      !isInsideAriaFormWidget(control, host)
  );
}

/** Whether an ancestor of `control`, below `host`, is an ARIA form widget. */
function isInsideAriaFormWidget(control: Element, host: Element): boolean {
  for (
    let ancestor = control.parentElement;
    ancestor && ancestor !== host;
    ancestor = ancestor.parentElement
  ) {
    if (isAriaFormWidget(ancestor)) {
      return true;
    }
  }
  return false;
}

/** `role="slider"` does not support `aria-required` (MDN). */
function supportsAriaRequired(control: HTMLElement): boolean {
  return primaryRole(control) !== 'slider';
}
