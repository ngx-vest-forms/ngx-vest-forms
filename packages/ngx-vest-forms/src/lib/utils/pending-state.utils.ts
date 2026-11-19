import {
  computed,
  effect,
  type Injector,
  isSignal,
  type Signal,
  signal,
  untracked,
} from '@angular/core';

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
 * Accepts either a static options object or a reactive `Signal` (e.g. an
 * `input()` accessor) so consumers can update debounce timings at runtime
 * without recreating the pending-state machine.
 */
export type DebouncedPendingStateOptionsInput =
  | DebouncedPendingStateOptions
  | Signal<DebouncedPendingStateOptions>;

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
   * Cancels any pending timeouts. The internal effect already clears them
   * when its injector is destroyed, so calling this is only needed to stop
   * them earlier.
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
 * Call it in an injection context (a field initializer or constructor), or
 * pass `{ injector }` to create it elsewhere, e.g. in `ngOnInit`.
 *
 * @param isPending - Signal indicating whether async validation is currently pending
 * @param options - Configuration options for debouncing behavior
 * @param config - `injector` to run the internal effect in when not called
 *   from an injection context
 * @returns Object containing the debounced showPendingMessage signal and cleanup function
 */
export function createDebouncedPendingState(
  isPending: Signal<boolean>,
  options: DebouncedPendingStateOptionsInput = {},
  config: { injector?: Injector } = {}
): DebouncedPendingStateResult {
  // Memoize primitive timing numbers via computed() so inline object literals
  // such as `[pendingDebounce]="{ showAfter: 200, minimumDisplay: 500 }"` do
  // not re-run the effect and reset active timers on unrelated CD passes.
  const showAfterSignal = isSignal(options)
    ? computed(() => options().showAfter ?? 200)
    : null;
  const minimumDisplaySignal = isSignal(options)
    ? computed(() => options().minimumDisplay ?? 500)
    : null;
  const staticShowAfter = isSignal(options) ? 200 : (options.showAfter ?? 200);
  const staticMinimumDisplay = isSignal(options)
    ? 500
    : (options.minimumDisplay ?? 500);

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
      const showAfter = showAfterSignal ? showAfterSignal() : staticShowAfter;

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
      // Validation completed. A still-running show-delay timer was already
      // cleared by the previous run's cleanup, so the message only needs
      // hiding when it is visible. Read visibility untracked so clearing it
      // when minimumDisplay elapses does not trigger a redundant effect run.
      if (untracked(showPendingMessageSignal)) {
        const minimumDisplay = minimumDisplaySignal
          ? minimumDisplaySignal()
          : staticMinimumDisplay;

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
  }, config);

  return {
    showPendingMessage: showPendingMessageSignal.asReadonly(),
    cleanup,
  };
}
