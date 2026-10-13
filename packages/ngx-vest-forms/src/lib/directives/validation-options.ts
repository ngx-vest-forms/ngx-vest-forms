/**
 * Validation options for direct field, group, and root-form validation.
 *
 * These options debounce the validator attached to a specific control/group/form.
 * They do not affect `validationConfig`-triggered dependent-field revalidation;
 * use `NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN` for that.
 */
export type ValidationOptions = {
  /**
   * Debounce delay in milliseconds for the next validation run.
   *
   * Defaults to `0` unless explicitly configured by the consuming directive.
   * Recommended ranges:
   * - `0` for blur/submit-based or synchronous validation
   * - `150-300` for live validation while typing
   * - `300-500` for async/API-backed validation
   */
  debounceTime: number;
};
