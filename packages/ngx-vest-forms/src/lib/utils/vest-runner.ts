import { DestroyRef, ErrorHandler } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ValidationErrors } from '@angular/forms';
import { Observable, defer, from, map, of, switchMap, take, timer } from 'rxjs';
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

type FocusRunResult<T> = {
  run(model: T): NgxSuiteRunResult;
};

/**
 * Structural subset of `NgxVestSuite` the runner depends on. Keeps the runner
 * decoupled from method names the call sites do not need (reset, dump, etc.).
 *
 * Vest's `run()` accepts the suite callback's parameter list and forwards
 * every argument to it. ngx-vest-forms suites take only the model, so this
 * runner always calls `suite.run(model)`. Field/group focus is selected at
 * the call site via `only(...)` / `focus(...)` before `.run(model)`. Vest has
 * no per-run hooks/signal transport, so cancellation is handled purely at the
 * RxJS layer (unsubscribe / `takeUntilDestroyed`).
 */
export type RunnableVestSuite<T> = {
  only(match: string | string[] | null | undefined): {
    run(model: T): NgxSuiteRunResult;
  };
  run(model: T): NgxSuiteRunResult;
  get(): NgxSuiteRunResult;
  focus?(focus: NgxSuiteFocusSpec): FocusRunResult<T>;
};

/**
 * Run a Vest suite for one field (or the whole form when the focus spec is empty)
 * and emit the resulting suite state exactly once.
 *
 * - Even at zero debounce the suite invocation is deferred by one task so
 *   superseded validators can be unsubscribed before the suite runs, unless
 *   `immediate` is set (the submit pass). Then the suite runs right away
 *   and a result with no async tests still running is emitted synchronously,
 *   so a synchronous suite never leaves the control PENDING.
 * - Vest 6.3 `run()` is always thenable (the result is a promise merged with
 *   the synchronous selectors). We emit the *resolved* value. Since Vest 6.3.4
 *   an older pending run resolves to the latest run's result; field verdicts
 *   stay correct because Vest keeps each field's state across runs.
 *   `suite.get()` is only used as a defensive fallback if resolution yields
 *   nothing. Vest 6.3 never rejects the run promise; should one reject, the
 *   error propagates to the caller, which reports it to `ErrorHandler`.
 * - Subscription is automatically torn down on `destroyRef` so callers do not
 *   need a separate `takeUntilDestroyed`. Tearing down the subscription (via
 *   unsubscribe, the outer `switchMap`, or `destroyRef`) cancels the pending
 *   Observable; no AbortSignal is forwarded to Vest because Vest 6.3 does not
 *   accept one through `run()`.
 */
export function runFieldValidation<T>(
  suite: RunnableVestSuite<T>,
  focus: NgxSuiteFocusSpec,
  model: T,
  options: ValidationOptions,
  destroyRef: DestroyRef,
  immediate = false
): Observable<NgxSuiteRunResult> {
  if (immediate) {
    return defer(() => runSuite(suite, focus, model, true)).pipe(
      take(1),
      takeUntilDestroyed(destroyRef)
    );
  }

  return defer(() => {
    // `timer(0)` (not `of(0)`) so that even at zero debounce the suite
    // invocation is deferred to the next task. That lets superseded validators
    // be unsubscribed by Angular's switchMap-style cancellation before the
    // suite runs.
    const debounce = options.debounceTime ?? 0;

    return timer(debounce).pipe(
      switchMap(() => runSuite(suite, focus, model)),
      take(1),
      takeUntilDestroyed(destroyRef)
    );
  });
}

/**
 * Reports a suite error to Angular's ErrorHandler. A handler that throws
 * (some rethrow in tests) must not stop the validator's fail-open result,
 * or Angular would leave the control PENDING.
 */
export function reportToErrorHandler(
  errorHandler: ErrorHandler,
  error: unknown
): void {
  try {
    errorHandler.handleError(error);
  } catch {
    // Already reported as far as the handler allows; keep validating.
  }
}

export function extractFieldErrors(
  result: NgxSuiteRunResult,
  field: string
): ValidationErrors | null {
  const errors = result.getErrors(field);
  if (!errors?.length) {
    return null;
  }
  // Warnings are embedded alongside `errors` for consumers that read
  // `control.errors.warnings` (e.g. the control wrapper's warning display).
  // Angular treats any non-null `ValidationErrors` object as "invalid", but
  // because we only reach here when there are real errors, attaching warnings
  // does not change validity. `FormDirective` additionally mirrors them into
  // its `fieldWarnings` signal for warning-only (valid) fields.
  //
  // NOTE (Vest M1, deferred): this means warnings have two surfaces (this key
  // and `fieldWarnings`). Consolidating to a single source is a deliberate
  // breaking change tracked as an ADR rather than changed here, to preserve
  // the established `control.errors.warnings` display contract.
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

function isThenable(
  value: NgxSuiteRunResult
): value is NgxSuiteRunResult & PromiseLike<NgxSuiteRunResult> {
  return typeof (value as { then?: unknown }).then === 'function';
}

function runSuite<T>(
  suite: RunnableVestSuite<T>,
  focus: NgxSuiteFocusSpec,
  model: T,
  emitSettledSynchronously = false
): Observable<NgxSuiteRunResult> {
  let result: NgxSuiteRunResult;

  if (!isEmptyFocusSpec(focus) && typeof suite.focus === 'function') {
    result = suite.focus(focus).run(model);
  } else if (focus.only !== undefined) {
    result = suite.only(focus.only).run(model);
  } else {
    result = suite.run(model);
  }

  // A purely synchronous result (no `then`) is emitted directly.
  if (!isThenable(result)) {
    return of(result);
  }

  // Immediate runs read a settled result's sync selectors now instead of
  // waiting a microtask for the promise. They are read at once, before any
  // later run can change the suite's state.
  if (emitSettledSynchronously && !result.isPending()) {
    return of(result);
  }

  // `from(result)` subscribes to the thenable exactly once and emits the
  // value it resolves to (since Vest 6.3.4, the latest run's result when a
  // newer run of the same suite superseded this one; field verdicts stay
  // correct because Vest keeps each field's state across runs). Crucially this
  // does NOT recursively adopt nested thenables the way
  // `Promise.resolve(result)` does: a Vest result whose resolved value is
  // itself thenable (the promise/selectors merge) would send `Promise.resolve`
  // into an unbounded adoption loop. `suite.get()` is only a defensive
  // fallback when resolution yields nothing. Vest 6.3 only ever resolves the
  // run promise; if a suite-like object rejects, the error propagates and the
  // callers report it to `ErrorHandler` and fail closed (field) or open (root
  // form) instead of passing the suite's latest state off as this run's.
  return from(result).pipe(map((value) => value ?? suite.get()));
}
