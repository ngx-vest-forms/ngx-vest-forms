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
import { distinctUntilChanged, type Observable, switchMap, tap } from 'rxjs';
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
 * Controls currently inside a status-only `updateValueAndValidity({ emitEvent: false })`
 * pass from {@link revalidateControlTree}. Used by {@link announceOnSilentRevalidation}
 * so async validators started during that pass still announce their settled status.
 */
const silentRevalidating = new Set<AbstractControl>();

/**
 * @internal
 * Wraps an async validator observable so that when it was started by
 * {@link revalidateControlTree} (with `emitEvent: false` to suppress
 * `valueChanges`), an asynchronous completion still announces `statusChanges`
 * and `StatusChangeEvent` via `control.setErrors(control.errors)`.
 */
export function announceOnSilentRevalidation<V>(
  control: AbstractControl,
  result$: Observable<V>,
  destroyRef: DestroyRef
): Observable<V> {
  if (!silentRevalidating.has(control)) {
    return result$;
  }
  return result$.pipe(
    tap(() => {
      // Synchronous emissions run while `control` is still inside
      // `revalidateControlWithoutValueEvent`, which announces status directly
      // once `updateValueAndValidity` returns. Only async completions need a
      // microtask announcement after Angular stores the errors silently.
      if (!silentRevalidating.has(control)) {
        scheduleMicrotask(() => {
          if (!control.pending) {
            control.setErrors(control.errors);
          }
        }, destroyRef);
      }
    })
  );
}

/**
 * @internal
 * Re-runs validation for every control in the subtree, deepest first, then
 * updates `control` itself (bubbling up to any ancestors of `control`),
 * announcing status changes without emitting spurious `valueChanges` events.
 *
 * Angular's `updateValueAndValidity()` on a container only re-runs the
 * container's own validators and recalculates ancestors — it never descends
 * into children — and `emitEvent: true` emits `valueChanges` even when no
 * value changed (which `validationConfig` treats as a user edit). Running each
 * control with `emitEvent: false` and then announcing status via
 * `markAsPending`/`setErrors` keeps `validationConfig` quiet while keeping
 * `statusChanges`, `errorsChange`, and wrappers in sync.
 */
export function revalidateControlTree(control: AbstractControl): void {
  revalidateDescendants(control);
  revalidateControlWithoutValueEvent(control, false);
}

function revalidateDescendants(control: AbstractControl): void {
  if (control instanceof FormGroup) {
    for (const child of Object.values(control.controls)) {
      revalidateDescendants(child);
      revalidateControlWithoutValueEvent(child, true);
    }
  } else if (control instanceof FormArray) {
    for (const child of control.controls) {
      revalidateDescendants(child);
      revalidateControlWithoutValueEvent(child, true);
    }
  }
}

function revalidateControlWithoutValueEvent(
  control: AbstractControl,
  onlySelf: boolean
): void {
  if (control.disabled) {
    return;
  }
  silentRevalidating.add(control);
  try {
    control.updateValueAndValidity({ onlySelf, emitEvent: false });
  } finally {
    silentRevalidating.delete(control);
  }
  if (control.pending) {
    control.markAsPending({ onlySelf, emitEvent: true });
  } else {
    control.setErrors(control.errors, { emitEvent: true });
  }
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
