import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
import { stringifyFieldPath } from './field-path.utils';

/**
 * @internal
 * Collects field paths for all touched leaf controls, or all leaf controls once
 * the form has been submitted.
 */
export function collectTouchedPaths(
  form: AbstractControl,
  submitted: boolean
): readonly string[] {
  const fields: string[] = [];

  const collect = (
    control: AbstractControl,
    path: Array<string | number>
  ): void => {
    if (control instanceof FormGroup) {
      for (const [name, child] of Object.entries(control.controls)) {
        collect(child, [...path, name]);
      }
      return;
    }

    if (control instanceof FormArray) {
      control.controls.forEach((child, index) => {
        collect(child, [...path, index]);
      });
      return;
    }

    if ((submitted || control.touched) && path.length > 0) {
      fields.push(stringifyFieldPath(path));
    }
  };

  collect(form, []);
  return fields;
}
