import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ValidationErrors } from '@angular/forms';
import {
  Observable,
  catchError,
  defer,
  from,
  map,
  of,
  switchMap,
  take,
  timer,
} from 'rxjs';
import type { ValidationOptions } from '../directives/validation-options';
import type { NgxSuiteRunResult, NgxVestSuite } from './validation-suite';

/**
 * Focus spec describing which subset of the suite to run.
 *
 * Currently honours `only` via `suite.only(field).run(model)`. Group focus
 * (`onlyGroup`/`skipGroup`) and `skip` need Vest's `suite.focus(...)` API,
 * which `NgxVestSuite` does not expose yet; reserved here for forward
 * compatibility with the planned `[validationFocus]` directive.
 */
export type NgxSuiteFocusSpec = {
  only?: string;
};

/**
 * Structural subset of `NgxVestSuite` the runner depends on. Keeps the runner
 * decoupled from method names the call sites do not need (reset, dump, etc.).
 */
export type RunnableVestSuite<T> = Pick<NgxVestSuite<T>, 'only' | 'run' | 'get'>;

/**
 * Run a Vest suite for one field (or the whole form when `focus.only` is
 * omitted) and emit the resulting suite state exactly once.
 *
 * - Even at zero debounce the suite invocation is deferred by one task so
 *   superseded validators can be unsubscribed before the suite runs.
 * - Synchronous suite results emit on the next task without going through a
 *   PENDING phase.
 * - Thenable (async) results are awaited; on resolution the canonical state
 *   is read back from `suite.get()`. On rejection the same fallback applies
 *   so consumers always receive a result object.
 * - Subscription is automatically torn down on `destroyRef` so callers do not
 *   need a separate `takeUntilDestroyed`.
 */
export function runFieldValidation<T>(
  suite: RunnableVestSuite<T>,
  focus: NgxSuiteFocusSpec,
  model: T,
  options: ValidationOptions,
  destroyRef: DestroyRef
): Observable<NgxSuiteRunResult> {
  // `timer(0)` (not `of(0)`) so that even at zero debounce the suite invocation
  // is deferred to the next task. That lets superseded validators be unsubscribed
  // by Angular's switchMap-style cancellation before the suite runs.
  const debounce = options.debounceTime ?? 0;

  return timer(debounce).pipe(
    switchMap(() => defer(() => runSuite(suite, focus, model))),
    take(1),
    takeUntilDestroyed(destroyRef)
  );
}

export function extractFieldErrors(
  result: NgxSuiteRunResult,
  field: string
): ValidationErrors | null {
  const errors = pickFieldMessages(result.getErrors(field), field);
  if (!errors?.length) {
    return null;
  }
  const warnings = extractFieldWarnings(result, field);
  return warnings?.length ? { errors, warnings } : { errors };
}

export function extractFieldWarnings(
  result: NgxSuiteRunResult,
  field: string
): string[] | undefined {
  const warnings = pickFieldMessages(result.getWarnings(field), field);
  return warnings?.length ? warnings : undefined;
}

// Defensive: Vest's typed overload returns `string[]` when called with a field,
// but some suite shapes (and test doubles) return the whole `Record<string, string[]>`
// regardless of arguments. Normalize both into `string[]` for the requested field.
function pickFieldMessages(
  messages: string[] | Record<string, string[]> | undefined,
  field: string
): string[] | undefined {
  if (!messages) {
    return undefined;
  }
  return Array.isArray(messages) ? messages : messages[field];
}

function runSuite<T>(
  suite: RunnableVestSuite<T>,
  focus: NgxSuiteFocusSpec,
  model: T
): Observable<NgxSuiteRunResult> {
  const result =
    focus.only !== undefined
      ? suite.only(focus.only).run(model)
      : suite.run(model);

  if (typeof result.then !== 'function') {
    return of(result);
  }

  return from(result as unknown as PromiseLike<NgxSuiteRunResult>).pipe(
    map(() => suite.get()),
    catchError(() => of(suite.get()))
  );
}
