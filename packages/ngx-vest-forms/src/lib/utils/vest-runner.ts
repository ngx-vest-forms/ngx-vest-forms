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
 * Vest 6.3 `run()` takes only the model — `suite.run(model)`. Field/group
 * focus is selected at the call site via `only(...)` / `focus(...)` before
 * `.run(model)`. There is no per-run hooks/signal transport: Vest 6.3 ignores
 * any positional args after the model, so cancellation is handled purely at
 * the RxJS layer (unsubscribe / `takeUntilDestroyed`).
 */
export type RunnableVestSuite<T> = {
  only(match: string | string[] | null | undefined): {
    run(model: T): NgxSuiteRunResult;
  };
  run(model: T): NgxSuiteRunResult;
  get(): NgxSuiteRunResult;
  focus?: (focus: NgxSuiteFocusSpec) => FocusRunResult<T>;
};

/**
 * Run a Vest suite for one field (or the whole form when the focus spec is empty)
 * and emit the resulting suite state exactly once.
 *
 * - Even at zero debounce the suite invocation is deferred by one task so
 *   superseded validators can be unsubscribed before the suite runs.
 * - Vest 6.3 `run()` is always thenable (the result is a promise merged with
 *   the synchronous selectors). The promise resolves to the per-run snapshot,
 *   so we emit the *resolved* value rather than re-reading the shared mutable
 *   `suite.get()` state — this prevents cross-field contamination under
 *   concurrent async runs. `suite.get()` is only used as a defensive fallback
 *   if resolution yields nothing or rejects.
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
  destroyRef: DestroyRef
): Observable<NgxSuiteRunResult> {
  return defer(() => {
    // `timer(0)` (not `of(0)`) so that even at zero debounce the suite
    // invocation is deferred to the next task. That lets superseded validators
    // be unsubscribed by Angular's switchMap-style cancellation before the
    // suite runs.
    const debounce = options.debounceTime ?? 0;

    return timer(debounce).pipe(
      switchMap(() => defer(() => runSuite(suite, focus, model))),
      take(1),
      takeUntilDestroyed(destroyRef)
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

  // A purely synchronous result (no `then`) is emitted directly.
  if (!isThenable(result)) {
    return of(result);
  }

  // `from(result)` subscribes to the thenable exactly once and emits the
  // value it resolves to — the canonical *per-run* snapshot captured at run
  // time. Crucially this does NOT recursively adopt nested thenables the way
  // `Promise.resolve(result)` does: a Vest result whose resolved value is
  // itself thenable (the promise/selectors merge) would send `Promise.resolve`
  // into an unbounded adoption loop. Emitting the resolved value (rather than
  // re-reading the shared mutable `suite.get()`) prevents cross-field
  // contamination under concurrent async runs; `suite.get()` is only a
  // defensive fallback when resolution yields nothing or rejects.
  return from(result).pipe(
    map((value) => value ?? suite.get()),
    catchError(() => of(suite.get()))
  );
}
