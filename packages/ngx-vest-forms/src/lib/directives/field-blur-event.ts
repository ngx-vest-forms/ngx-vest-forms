import type { NgForm } from '@angular/forms';
import { mergeValuesAndRawValues, setValueAtPath } from '../utils/form-utils';
import {
  readElementValueForBlur,
  resolveFieldFromBlur,
} from './field-path-resolver';
import type { NgxFieldBlurEvent } from './form-directive.types';

/**
 * @internal
 * The `fieldBlur` payload for a `focusout` whose target is a named control
 * of `ngForm`, or `null` when the target is not one.
 */
export function fieldBlurEvent<T>(
  ngForm: NgForm,
  target: EventTarget | null
): NgxFieldBlurEvent<T> | null {
  const resolved = resolveFieldFromBlur(ngForm, target);
  if (!resolved) {
    return null;
  }
  const { field, control, element } = resolved;

  // Read the latest value directly from the DOM element when it can be
  // trusted. Radio groups and `<select>` controls fall back to `control.value`
  // because Angular keeps the bound control value in sync with the selected
  // option(s), whereas raw DOM values break unchecked radios, `[ngValue]`
  // options (such as `"0: Object"`), and `<select multiple>`. For text inputs
  // and textareas we prefer the element value to avoid
  // `ngModelOptions.updateOn: 'submit'` staleness.
  const domValue = readElementValueForBlur(element);
  const value = domValue !== undefined ? domValue : control.value;

  const formValue = mergeValuesAndRawValues<T>(ngForm.form);
  setValueAtPath(formValue as object, field, value);

  return {
    field,
    value,
    formValue,
    dirty: control.dirty,
    touched: control.touched,
    valid: control.valid,
    pending: control.pending,
  };
}
