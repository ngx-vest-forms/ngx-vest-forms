import { ChangeDetectorRef, DestroyRef } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import {
  debounceTime,
  EMPTY,
  filter,
  finalize,
  map,
  Observable,
  of,
  race,
  merge as rxMerge,
  startWith,
  switchMap,
  take,
  tap,
  timer,
} from 'rxjs';
import { scheduleTimeout } from './destroy-scheduler';
import type { ValidationConfigMap } from './field-path-types';

/**
 * Options controlling the timing behaviour of the validation-config pipeline.
 *
 * All durations are in milliseconds.
 */
export type ValidationConfigPipelineOptions = {
  /** Debounce applied to trigger-field value changes before the pipeline fires. */
  configDebounceTime: number;

  /**
   * Maximum time to wait for the form to leave `PENDING` state before
   * proceeding with dependent-field revalidation anyway.
   */
  idleWaitTimeoutMs: number;

  /**
   * Maximum time to wait for all dependent controls to appear in the form
   * (e.g. conditionally rendered via `@if`) before proceeding without them.
   */
  dependentExistenceTimeoutMs: number;

  /**
   * How long to keep a field marked as "in-progress" after its dependents
   * have been revalidated.  This window prevents bidirectional validation
   * configs from triggering infinite loops.
   */
  validationInProgressCooldownMs: number;
};

/**
 * Creates a teardownable `Observable<void>` that revalidates dependent fields
 * whenever their configured trigger field emits a value change.
 *
 * **Encapsulation guarantee:** the `validationInProgress` loop-prevention `Set`
 * is created fresh inside this function on every call and is never reachable
 * from outside.
 *
 * When `config` is `null` or `undefined` the returned observable is `EMPTY`.
 *
 * @param form      The root `FormGroup` that owns all trigger and dependent controls.
 * @param config    Map of trigger-field path → dependent field paths.
 *                  `null`/`undefined` returns `EMPTY`.
 * @param options   Named timing knobs (see {@link ValidationConfigPipelineOptions}).
 * @param cdr       `ChangeDetectorRef` used to force immediate re-renders on
 *                  `OnPush` hosts after dependent controls are updated.
 * @param destroyRef  Used to auto-cancel the in-progress cooldown timer when the
 *                  host directive is destroyed.
 */
export function createValidationConfigPipeline<
  T extends Record<string, unknown>,
>(
  form: FormGroup,
  config: ValidationConfigMap<T> | null | undefined,
  options: ValidationConfigPipelineOptions,
  cdr: ChangeDetectorRef,
  destroyRef: DestroyRef
): Observable<void> {
  if (!config) {
    return EMPTY;
  }

  // Fresh Set per pipeline instance so that config changes (driven by the
  // outer switchMap in FormDirective) don't share in-progress state across
  // different pipeline instances.
  const validationInProgress = new Set<string>();

  const streams = Object.entries(config as Record<string, string[]>).map(
    ([triggerField, dependents]) =>
      createTriggerStream(
        form,
        triggerField,
        dependents ?? [],
        validationInProgress,
        options,
        cdr,
        destroyRef
      )
  );

  return streams.length > 0 ? (rxMerge(...streams) as Observable<void>) : EMPTY;
}

// ---------------------------------------------------------------------------
// Internal helpers (not exported — internal module detail)
// ---------------------------------------------------------------------------

function createTriggerStream(
  form: FormGroup,
  triggerField: string,
  dependents: string[],
  validationInProgress: Set<string>,
  options: ValidationConfigPipelineOptions,
  cdr: ChangeDetectorRef,
  destroyRef: DestroyRef
): Observable<void> {
  // Wait for the trigger control to exist, then stop listening.
  // take(1) is CRITICAL: without it the pipeline would re-subscribe on every
  // statusChanges emission, creating a feedback loop where validation triggers
  // re-trigger the pipeline.
  const triggerControl$ = form.statusChanges.pipe(
    startWith(form.status),
    map(() => form.get(triggerField)),
    filter((c): c is AbstractControl => c !== null),
    take(1)
  );

  return triggerControl$.pipe(
    switchMap((control) => {
      // Holds the cancel function of the most-recently-scheduled cooldown timer.
      // Cancelled when the inner observable tears down (config switch or unsubscribe)
      // so pending timers do not fire after the pipeline is gone.
      let cancelCooldown: (() => void) | undefined;

      return control.valueChanges.pipe(
        // CRITICAL: block emissions while this trigger field is being processed
        // by another field's validation config (prevents bidirectional loops).
        filter(() => !validationInProgress.has(triggerField)),
        debounceTime(options.configDebounceTime),
        switchMap(() =>
          waitForFormIdle(form, control, options.idleWaitTimeoutMs)
        ),
        switchMap((ctrl) =>
          waitForDependentControls(
            form,
            dependents,
            ctrl,
            options.dependentExistenceTimeoutMs
          )
        ),
        tap(() => {
          // Cancel the previous cooldown before scheduling a new one so back-to-back
          // trigger firings don't accumulate stale cleanup timers.
          cancelCooldown?.();
          cancelCooldown = updateDependentFields(
            form,
            triggerField,
            dependents,
            validationInProgress,
            cdr,
            options.validationInProgressCooldownMs,
            destroyRef
          );
        }),
        finalize(() => cancelCooldown?.()),
        map(() => undefined)
      );
    })
  ) as Observable<void>;
}

/**
 * Waits for the form to leave `PENDING` state before proceeding.
 *
 * If the form is still `PENDING` after `timeoutMs` milliseconds (e.g. slow
 * async validators), proceeds anyway to avoid stalling the pipeline.
 */
function waitForFormIdle(
  form: FormGroup,
  control: AbstractControl,
  timeoutMs: number
): Observable<AbstractControl> {
  if (form.status !== 'PENDING') {
    return of(control);
  }

  const idle$ = form.statusChanges.pipe(
    filter((s) => s !== 'PENDING'),
    take(1)
  );

  const timeout$ = timer(timeoutMs).pipe(
    tap(() => {
      if (typeof ngDevMode !== 'undefined' && ngDevMode) {
        console.warn(
          '[ngx-vest-forms] validationConfig: timed out waiting for form to leave PENDING state. Continuing dependent validation to avoid stalling.'
        );
      }
    })
  );

  return race(idle$, timeout$).pipe(map(() => control));
}

/**
 * Waits for all dependent controls to be registered in the form.
 *
 * Handles `@if` scenarios where controls are conditionally rendered.  If any
 * dependent is still absent after `timeoutMs` milliseconds, proceeds without it.
 */
function waitForDependentControls(
  form: FormGroup,
  dependents: string[],
  control: AbstractControl,
  timeoutMs: number
): Observable<AbstractControl> {
  const allExist = dependents.every((f) => !!form.get(f));

  if (allExist) {
    return of(control);
  }

  const ready$ = form.statusChanges.pipe(
    startWith(form.status),
    filter(() => dependents.every((f) => !!form.get(f))),
    take(1),
    map(() => control)
  );

  const timeout$ = timer(timeoutMs).pipe(
    tap(() => {
      if (typeof ngDevMode !== 'undefined' && ngDevMode) {
        const missing = dependents.filter((f) => !form.get(f));
        console.warn(
          `[ngx-vest-forms] validationConfig: timed out waiting for dependent controls: ${missing.join(', ')}. Continuing without them.`
        );
      }
    }),
    map(() => control)
  );

  return race(ready$, timeout$).pipe(take(1));
}

/**
 * Calls `updateValueAndValidity` on each dependent control that is not already
 * being processed, then schedules the cooldown timer that clears the
 * in-progress markers.
 *
 * **Loop prevention:** every field involved in this cycle (trigger + dependents)
 * is added to `validationInProgress` before any `updateValueAndValidity` call.
 * The markers are removed after `cooldownMs` so that user-initiated changes can
 * pass the filter again.
 *
 * **Touch state:** deliberately NOT propagated to dependent fields so they do
 * not show errors until the user directly interacts with them.
 */
function updateDependentFields(
  form: FormGroup,
  triggerField: string,
  dependents: string[],
  validationInProgress: Set<string>,
  cdr: ChangeDetectorRef,
  cooldownMs: number,
  destroyRef: DestroyRef
): () => void {
  // Mark the trigger field in-progress first so that bidirectional configs
  // cannot create a loop via the filter in createTriggerStream.
  validationInProgress.add(triggerField);

  for (const depField of dependents) {
    const dependentControl = form.get(depField);
    if (!dependentControl) {
      continue;
    }

    // Only revalidate if the dependent is not already being processed.
    if (!validationInProgress.has(depField)) {
      // Mark BEFORE updateValueAndValidity so that any synchronous valueChanges
      // emission from that call is already gated by the in-progress check.
      validationInProgress.add(depField);

      // emitEvent:true is required for async validators to run.
      // The validationInProgress gate prevents the resulting statusChanges /
      // valueChanges emission from re-entering the pipeline for this field.
      dependentControl.updateValueAndValidity({
        onlySelf: true,
        emitEvent: true,
      });

      // Force immediate change detection so OnPush hosts reflect the updated
      // ng-valid/ng-invalid classes without waiting for the next CD cycle.
      cdr.detectChanges();
    }
  }

  // Keep the in-progress markers alive for `cooldownMs` so that async
  // validators have time to complete and any resulting valueChanges emissions
  // are still gated.  The cancel function is returned so callers can wire it
  // into observable teardown (e.g. finalize) to avoid timer leaks on unsub.
  return scheduleTimeout(
    () => {
      validationInProgress.delete(triggerField);
      for (const depField of dependents) {
        validationInProgress.delete(depField);
      }
    },
    cooldownMs,
    destroyRef
  );
}
