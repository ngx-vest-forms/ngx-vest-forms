import {
  type ChangeDetectorRef,
  type DestroyRef,
  effect,
  type ErrorHandler,
  type Signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { type AbstractControl, FormArray, FormGroup } from '@angular/forms';
import { distinctUntilChanged, switchMap } from 'rxjs';
import { scheduleMicrotask } from '../utils/destroy-scheduler';
import { fastDeepEqual } from '../utils/equality';
import {
  createValidationConfigPipeline,
  type ValidationConfigPipelineOptions,
} from '../utils/validation-config-pipeline';
import type { NgxValidationConfig } from './form-directive.types';

/**
 * Timing options passed to the validation-config pipeline.
 * These are the concrete values for the named knobs defined in
 * {@link ValidationConfigPipelineOptions}.
 */
const PIPELINE_OPTIONS = {
  idleWaitTimeoutMs: 2000,
  dependentExistenceTimeoutMs: 2000,
  validationInProgressCooldownMs: 500,
} as const satisfies Omit<
  ValidationConfigPipelineOptions,
  'configDebounceTime'
>;

/**
 * @internal
 * Re-runs validation for every control in the form tree, depth-first.
 *
 * Angular's `updateValueAndValidity()` on a container only re-runs the
 * container's own validators and recalculates ancestors — it never descends
 * into children. When the Vest suite changes, every field-level async
 * validator must re-run, so each control is updated individually
 * (`onlySelf: true` avoids redundant ancestor recalculation per child; the
 * container's own update afterwards aggregates the fresh child statuses).
 */
function revalidateControlTree(control: AbstractControl): void {
  if (control instanceof FormGroup) {
    for (const child of Object.values(control.controls)) {
      revalidateControlTree(child);
    }
  } else if (control instanceof FormArray) {
    for (const child of control.controls) {
      revalidateControlTree(child);
    }
  }
  control.updateValueAndValidity({ onlySelf: true, emitEvent: true });
}

/**
 * @internal
 * Re-run validation on all registered controls when the `suite` input
 * reference changes — including a lazily-supplied suite (`null` → suite,
 * e.g. a lazy import or per-locale suite arriving asynchronously) and
 * runtime suite swaps (wizard steps, mode switches).
 *
 * Without this, fields validated while the suite was absent (or against
 * the previous suite) keep their stale verdict until the user edits them:
 * `createAsyncValidator` reads `suite()` per validation run, but nothing
 * re-triggers those runs. A root `updateValueAndValidity()` alone is not
 * enough because Angular does not descend into child controls, so every
 * control in the tree is updated individually (mirroring what
 * `ValidateRootFormDirective` already does for ROOT_FORM).
 *
 * Creates an effect, so it must be called in an injection context.
 */
export function revalidateOnSuiteChange<S>(
  suite: Signal<S | null>,
  form: FormGroup,
  destroyRef: DestroyRef
): void {
  // `undefined` sentinel = effect has not run yet (the input itself is
  // `NgxVestSuite | null`, never `undefined`).
  let previousSuite: S | null | undefined;
  effect(() => {
    const current = suite();
    if (previousSuite === undefined) {
      // Initial effect run: field validators already see the current
      // suite when they register, nothing to re-run.
      previousSuite = current;
      return;
    }
    if (current === previousSuite) {
      return;
    }
    previousSuite = current;
    untracked(() => {
      // Defer to the next microtask so Angular has finished wiring up
      // controls/groups (ngModel/ngModelGroup) for the current render pass.
      scheduleMicrotask(() => revalidateControlTree(form), destroyRef);
    });
  });
}

/** What {@link connectValidationConfig} needs from `FormDirective`. */
type ValidationConfigContext = {
  configDebounceTime: number;
  cdr: ChangeDetectorRef;
  destroyRef: DestroyRef;
  errorHandler: ErrorHandler;
};

/**
 * @internal
 * Runs the validation-config pipeline for the current `validationConfig`
 * input until the directive is destroyed.
 *
 * Switching on every config change automatically tears down the previous
 * pipeline instance (and its fresh validationInProgress Set) before creating
 * the new one. A new config object with the same entries (e.g. from a
 * `computed` that rebuilds it) keeps the running pipeline.
 *
 * Uses `toObservable`, so it must be called in an injection context.
 */
export function connectValidationConfig<T extends Record<string, unknown>>(
  form: FormGroup,
  validationConfig: Signal<NgxValidationConfig<T>>,
  context: ValidationConfigContext
): void {
  toObservable(validationConfig)
    .pipe(
      distinctUntilChanged((a, b) => fastDeepEqual(a, b)),
      switchMap((config) =>
        createValidationConfigPipeline(
          form,
          config,
          {
            configDebounceTime: context.configDebounceTime,
            ...PIPELINE_OPTIONS,
          },
          context.cdr,
          context.destroyRef,
          context.errorHandler
        )
      ),
      takeUntilDestroyed(context.destroyRef)
    )
    .subscribe();
}
