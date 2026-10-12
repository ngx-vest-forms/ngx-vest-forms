/**
 * Named debounce presets for validation-related timing.
 *
 * These presets are convenience constants for:
 * - `NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN`
 * - `validationOptions.debounceTime`
 *
 * The runtime API remains numeric, so consumers can still provide any custom value.
 */
export const NGX_VALIDATION_DEBOUNCE_PRESETS = {
  immediate: 0,
  fast: 100,
  default: 100,
  relaxed: 150,
  typing: 300,
  async: 500,
} as const;

/**
 * Named debounce preset keys for discoverability in TypeScript.
 */
export type NgxValidationDebouncePreset =
  keyof typeof NGX_VALIDATION_DEBOUNCE_PRESETS;
