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
  Subject,
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
   * have been revalidated.  This window gives async validators time to
   * complete while gating pipeline re-entry. User-initiated changes to a
   * marked field are *deferred* and replayed once the window expires
   * (latest-wins), so no user input is ever silently dropped.
   */
  validationInProgressCooldownMs: number;
};

/**
 * Creates a teardownable `Observable<void>` that revalidates dependent fields
 * whenever their configured trigger field emits a value change.
 *
 * **Encapsulation guarantee:** the loop-prevention state (in-progress `Set`,
 * synchronous update flag, and cooldown notifier) is created fresh inside this
 * function on every call and is never reachable from outside.
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

  // Fresh state per pipeline instance so that config changes (driven by the
  // outer switchMap in FormDirective) don't share in-progress state across
  // different pipeline instances.
  const loopPrevention: LoopPreventionState = {
    validationInProgress: new Set<string>(),
    applyingUpdates: false,
    cooldownCleared$: new Subject<void>(),
  };

  const streams = Object.entries(config as Record<string, string[]>).map(
    ([triggerField, dependents]) =>
      createTriggerStream(
        form,
        triggerField,
        dependents ?? [],
        loopPrevention,
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

/**
 * Shared per-pipeline loop-prevention state.
 *
 * - `validationInProgress`: fields whose revalidation cycle is still inside
 *   its cooldown window. User-initiated changes to such fields are *deferred*
 *   (replayed after the cooldown), never dropped.
 * - `applyingUpdates`: `true` only while the pipeline is synchronously calling
 *   `updateValueAndValidity` on dependent controls. Emissions observed during
 *   that window are self-induced and are dropped outright — this is what
 *   actually breaks bidirectional feedback loops.
 * - `cooldownCleared$`: notifier fired whenever a cooldown window expires so
 *   trigger streams with a deferred change can replay it.
 */
type LoopPreventionState = {
  validationInProgress: Set<string>;
  applyingUpdates: boolean;
  cooldownCleared$: Subject<void>;
};

function createTriggerStream(
  form: FormGroup,
  triggerField: string,
  dependents: string[],
  loopPrevention: LoopPreventionState,
  options: ValidationConfigPipelineOptions,
  cdr: ChangeDetectorRef,
  destroyRef: DestroyRef
): Observable<void> {
  // Wait for the trigger control to exist, then stop listening.
  // take(1) is CRITICAL: without it the pipeline would re-subscribe on every
  // statusChanges emission, creating a feedback loop where validation triggers
  // re-trigger the pipeline.
  //
  // KNOWN LIMITATION (deferred — see docs/adr): if an `@if`-toggled trigger
  // control is destroyed and recreated as a brand-new AbstractControl
  // instance, the pipeline stays bound to the first instance and the
  // recreated trigger's changes no longer revalidate its dependents. A
  // statusChanges-identity rebind was prototyped but could not be made
  // reliable without risking the feedback-loop regression this `take(1)`
  // prevents, so the safe known-good behaviour is retained.
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

      // Set when a user-initiated trigger change arrives while this field is
      // still inside a cooldown window. The change is deferred (latest-wins)
      // and replayed once the cooldown clears — never silently dropped, which
      // previously left dependents with a stale verdict.
      let hasDeferredChange = false;

      const userChanges$ = control.valueChanges.pipe(
        filter(() => {
          // CRITICAL: emissions produced by the pipeline's own synchronous
          // updateValueAndValidity calls are self-induced — drop them outright
          // (this is what prevents bidirectional configs from looping).
          if (loopPrevention.applyingUpdates) {
            return false;
          }
          // A user-initiated change during the cooldown window: defer it so
          // dependents are revalidated with the latest value once the
          // cooldown expires.
          if (loopPrevention.validationInProgress.has(triggerField)) {
            hasDeferredChange = true;
            return false;
          }
          // A directly-processed change supersedes any pending deferral
          // (dependents will read the latest trigger value anyway).
          hasDeferredChange = false;
          return true;
        })
      );

      const deferredReplays$ = loopPrevention.cooldownCleared$.pipe(
        filter(() => {
          if (
            !hasDeferredChange ||
            loopPrevention.validationInProgress.has(triggerField)
          ) {
            // Nothing deferred, or another cycle still holds this field in
            // cooldown — the next cooldownCleared$ notification will retry.
            return false;
          }
          hasDeferredChange = false;
          return true;
        }),
        map(() => control.value)
      );

      return rxMerge(userChanges$, deferredReplays$).pipe(
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
          const cycle = updateDependentFields(
            form,
            triggerField,
            dependents,
            loopPrevention,
            cdr,
            options.validationInProgressCooldownMs,
            destroyRef
          );
          cancelCooldown = cycle.cancelCooldown;
          if (cycle.skippedDependents) {
            // A shared dependent was still cooling down from another trigger's
            // cycle and could not be revalidated — defer this cycle so it
            // replays (with the latest values) once the cooldown clears.
            hasDeferredChange = true;
          }
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
 * **Loop prevention:** `loopPrevention.applyingUpdates` is `true` for the
 * synchronous duration of the `updateValueAndValidity` calls, so the
 * self-induced `valueChanges` emissions they produce are dropped by every
 * trigger stream. Every field involved in this cycle (trigger + dependents)
 * is additionally added to `validationInProgress` before any
 * `updateValueAndValidity` call; while marked, *user-initiated* changes to
 * those fields are deferred (not dropped) and replayed after the cooldown.
 *
 * **Touch state:** deliberately NOT propagated to dependent fields so they do
 * not show errors until the user directly interacts with them.
 *
 * @returns `cancelCooldown` for wiring into observable teardown, plus
 *          `skippedDependents` indicating that at least one dependent was
 *          still cooling down and could not be revalidated in this cycle.
 */
function updateDependentFields(
  form: FormGroup,
  triggerField: string,
  dependents: string[],
  loopPrevention: LoopPreventionState,
  cdr: ChangeDetectorRef,
  cooldownMs: number,
  destroyRef: DestroyRef
): { cancelCooldown: () => void; skippedDependents: boolean } {
  const { validationInProgress } = loopPrevention;

  // Mark the trigger field in-progress first so that user edits arriving
  // mid-cooldown are classified as deferrable in createTriggerStream.
  validationInProgress.add(triggerField);

  let skippedDependents = false;

  for (const depField of dependents) {
    const dependentControl = form.get(depField);
    if (!dependentControl) {
      continue;
    }

    // Only revalidate if the dependent is not already being processed.
    if (validationInProgress.has(depField)) {
      skippedDependents = true;
      continue;
    }

    // Mark BEFORE updateValueAndValidity so follow-up user edits within the
    // cooldown window are deferred rather than processed immediately.
    validationInProgress.add(depField);

    // Flag the synchronous update window so the valueChanges emission this
    // call produces on the dependent control is recognized as self-induced
    // and dropped (not deferred) by the dependent's own trigger stream.
    loopPrevention.applyingUpdates = true;
    try {
      // emitEvent:true is required for async validators to run.
      dependentControl.updateValueAndValidity({
        onlySelf: true,
        emitEvent: true,
      });

      // Force immediate change detection so OnPush hosts reflect the updated
      // ng-valid/ng-invalid classes without waiting for the next CD cycle.
      cdr.detectChanges();
    } finally {
      loopPrevention.applyingUpdates = false;
    }
  }

  // Keep the in-progress markers alive for `cooldownMs` so that async
  // validators have time to complete and any resulting valueChanges emissions
  // are still gated.  The cancel function is returned so callers can wire it
  // into observable teardown (e.g. finalize) to avoid timer leaks on unsub.
  const cancelCooldown = scheduleTimeout(
    () => {
      validationInProgress.delete(triggerField);
      for (const depField of dependents) {
        validationInProgress.delete(depField);
      }
      // Wake up any trigger stream that deferred a user change while its
      // field was cooling down (latest-wins replay).
      loopPrevention.cooldownCleared$.next();
    },
    cooldownMs,
    destroyRef
  );

  return { cancelCooldown, skippedDependents };
}
