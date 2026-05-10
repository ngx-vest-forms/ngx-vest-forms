import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ValidationErrors } from '@angular/forms';
import {
  Observable,
  catchError,
  defer,
  finalize,
  from,
  of,
  switchMap,
  take,
  timer,
} from 'rxjs';
import { ValidationOptions } from '../directives/validation-options';
import { NgxTypedVestSuite, NgxVestSuite } from './validation-suite';

export type NgxSuiteFocusSpec = {
  only?: string;
  skip?: string;
  onlyGroup?: string;
  skipGroup?: string;
};

export type NgxSuiteRunResult = {
  getErrors(field?: string): string[] | Record<string, string[]>;
  getWarnings(field?: string): string[] | Record<string, string[]>;
};

type NgxFocusedVestSuite<T> = {
  run(model: T): NgxSuiteRunResult | PromiseLike<NgxSuiteRunResult>;
  focus(focus: NgxSuiteFocusSpec): {
    run(model: T): NgxSuiteRunResult | PromiseLike<NgxSuiteRunResult>;
  };
  get?(): NgxSuiteRunResult;
};

type NgxRunnableVestSuite<T> =
  | NgxVestSuite<T>
  | NgxTypedVestSuite<T>
  | NgxFocusedVestSuite<T>;

export function runFieldValidation<T>(
  suite: NgxRunnableVestSuite<T>,
  focus: NgxSuiteFocusSpec,
  model: T,
  options: ValidationOptions,
  destroyRef: DestroyRef
): Observable<NgxSuiteRunResult> {
  const debounce = options.debounceTime ?? 0;
  const source$ = debounce > 0 ? timer(debounce) : of(0);

  return source$.pipe(
    switchMap(() =>
      defer(() => {
        const abortController = new AbortController();
        options.abortControllerHook?.(abortController);

        const runResult = invokeSuite(suite, focus, model);

        return from(Promise.resolve(runResult)).pipe(
          catchError(() => of(readLatestSuiteResult(suite, runResult))),
          finalize(() => abortController.abort())
        );
      })
    ),
    take(1),
    takeUntilDestroyed(destroyRef)
  );
}

export function extractFieldErrors(
  result: NgxSuiteRunResult,
  field: string
): ValidationErrors | null {
  const errors = extractFieldMessages(result.getErrors(field), field);
  if (!errors?.length) {
    return null;
  }

  const warnings = extractFieldWarnings(result, field);
  return {
    errors,
    ...(warnings?.length && { warnings }),
  };
}

export function extractFieldWarnings(
  result: NgxSuiteRunResult,
  field: string
): string[] | undefined {
  return extractFieldMessages(result.getWarnings(field), field);
}

function invokeSuite<T>(
  suite: NgxRunnableVestSuite<T>,
  focus: NgxSuiteFocusSpec,
  model: T
): NgxSuiteRunResult | PromiseLike<NgxSuiteRunResult> {
  if (hasFocusApi(suite)) {
    if (isEmptyFocusSpec(focus)) {
      return suite.run(model);
    }
    return suite.focus(focus).run(model);
  }

  if (typeof suite === 'function') {
    const callableSuite = suite as unknown as (
      model: T,
      field?: string
    ) => NgxSuiteRunResult | PromiseLike<NgxSuiteRunResult>;

    if (focus.only !== undefined && supportsFieldOnlyFocus(focus)) {
      return callableSuite(model, focus.only);
    }
    return callableSuite(model);
  }

  throw new Error('Unsupported Vest suite');
}

function supportsFieldOnlyFocus(focus: NgxSuiteFocusSpec): boolean {
  return (
    focus.skip === undefined &&
    focus.onlyGroup === undefined &&
    focus.skipGroup === undefined
  );
}

function isEmptyFocusSpec(focus: NgxSuiteFocusSpec): boolean {
  return (
    focus.only === undefined &&
    focus.skip === undefined &&
    focus.onlyGroup === undefined &&
    focus.skipGroup === undefined
  );
}

function hasFocusApi<T>(suite: NgxRunnableVestSuite<T>): suite is NgxFocusedVestSuite<T> {
  return typeof suite === 'object' && suite !== null && 'focus' in suite;
}

function readLatestSuiteResult<T>(
  suite: NgxRunnableVestSuite<T>,
  runResult: NgxSuiteRunResult | PromiseLike<NgxSuiteRunResult>
): NgxSuiteRunResult {
  const currentSuite = suite as { get?: () => NgxSuiteRunResult };
  if (typeof currentSuite.get === 'function') {
    return currentSuite.get();
  }

  if (isSuiteRunResult(runResult)) {
    return runResult;
  }

  return createEmptySuiteResult();
}

function isSuiteRunResult(
  value: NgxSuiteRunResult | PromiseLike<NgxSuiteRunResult>
): value is NgxSuiteRunResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'getErrors' in value &&
    'getWarnings' in value
  );
}

function createEmptySuiteResult(): NgxSuiteRunResult {
  return {
    getErrors(field?: string) {
      return field ? [] : {};
    },
    getWarnings(field?: string) {
      return field ? [] : {};
    },
  };
}

function extractFieldMessages(
  messages: string[] | Record<string, string[]>,
  field: string
): string[] | undefined {
  return Array.isArray(messages) ? messages : messages[field];
}
