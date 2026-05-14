import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ValidationErrors } from '@angular/forms';
import {
  Observable,
  catchError,
  defer,
  finalize,
  from,
  map,
  of,
  switchMap,
  take,
  tap,
  timer,
} from 'rxjs';
import type { ValidationOptions } from '../directives/validation-options';
import type { NgxSuiteRunResult } from './validation-suite';

/**
 * Focus spec describing which subset of the suite to run.
 */
export type NgxSuiteFocusSpec = {
  only?: string;
  skip?: string;
  onlyGroup?: string | readonly string[];
  skipGroup?: string | readonly string[];
};

export type NgxSuiteRunHooks = {
  signal: AbortSignal;
};

type FocusRunResult<T> = {
  run(model: T, field?: unknown, hooks?: NgxSuiteRunHooks): NgxSuiteRunResult;
};

/**
 * Structural subset of `NgxVestSuite` the runner depends on. Keeps the runner
 * decoupled from method names the call sites do not need (reset, dump, etc.).
 *
 * The `hooks` parameter is optional on `only(...).run` and `run(...)` so plain
 * `NgxVestSuite<T>` (whose declared signatures don't include hooks) remains
 * assignable; Vest 6.3 accepts the hooks object at runtime regardless.
 */
export type RunnableVestSuite<T> = {
  only(match: string | string[] | null | undefined): {
    run(model: T, field?: unknown, hooks?: NgxSuiteRunHooks): NgxSuiteRunResult;
  };
  run(model: T, field?: unknown, hooks?: NgxSuiteRunHooks): NgxSuiteRunResult;
  get(): NgxSuiteRunResult;
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
  return defer(() => {
    const controller = new AbortController();
    // `finalize` runs on completion as well as unsubscribe/error, so naively
    // aborting there flips `signal.aborted` to `true` even for successful runs.
    // Track whether the run emitted; only abort when teardown happens *before*
    // emission (unsubscribe, destroy, or superseded run via outer `switchMap`).
    let emitted = false;

    // `timer(0)` (not `of(0)`) so that even at zero debounce the suite
    // invocation is deferred to the next task. That lets superseded validators
    // be unsubscribed by Angular's switchMap-style cancellation before the
    // suite runs.
    const debounce = options.debounceTime ?? 0;

    return timer(debounce).pipe(
      switchMap(() =>
        defer(() => runSuite(suite, focus, model, controller.signal))
      ),
      take(1),
      tap(() => {
        emitted = true;
      }),
      takeUntilDestroyed(destroyRef),
      finalize(() => {
        if (!emitted) {
          controller.abort();
        }
      })
    );
  });
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

function isEmptyFocusValue(
  value: string | readonly string[] | undefined
): boolean {
  if (value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  return value === '';
}

function isEmptyFocusSpec(focus: NgxSuiteFocusSpec): boolean {
  return (
    isEmptyFocusValue(focus.only) &&
    isEmptyFocusValue(focus.skip) &&
    isEmptyFocusValue(focus.onlyGroup) &&
    isEmptyFocusValue(focus.skipGroup)
  );
}

function runSuite<T>(
  suite: RunnableVestSuite<T>,
  focus: NgxSuiteFocusSpec,
  model: T,
  signal: AbortSignal
): Observable<NgxSuiteRunResult> {
  const hooks: NgxSuiteRunHooks = { signal };
  let result: NgxSuiteRunResult;

  if (!isEmptyFocusSpec(focus) && typeof suite.focus === 'function') {
    result = suite.focus(focus).run(model, undefined, hooks);
  } else if (focus.only !== undefined) {
    result = suite.only(focus.only).run(model, undefined, hooks);
  } else {
    result = suite.run(model, undefined, hooks);
  }

  if (!isThenable(result)) {
    return of(result);
  }

  return from(result).pipe(
    map(() => suite.get()),
    catchError(() => of(suite.get()))
  );
}
