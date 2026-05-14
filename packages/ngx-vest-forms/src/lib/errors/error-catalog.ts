export const NGX_VEST_FORMS_ERRORS = {
  EXTRA_PROPERTY: {
    code: 'NGX-001',
    message: (path: string) =>
      `Shape mismatch: Property '${path}' is present in the form value but not defined in the form shape.`,
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
} as const;

export function logWarning<T extends unknown[]>(
  error: { code: string; message: (...args: T) => string },
  ...args: T
): void {
  console.warn(
    `[${error.code}] ${error.message(...args)}\nCheck your [formShape] input and the initial [formValue].`
  );
}
