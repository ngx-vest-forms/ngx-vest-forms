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
 */
export type NgxSuiteFocusSpec = {
  only?: string;
  skip?: string;
  onlyGroup?: string | readonly string[];
  skipGroup?: string | readonly string[];
};

type FocusRunResult<T> = {
  run(model: T): NgxSuiteRunResult;
};

/**
 * Structural subset of `NgxVestSuite` the runner depends on. Keeps the runner
 * decoupled from method names the call sites do not need (reset, dump, etc.).
 */
export type RunnableVestSuite<T> = Pick<NgxVestSuite<T>, 'only' | 'run' | 'get'> & {
  focus?: (focus: NgxSuiteFocusSpec) => FocusRunResult<T>;
};

/**
 * Run a Vest suite for one field (or the whole form when the focus spec is empty)
 * and emit the resulting suite state exactly once.
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
  const errors = result.getErrors(field);
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
  const warnings = result.getWarnings(field);
  return warnings?.length ? warnings : undefined;
}

function isThenable(
  value: NgxSuiteRunResult
): value is NgxSuiteRunResult & PromiseLike<NgxSuiteRunResult> {
  return typeof value.then === 'function';
}

function isEmptyFocusSpec(focus: NgxSuiteFocusSpec): boolean {
  const onlyGroup = Array.isArray(focus.onlyGroup)
    ? focus.onlyGroup.length
    : focus.onlyGroup;
  const skipGroup = Array.isArray(focus.skipGroup)
    ? focus.skipGroup.length
    : focus.skipGroup;
  return (
    focus.only === undefined &&
    focus.skip === undefined &&
    onlyGroup === undefined &&
    skipGroup === undefined
  );
}

function runSuite<T>(
  suite: RunnableVestSuite<T>,
  focus: NgxSuiteFocusSpec,
  model: T
): Observable<NgxSuiteRunResult> {
  let result: NgxSuiteRunResult;

  if (!isEmptyFocusSpec(focus) && typeof suite.focus === 'function') {
    result = suite.focus(focus).run(model);
  } else if (focus.only !== undefined) {
    result = suite.only(focus.only).run(model);
  } else {
    result = suite.run(model);
  }

  if (!isThenable(result)) {
    return of(result);
  }

  return from(result).pipe(
    map(() => suite.get()),
    catchError(() => of(suite.get()))
  );
}
