export type NgxFirstInvalidOptions = {
  /** Scroll animation behavior (default: `'smooth'`, or `'auto'` when reduced motion is preferred). */
  behavior?: ScrollBehavior;
  /** Vertical alignment when scrolling (default: `'center'`). */
  block?: ScrollLogicalPosition;
  /** Horizontal alignment when scrolling (default: `'nearest'`). */
  inline?: ScrollLogicalPosition;
  /** Whether to focus after scrolling (default: `true`). */
  focus?: boolean;
  /** Passed to `focus()` when focusing (default: `true`). */
  preventScrollOnFocus?: boolean;
  /** Opens ancestor `<details>` elements before scroll/focus (default: `true`). */
  openCollapsedParents?: boolean;
  /** Selector used to locate the first invalid element. */
  invalidSelector?: string;
  /** Selector used to resolve the best focus target within the invalid element. */
  focusSelector?: string;
};

export const DEFAULT_INVALID_SELECTOR = [
  '.ngx-control-wrapper--invalid',
  '.ngx-form-group-wrapper--invalid',
  'input.ng-invalid:not([type="hidden"]):not([disabled])',
  'textarea.ng-invalid:not([disabled])',
  'select.ng-invalid:not([disabled])',
  'input[aria-invalid="true"]:not([type="hidden"]):not([disabled])',
  'textarea[aria-invalid="true"]:not([disabled])',
  'select[aria-invalid="true"]:not([disabled])',
].join(', ');

export const DEFAULT_FOCUS_SELECTOR = [
  'input:not([type="hidden"]):not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  'button:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"]):not([disabled])',
].join(', ');

/**
 * Focus candidates that are already invalid.
 * This ensures invalid group wrappers focus a failing control before any valid sibling.
 */
const INVALID_FOCUS_PREFERRED_SELECTOR = [
  'input[aria-invalid="true"]:not([type="hidden"]):not([disabled])',
  'textarea[aria-invalid="true"]:not([disabled])',
  'select[aria-invalid="true"]:not([disabled])',
  '[aria-invalid="true"][tabindex]:not([tabindex="-1"]):not([disabled])',
  'input.ng-invalid:not([type="hidden"]):not([disabled])',
  'textarea.ng-invalid:not([disabled])',
  'select.ng-invalid:not([disabled])',
].join(', ');

const REDUCED_MOTION_MEDIA_QUERY = '(prefers-reduced-motion: reduce)';

function prefersReducedMotion(): boolean {
  return (
    typeof globalThis.matchMedia === 'function' &&
    globalThis.matchMedia(REDUCED_MOTION_MEDIA_QUERY).matches
  );
}

export function resolveFirstInvalidScrollBehavior(
  behavior?: ScrollBehavior
): ScrollBehavior {
  if (behavior !== undefined) {
    return behavior;
  }
  return prefersReducedMotion() ? 'auto' : 'smooth';
}

function isElementVisible(element: HTMLElement): boolean {
  if (element.closest('[aria-hidden="true"]')) {
    return false;
  }
  return element.getClientRects().length > 0;
}

export function resolveFirstInvalidElement(
  root: HTMLFormElement,
  invalidSelector: string
): HTMLElement | null {
  try {
    const candidates = root.querySelectorAll<HTMLElement>(invalidSelector);
    for (const candidate of candidates) {
      if (isElementVisible(candidate)) {
        return candidate;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function openCollapsedDetailsAncestors(
  root: HTMLFormElement,
  element: HTMLElement
): void {
  let current: HTMLElement = element;
  while (current !== root) {
    const parentElement = current.parentElement;
    if (!parentElement) {
      break;
    }

    if (parentElement instanceof HTMLDetailsElement) {
      parentElement.open = true;
    }

    current = parentElement;
  }
}

function firstVisibleMatch(
  root: HTMLElement,
  selector: string
): HTMLElement | null {
  const candidates = root.querySelectorAll<HTMLElement>(selector);
  for (const candidate of candidates) {
    if (isElementVisible(candidate)) {
      return candidate;
    }
  }
  return null;
}

export function resolveFirstInvalidFocusTarget(
  firstInvalid: HTMLElement,
  focusSelector: string
): HTMLElement | null {
  const preferredInvalidTarget = firstVisibleMatch(
    firstInvalid,
    INVALID_FOCUS_PREFERRED_SELECTOR
  );
  if (preferredInvalidTarget) {
    return preferredInvalidTarget;
  }

  try {
    if (firstInvalid.matches(focusSelector) && isElementVisible(firstInvalid)) {
      return firstInvalid;
    }

    return firstVisibleMatch(firstInvalid, focusSelector);
  } catch {
    return null;
  }
}
