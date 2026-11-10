import type { FormControlStatus, FormGroup } from '@angular/forms';
import { filter, type Observable, of, take } from 'rxjs';

/**
 * @internal
 * The root status once it is no longer PENDING: emits right away when
 * validation already settled, otherwise on the next settled status.
 */
export function settledStatus(form: FormGroup): Observable<FormControlStatus> {
  if (form.status !== 'PENDING') {
    return of(form.status);
  }
  return form.statusChanges.pipe(
    filter((status) => status !== 'PENDING'),
    take(1)
  );
}
