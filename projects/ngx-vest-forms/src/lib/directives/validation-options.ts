/**
 * Validation Options
 */
export type ValidationOptions = {
  /**
   * debounceTime for the next validation
   */
  debounceTime: number;
  /**
   * Internal hook reserved for wiring AbortController-based cancellation into
   * async Vest runs without reshaping the runner API in future slices.
   */
  abortControllerHook?: (controller: AbortController) => void;
};
