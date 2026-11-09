import { AbstractControl } from '@angular/forms';
import { Observable, Subject } from 'rxjs';

const validationResets = new WeakMap<AbstractControl, Subject<void>>();

/**
 * @internal
 * Emits when the library resets a control's validation state without
 * Angular's `reset()` (e.g. `FormDirective.resetField()`, which keeps the
 * control's value and touched/dirty state, so no `FormResetEvent` fires).
 * Error display drops the messages it holds for that control.
 */
export function onValidationReset(control: AbstractControl): Observable<void> {
  let resets = validationResets.get(control);
  if (!resets) {
    resets = new Subject<void>();
    validationResets.set(control, resets);
  }
  return resets.asObservable();
}

/**
 * @internal
 * Tells everything listening through {@link onValidationReset} that
 * `control`'s validation state was reset.
 */
export function notifyValidationReset(control: AbstractControl): void {
  validationResets.get(control)?.next();
}
