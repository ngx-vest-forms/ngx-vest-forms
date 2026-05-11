import { NgxTypedVestSuite, NgxVestSuite } from './validation-suite';

/**
 * Vest focus options exposed by ngx-vest-forms for field-level async validation.
 *
 * `only` and `skip` target field names while `onlyGroup` and `skipGroup` target
 * suite groups (useful for multi-step flows). During field-level validation,
 * ngx-vest-forms always overrides `only` with the active field path.
 */
export type NgxValidationFocus = {
  only?: string;
  skip?: string;
  onlyGroup?: string | readonly string[];
  skipGroup?: string | readonly string[];
};

type VestDoneResult = {
  done(callback: (result: unknown) => void): void;
};

type VestFocusedRunner<T> = {
  run(model: T): VestDoneResult;
};

type VestFocusCapableSuite<T> = {
  focus(focus: NgxValidationFocus): VestFocusedRunner<T>;
};

type VestOnlyCapableSuite<T> = {
  only(field: string): VestFocusedRunner<T>;
};

function isFocusedRunner<T>(value: unknown): value is VestFocusedRunner<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'run' in value &&
    typeof (value as { run?: unknown }).run === 'function'
  );
}

/**
 * Runs a field-level Vest validation with API compatibility across Vest versions.
 *
 * Resolution order:
 * 1. `suite.focus({...validationFocus, only: field}).run(model)` when focus API exists
 * 2. `suite.only(field).run(model)` when only API exists
 * 3. Legacy invocation `suite(model, field)` as a final fallback
 */
export function runVestFieldValidation<T>(
  suite: NgxVestSuite<T> | NgxTypedVestSuite<T>,
  model: T,
  field: string,
  validationFocus: NgxValidationFocus | null | undefined
): VestDoneResult {
  const focusCapableSuite = suite as unknown as VestFocusCapableSuite<T>;
  if (validationFocus && typeof focusCapableSuite.focus === 'function') {
    try {
      const focused = focusCapableSuite.focus({
        ...validationFocus,
        only: field,
      });
      if (isFocusedRunner<T>(focused)) {
        return focused.run(model);
      }
    } catch {
      // Fall back to the legacy invocation below.
    }
  }

  const onlyCapableSuite = suite as unknown as VestOnlyCapableSuite<T>;
  if (typeof onlyCapableSuite.only === 'function') {
    try {
      const focused = onlyCapableSuite.only(field);
      if (isFocusedRunner<T>(focused)) {
        return focused.run(model);
      }
    } catch {
      // Fall back to the legacy invocation below.
    }
  }

  return (suite as NgxVestSuite<T>)(model, field);
}
