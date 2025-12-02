import { effect, Signal, signal } from '@angular/core';

/**
 * Options for configuring debounced pending state behavior.
 */
export type DebouncedPendingStateOptions = {
  /**
   * Delay in milliseconds before showing the pending message.
   * Prevents flashing for quick async validations.
   * @default 200
   */
  showAfter?: number;

  /**
   * Minimum display time in milliseconds once the pending message is shown.
   * Prevents flickering when validation completes shortly after being shown.
   * @default 500
   */
  minimumDisplay?: number;
};

/**
 * Result of createDebouncedPendingState containing the debounced signal
 * and cleanup function.
 */
export type DebouncedPendingStateResult = {
  /**
   * Signal that is true when the pending message should be shown.
   * This is debounced according to the provided options.
   */
  showPendingMessage: Signal<boolean>;

  /**
   * Optional cleanup function to cancel any pending timeouts.
   * Call this in ngOnDestroy if needed (though the effect cleanup handles most cases).
   */
  cleanup: () => void;
};

/**
 * Creates a debounced pending state signal that prevents flashing validation messages.
 *
 * This utility helps implement a better UX for async validations by:
 * 1. Delaying the display of "Validating..." messages until validation takes longer than `showAfter`ms (default: 200ms)
 * 2. Keeping the message visible for at least `minimumDisplay`ms (default: 500ms) once shown to prevent flickering
 *
 * @example
 * ```typescript
 * @Component({
 *   template: `
 *     @if (showPendingMessage()) {
 *       <div role="status" aria-live="polite">Validating…</div>
 *     }
 *   `
 * })
 * export class CustomControlWrapperComponent {
 *   protected readonly errorDisplay = inject(FormErrorDisplayDirective, { self: true });
 *
 *   // Create debounced pending state
 *   private readonly pendingState = createDebouncedPendingState(
 *     this.errorDisplay.isPending,
 *     { showAfter: 200, minimumDisplay: 500 }
 *   );
 *
 *   protected readonly showPendingMessage = this.pendingState.showPendingMessage;
 * }
 * ```
 *
 * @param isPending - Signal indicating whether async validation is currently pending
 * @param options - Configuration options for debouncing behavior
 * @returns Object containing the debounced showPendingMessage signal and cleanup function
 */
export function createDebouncedPendingState(
  isPending: Signal<boolean>,
  options: DebouncedPendingStateOptions = {}
): DebouncedPendingStateResult {
  const { showAfter = 200, minimumDisplay = 500 } = options;

  // Create writable signal for debounced state
  const showPendingMessageSignal = signal(false);

  // Track timeouts
  let pendingTimeout: ReturnType<typeof setTimeout> | null = null;
  let minimumDisplayTimeout: ReturnType<typeof setTimeout> | null = null;

  // Cleanup function
  const cleanup = () => {
    if (pendingTimeout) {
      clearTimeout(pendingTimeout);
      pendingTimeout = null;
    }
    if (minimumDisplayTimeout) {
      clearTimeout(minimumDisplayTimeout);
      minimumDisplayTimeout = null;
    }
  };

  // Effect to manage debounced pending message display
  effect((onCleanup) => {
    const pending = isPending();

    if (pending) {
      // Clear any existing minimum display timeout
      if (minimumDisplayTimeout) {
        clearTimeout(minimumDisplayTimeout);
        minimumDisplayTimeout = null;
      }

      // Start delay timer before showing pending message
      pendingTimeout = setTimeout(() => {
        showPendingMessageSignal.set(true);
        pendingTimeout = null;
      }, showAfter);

      onCleanup(() => {
        if (pendingTimeout) {
          clearTimeout(pendingTimeout);
          pendingTimeout = null;
        }
      });
    } else {
      // Validation completed
      if (pendingTimeout) {
        // Validation completed before delay - don't show message
        clearTimeout(pendingTimeout);
        pendingTimeout = null;
      } else if (showPendingMessageSignal()) {
        // Message was shown - keep it visible for minimum duration
        minimumDisplayTimeout = setTimeout(() => {
          showPendingMessageSignal.set(false);
          minimumDisplayTimeout = null;
        }, minimumDisplay);

        onCleanup(() => {
          if (minimumDisplayTimeout) {
            clearTimeout(minimumDisplayTimeout);
            minimumDisplayTimeout = null;
          }
        });
      }
    }
  });

  return {
    showPendingMessage: showPendingMessageSignal.asReadonly(),
    cleanup,
  };
}
