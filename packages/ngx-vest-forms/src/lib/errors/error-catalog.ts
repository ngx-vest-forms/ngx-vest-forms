export const NGX_VEST_FORMS_ERRORS = {
  EXTRA_PROPERTY: {
    code: 'NGX-001',
    message: (path: string) =>
      `Contract mismatch: Property '${path}' is present in the form value but not defined in the form contract.`,
  },
  TYPE_MISMATCH: {
    code: 'NGX-002',
    message: (path: string, expected: string, actual: string) =>
      `Type mismatch at '${path}': Expected '${expected}' but got '${actual}'.`,
  },
  CONTROL_NOT_FOUND: {
    code: 'NGX-003',
    message: (path: string) =>
      `Control not found: Could not find form control at path '${path}'. Check your [ngModel] name attributes.`,
  },
  SCHEMA_ISSUE: {
    code: 'NGX-004',
    message: (path: string, message: string) =>
      `Form contract issue at '${path}': ${message}`,
  },
} as const;

/**
 * Diagnostics that are not tied to the structural form contract.
 *
 * These are routed through {@link logDiagnostic} (no contract-hint suffix) and
 * must always be guarded by `isDevMode()` at the call site so they are tree-
 * shaken / silent in production builds.
 */
export const NGX_VEST_FORMS_DIAGNOSTICS = {
  SYNC_CONFLICT_DROPPED: {
    code: 'NGX-100',
    message: () =>
      'Bidirectional formValue/model sync detected a divergent simultaneous change. ' +
      'The divergent change was dropped (form value wins) and tracking baselines were ' +
      'advanced so subsequent single-sided changes sync correctly. Prefer unidirectional ' +
      'updates: use [formValue] with (formValueChange) and avoid mutating the model and ' +
      'form controls in the same tick.',
  },
  ROOT_FORM_NGFORM_MISSING: {
    code: 'NGX-101',
    message: () =>
      '[ValidateRootFormDirective] NgForm not found. Ensure the directive is used on a ' +
      '<form> element with the ngxVestForm directive. Common setup mistakes: ' +
      '(1) Missing ngxVestForm directive, (2) Directive on non-form element, ' +
      '(3) NgForm not imported in module/component.',
  },
  ROOT_FORM_VALIDATION_ERROR: {
    code: 'NGX-102',
    message: (detail: string) =>
      `[validate-root-form] Observable error: ${detail}`,
  },
  ASYNC_BRIDGE_NO_CONTEXT: {
    code: 'NGX-103',
    message: (source: string) =>
      `[ngx-vest-forms] ${source}: No FormDirective context found. Validation skipped (fail-open).`,
  },
  ASYNC_BRIDGE_UNRESOLVED_PATH: {
    code: 'NGX-104',
    message: (source: string) =>
      `[ngx-vest-forms] ${source}: Could not resolve control path. Ensure the control has a ` +
      'valid name/path and is registered in the form tree.',
  },
  ERROR_DISPLAY_MODE_CONFLICT: {
    code: 'NGX-105',
    message: () =>
      '[ngx-vest-forms] Potential UX issue: errorDisplayMode is "on-blur" but updateOn is ' +
      '"submit". Errors will only show after form submission, not after blur.',
  },
} as const;

export function logWarning<T extends unknown[]>(
  error: { code: string; message: (...args: T) => string },
  ...args: T
): void {
  console.warn(
    `[${error.code}] ${error.message(...args)}\nCheck your [formContract] input, provideFormContract(...) provider, and the initial [formValue].`
  );
}

/**
 * Logs a non-contract diagnostic (warning) through the shared catalog.
 *
 * Unlike {@link logWarning}, this does not append the form-contract hint
 * suffix. Call sites MUST guard this with `isDevMode()` so production builds
 * stay silent.
 */
export function logDiagnostic<T extends unknown[]>(
  diagnostic: { code: string; message: (...args: T) => string },
  ...args: T
): void {
  console.warn(`[${diagnostic.code}] ${diagnostic.message(...args)}`);
}
