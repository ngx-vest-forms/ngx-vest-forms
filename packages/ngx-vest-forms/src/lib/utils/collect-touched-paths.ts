import { type AbstractControl, isFormArray, isFormGroup } from '@angular/forms';

/**
 * @internal
 * Collects field paths for all touched leaf controls, or all leaf controls
 * once the form has been submitted.
 *
 * Walks the control tree iteratively over a shared segment stack, so each
 * leaf path costs O(1) extra allocation instead of O(depth).
 */
export function collectTouchedPaths(
  form: AbstractControl,
  submitted: boolean
): readonly string[] {
  const fields: string[] = [];
  const segments: string[] = [];

  const visit = (control: AbstractControl): void => {
    if (isFormGroup(control)) {
      for (const [name, child] of Object.entries(control.controls)) {
        segments.push(name);
        visit(child);
        segments.pop();
      }
      return;
    }

    if (isFormArray(control)) {
      for (const [index, child] of control.controls.entries()) {
        segments.push(String(index));
        visit(child);
        segments.pop();
      }
      return;
    }

    if ((submitted || control.touched) && segments.length > 0) {
      // Dot notation, array indices included (`contacts.0.label`).
      fields.push(segments.join('.'));
    }
  };

  visit(form);
  return fields;
}
