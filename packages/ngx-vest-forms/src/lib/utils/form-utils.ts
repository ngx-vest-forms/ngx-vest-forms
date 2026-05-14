import {
  AbstractControl,
  FormArray,
  FormGroup,
  isFormArray,
  isFormGroup,
  ValidationErrors,
} from '@angular/forms';
import { ROOT_FORM } from '../constants';
import {
  isUnsafePathSegment,
  parseFieldPath,
  stringifyFieldPath,
} from './field-path.utils';

type UnknownRecord = Record<string, unknown>;

type ControlWithOptionalName = AbstractControl & {
  name?: unknown;
};

type FormContainer = FormGroup | FormArray;

/**
 * Result of {@link getAllFormErrors}. Errors and warnings are exposed as
 * sibling records keyed by dotted field path so consumers can iterate either
 * independently — no non-enumerable side-channels.
 *
 * @publicApi
 */
export type NgxFormErrorsByPath = {
  /** Blocking validation errors keyed by field path. */
  errors: Record<string, string[]>;
  /** Non-blocking validation warnings keyed by field path. */
  warnings: Record<string, string[]>;
};

const ERROR_MESSAGES_KEY = 'errors';
const WARNING_MESSAGES_KEY = 'warnings';

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Recursively calculates the path of a form control
 * @param formGroup
 * @param control
 */
function getChildEntries(
  container: FormContainer
): Array<[string, AbstractControl]> {
  if (isFormArray(container)) {
    return container.controls.map((child, index) => [String(index), child]);
  }

  return Object.entries(container.controls);
}

function getControlPath(
  formGroup: FormGroup,
  control: AbstractControl
): string {
  // First attempt: depth-first traversal from provided root
  for (const [key, child] of getChildEntries(formGroup)) {
    if (child === control) {
      return key;
    }
    if (isFormGroup(child) || isFormArray(child)) {
      const subPath = getControlPath(child as FormGroup, control);
      if (subPath) {
        return `${key}.${subPath}`;
      }
    }
  }

  // Fallback: walk up the parent chain from control to root
  let current: AbstractControl | null | undefined = control;
  const segments: string[] = [];
  while (current?.parent) {
    const parent: FormContainer = current.parent;
    for (const [key, controlInParent] of getChildEntries(parent)) {
      if (controlInParent === current) {
        segments.unshift(key);
        break;
      }
    }
    current = parent;
    if (current === formGroup) {
      return segments.join('.');
    }
  }

  // Last resort: try control.name if available
  const name = (control as ControlWithOptionalName).name;
  if (typeof name === 'string') {
    return name;
  }
  return '';
}

/**
 * Recursively calculates the path of a form group
 * @param formGroup
 * @param control
 */
function getGroupPath(formGroup: FormGroup, control: AbstractControl): string {
  for (const [key, ctrl] of getChildEntries(formGroup)) {
    if (ctrl === control) {
      return key;
    }
    if (isFormGroup(ctrl)) {
      const path = getGroupPath(ctrl, control);
      if (path) {
        return `${key}.${path}`;
      }
    }
  }
  return '';
}

/**
 * @internal
 * Internal utility for calculating form control field paths.
 *
 * **Not intended for external use.** This function is used internally by the library
 * to determine field names for validation. Use the `name` attribute on your form controls
 * instead of relying on this function.
 *
 * Calculates the field name of a form control: Eg: addresses.shippingAddress.street
 * @param rootForm
 * @param control
 */
export function getFormControlField(
  rootForm: FormGroup,
  control: AbstractControl
): string {
  return getControlPath(rootForm, control);
}

/**
 * @internal
 * Internal utility for calculating form group field paths.
 *
 * **Not intended for external use.** This function is used internally by the library
 * to determine field names for nested form groups.
 *
 * Calcuates the field name of a form group Eg: addresses.shippingAddress
 * @param rootForm
 * @param control
 */
export function getFormGroupField(
  rootForm: FormGroup,
  control: AbstractControl
): string {
  return getGroupPath(rootForm, control);
}

/**
 * @internal
 * Internal utility for merging form values with disabled field values.
 *
 * **Not intended for external use.** This function is used internally by the library
 * to include disabled field values in form submissions. Use Angular's `getRawValue()`
 * method on your form if you need to access disabled field values.
 *
 * This utility merges the value of the form with the raw value.
 * By doing this we can assure that we don't lose values of disabled form fields
 *
 * Security: Unsafe prototype-related keys (`__proto__`, `prototype`, `constructor`)
 * are skipped during recursive merge.
 * @param form
 */
export function mergeValuesAndRawValues<T>(form: FormGroup): T {
  // Deep clone both values to prevent reference sharing.
  // This is necessary because:
  // 1. form.value may contain object references that could be mutated elsewhere
  // 2. form.getRawValue() also returns references to form control values
  // 3. Without cloning, mutations to the returned object would affect the original form state
  // 4. The merge operation itself requires a mutable copy to work with
  // Performance note: For large forms, this may have performance implications. However,
  // reference isolation is critical for maintaining form state integrity.
  const value = structuredClone(form.value);
  const rawValue = structuredClone(form.getRawValue());

  // Recursive function to merge rawValue into value
  function mergeRecursive(target: UnknownRecord, source: UnknownRecord): void {
    for (const key of Object.keys(source)) {
      if (isUnsafePathSegment(key)) {
        continue;
      }

      const sourceValue = source[key];
      const targetValue = target[key];

      if (targetValue === undefined || targetValue === null) {
        // Key missing from target (e.g. disabled field) or set to null —
        // copy source so raw values from disabled controls aren't dropped.
        target[key] = sourceValue;
      } else if (isRecord(sourceValue) && isRecord(targetValue)) {
        // If the value is an object, merge it recursively
        mergeRecursive(targetValue, sourceValue);
      }
      // If the target already has the key with a primitive value, it's left as is to maintain references
    }
  }

  mergeRecursive(value as UnknownRecord, rawValue as UnknownRecord);
  return value;
}

function getStringArrayError(
  errors: ValidationErrors | null,
  key: string
): string[] | undefined {
  const value = errors?.[key];
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === 'string')
    : undefined;
}

/**
 * Sets a value in an object at the provided field path.
 *
 * Supports dot and bracket notation via `parseFieldPath()`.
 * Examples: `user.profile.name`, `addresses[0].street`.
 *
 * Security: If any path segment matches an unsafe prototype-related key
 * (`__proto__`, `prototype`, `constructor`), the write is ignored.
 *
 * @param obj - Target object to mutate.
 * @param path - Dot/bracket field path.
 * @param value - Value to assign at the resolved path.
 */
export function setValueAtPath(
  obj: object,
  path: string,
  value: unknown
): void {
  const keys = parseFieldPath(path);
  if (keys.length === 0) {
    return;
  }

  let current: UnknownRecord = obj as UnknownRecord;

  for (let i = 0; i < keys.length - 1; i++) {
    const segment = keys[i];
    const nextSegment = keys[i + 1];
    if (segment === undefined) {
      continue;
    }
    if (isUnsafePathSegment(segment)) {
      return;
    }

    const key = String(segment);

    const next = current[key];
    if (!Array.isArray(next) && !isRecord(next)) {
      const shouldCreateArray =
        typeof nextSegment === 'number' ||
        (typeof nextSegment === 'string' && /^\d+$/.test(nextSegment));
      current[key] = shouldCreateArray ? [] : {};
    }
    current = current[key] as UnknownRecord;
  }

  const lastSegment = keys[keys.length - 1];
  if (lastSegment === undefined || isUnsafePathSegment(lastSegment)) {
    return;
  }

  current[String(lastSegment)] = value;
}

/**
 * Collects all errors and warnings reachable from `form` keyed by dotted
 * field path.
 *
 * Root-form (`ROOT_FORM`) entries come from `form.errors.errors` and
 * `form.errors.warnings` — the shape `ValidateRootFormDirective` writes.
 * Field-level entries come from each descendant control's `errors.errors`
 * and `errors.warnings`. Disabled controls are skipped.
 *
 * Inside templates and components, prefer the directive's `formState()` and
 * `fieldWarnings()` signals — they're reactive and already memoised. Reach
 * for this function when you need a one-shot snapshot, e.g. for logging or
 * structured-clone-friendly serialisation.
 *
 * @publicApi
 */
export function getAllFormErrors(form?: AbstractControl): NgxFormErrorsByPath {
  const errors: Record<string, string[]> = {};
  const warnings: Record<string, string[]> = {};
  if (!form) {
    return { errors, warnings };
  }

  // Collect root form errors / warnings (from ValidateRootFormDirective) before
  // processing children so they appear under the ROOT_FORM key.
  if (form.enabled) {
    const rootErrors = getStringArrayError(form.errors, ERROR_MESSAGES_KEY);
    if (rootErrors) {
      errors[ROOT_FORM] = rootErrors;
    }
    const rootWarnings = getStringArrayError(form.errors, WARNING_MESSAGES_KEY);
    if (rootWarnings) {
      warnings[ROOT_FORM] = rootWarnings;
    }
  }

  function collect(
    control: AbstractControl,
    pathParts: Array<string | number>
  ): void {
    const pathString = stringifyFieldPath(pathParts);

    // Skip processing the root form control directly in NgxFormDirective
    if (pathParts.length === 0 && control === form) {
      // Instead, iterate its children if it's a group/array
      if (isFormGroup(control) || isFormArray(control)) {
        for (const [key, childControl] of getChildEntries(control)) {
          const numericKey = Number(key);
          const nextPath = [
            // ...pathParts, // pathParts is empty here
            Number.isNaN(numericKey) ? key : numericKey,
          ];
          collect(childControl, nextPath);
        }
      }
      return; // Stop processing for the root form itself at this level
    }

    if (isFormGroup(control) || isFormArray(control)) {
      for (const [key, childControl] of getChildEntries(control)) {
        const numericKey = Number(key);
        const nextPath = [
          ...pathParts,
          Number.isNaN(numericKey) ? key : numericKey,
        ];
        collect(childControl, nextPath);
      }
    }

    if (control.enabled) {
      const fieldErrors = getStringArrayError(
        control.errors,
        ERROR_MESSAGES_KEY
      );
      if (fieldErrors) {
        errors[pathString] = fieldErrors;
      }
      const fieldWarnings = getStringArrayError(
        control.errors,
        WARNING_MESSAGES_KEY
      );
      if (fieldWarnings) {
        warnings[pathString] = fieldWarnings;
      }
    }
  }

  collect(form, []);

  return { errors, warnings };
}
