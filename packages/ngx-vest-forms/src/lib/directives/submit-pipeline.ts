import type {
  AbstractControl,
  FormControlStatus,
  FormGroup,
  NgForm,
} from '@angular/forms';
import {
  asapScheduler,
  filter,
  type Observable,
  observeOn,
  of,
  share,
  switchMap,
  take,
} from 'rxjs';

/** Number of ancestors above `control`. */
function depth(control: AbstractControl): number {
  let count = 0;
  for (let parent = control.parent; parent; parent = parent.parent) {
    count++;
  }
  return count;
}

/**
 * @internal
 * Re-runs the validators of every `validationConfig` dependent, then of
 * their ancestors, deepest first, so the root status includes a dependent
 * that is still PENDING.
 *
 * `FormDirective` runs it on every submit, from its submit outcome stream.
 * The config pipeline debounces trigger changes and revalidates dependents
 * with `onlySelf`, so a submit right after a trigger edit could otherwise
 * settle on a dependent's stale verdict, such as a confirm-password field
 * that still matches the old password. It runs after the `(ngSubmit)`
 * handlers: they read the status synchronously, and a revalidation would
 * turn it PENDING under them.
 */
export function revalidateConfigDependents(
  form: FormGroup,
  validationConfig: unknown
): void {
  const config = validationConfig as Record<
    string,
    string[] | undefined
  > | null;
  if (!config) {
    return;
  }
  const ancestors = new Set<AbstractControl>();
  for (const path of new Set(Object.values(config).flat())) {
    const control = path ? form.get(path) : null;
    if (!control) {
      continue;
    }
    control.updateValueAndValidity({ onlySelf: true, emitEvent: true });
    for (let parent = control.parent; parent; parent = parent.parent) {
      ancestors.add(parent);
    }
  }
  for (const ancestor of [...ancestors].sort((a, b) => depth(b) - depth(a))) {
    ancestor.updateValueAndValidity({ onlySelf: true, emitEvent: true });
  }
}

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

/**
 * @internal
 * The root status once a submit has settled, one emission per submit. A new
 * submit while one is still waiting replaces it.
 *
 * It starts one microtask after `ngSubmit`, so every synchronous
 * `(ngSubmit)` handler has run first, then revalidates the
 * `validationConfig` dependents (read through `validationConfig` at submit
 * time). The stream is shared, so that runs once per submit for all
 * subscribers.
 */
export function submitOutcomes(
  ngForm: NgForm,
  validationConfig: () => unknown
): Observable<FormControlStatus> {
  return ngForm.ngSubmit.pipe(
    observeOn(asapScheduler),
    switchMap(() => {
      revalidateConfigDependents(ngForm.form, validationConfig());
      return settledStatus(ngForm.form);
    }),
    share()
  );
}
