/**
 * Isolated unit tests for the validation-config-pipeline module.
 *
 * These tests use raw Angular FormGroup/FormControl instances plus mock
 * infrastructure (DestroyRef, ChangeDetectorRef) so they run without a full
 * TestBed component fixture, keeping them fast and focused on the pipeline
 * logic itself.
 */
import { ChangeDetectorRef, DestroyRef } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createValidationConfigPipeline,
  type ValidationConfigPipelineOptions,
} from './validation-config-pipeline';

// ---------------------------------------------------------------------------
// Test infrastructure
// ---------------------------------------------------------------------------

/** Minimal DestroyRef mock (mirrors destroy-scheduler.spec.ts pattern). */
function createMockDestroyRef(): {
  destroyRef: DestroyRef;
  destroy: () => void;
} {
  const listeners: Array<() => void> = [];

  const destroyRef = {
    onDestroy(cb: () => void): () => void {
      listeners.push(cb);
      return () => {
        const idx = listeners.indexOf(cb);
        if (idx >= 0) listeners.splice(idx, 1);
      };
    },
  } as unknown as DestroyRef;

  return {
    destroyRef,
    destroy: () => {
      for (const l of [...listeners]) l();
    },
  };
}

/** Minimal ChangeDetectorRef mock that records detectChanges calls. */
function createMockCdr(): {
  cdr: ChangeDetectorRef;
  detectChangesCount: () => number;
} {
  let count = 0;
  return {
    cdr: {
      detectChanges: () => {
        count++;
      },
      markForCheck: () => {},
    } as unknown as ChangeDetectorRef,
    detectChangesCount: () => count,
  };
}

/** Baseline options with short timings suitable for fast unit tests. */
const BASE_OPTIONS: ValidationConfigPipelineOptions = {
  configDebounceTime: 0,
  idleWaitTimeoutMs: 50,
  dependentExistenceTimeoutMs: 50,
  validationInProgressCooldownMs: 50,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Track how many times updateValueAndValidity is called on a control. */
function trackUpdateCount(control: FormControl): () => number {
  let count = 0;
  const original = control.updateValueAndValidity.bind(control);
  control.updateValueAndValidity = (...args: Parameters<typeof original>) => {
    count++;
    return original(...args);
  };
  return () => count;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createValidationConfigPipeline', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // 1. null / undefined config → EMPTY
  // -------------------------------------------------------------------------
  it('returns EMPTY when config is null', () => {
    const form = new FormGroup({ trigger: new FormControl('') });
    const { destroyRef } = createMockDestroyRef();
    const { cdr } = createMockCdr();

    let emitted = false;
    let completed = false;

    const sub = createValidationConfigPipeline(
      form,
      null,
      BASE_OPTIONS,
      cdr,
      destroyRef
    ).subscribe({
      next: () => {
        emitted = true;
      },
      complete: () => {
        completed = true;
      },
    });

    expect(emitted).toBe(false);
    // EMPTY completes synchronously
    expect(completed).toBe(true);
    sub.unsubscribe();
  });

  it('returns EMPTY when config is undefined', () => {
    const form = new FormGroup({ trigger: new FormControl('') });
    const { destroyRef } = createMockDestroyRef();
    const { cdr } = createMockCdr();

    let completed = false;

    const sub = createValidationConfigPipeline(
      form,
      undefined,
      BASE_OPTIONS,
      cdr,
      destroyRef
    ).subscribe({ complete: () => (completed = true) });

    expect(completed).toBe(true);
    sub.unsubscribe();
  });

  // -------------------------------------------------------------------------
  // 2. Single trigger → dependent revalidates after debounce
  // -------------------------------------------------------------------------
  it('revalidates the dependent control after the trigger value changes', async () => {
    const triggerCtrl = new FormControl('');
    const dependentCtrl = new FormControl('');
    const form = new FormGroup({
      trigger: triggerCtrl,
      dependent: dependentCtrl,
    });

    const { destroyRef } = createMockDestroyRef();
    const { cdr } = createMockCdr();
    const getCount = trackUpdateCount(dependentCtrl);

    const sub = createValidationConfigPipeline(
      form,
      { trigger: ['dependent'] } as Record<string, string[]>,
      { ...BASE_OPTIONS, configDebounceTime: 20 },
      cdr,
      destroyRef
    ).subscribe();

    // Dependent should not be updated before the trigger fires
    expect(getCount()).toBe(0);

    // Change the trigger value
    triggerCtrl.setValue('new-value');

    // Not yet updated (debounce hasn't fired)
    expect(getCount()).toBe(0);

    // Advance past debounce
    await vi.advanceTimersByTimeAsync(20);

    expect(getCount()).toBeGreaterThanOrEqual(1);

    sub.unsubscribe();
  });

  // -------------------------------------------------------------------------
  // 3. PENDING form waits up to idleWaitTimeoutMs then proceeds
  // -------------------------------------------------------------------------
  it('waits up to idleWaitTimeoutMs for PENDING form then revalidates dependent', async () => {
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    const triggerCtrl = new FormControl('');
    const dependentCtrl = new FormControl('');
    const form = new FormGroup(
      { trigger: triggerCtrl, dependent: dependentCtrl },
      {
        asyncValidators: [
          // Never-resolving async validator keeps the form in PENDING state
          () => new Observable(() => {}),
        ],
      }
    );

    // Trigger form validation so it enters PENDING state
    form.updateValueAndValidity();
    expect(form.status).toBe('PENDING');

    const { destroyRef } = createMockDestroyRef();
    const { cdr } = createMockCdr();
    const getCount = trackUpdateCount(dependentCtrl);

    const options: ValidationConfigPipelineOptions = {
      ...BASE_OPTIONS,
      configDebounceTime: 0,
      idleWaitTimeoutMs: 50,
    };

    const sub = createValidationConfigPipeline(
      form,
      { trigger: ['dependent'] } as Record<string, string[]>,
      options,
      cdr,
      destroyRef
    ).subscribe();

    // Change trigger value
    triggerCtrl.setValue('value');

    // After debounce (0ms) form is PENDING → pipeline waits
    await vi.advanceTimersByTimeAsync(0);
    expect(getCount()).toBe(0);

    // Still waiting at 40ms
    await vi.advanceTimersByTimeAsync(40);
    expect(getCount()).toBe(0);

    // After idleWaitTimeoutMs (50ms total) → pipeline proceeds
    await vi.advanceTimersByTimeAsync(10);
    expect(getCount()).toBeGreaterThanOrEqual(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'timed out waiting for form to leave PENDING state'
      )
    );

    sub.unsubscribe();
    consoleWarnSpy.mockRestore();
  });

  // -------------------------------------------------------------------------
  // 4. Absent dependent controls wait up to dependentExistenceTimeoutMs
  // -------------------------------------------------------------------------
  it('waits up to dependentExistenceTimeoutMs then proceeds when dependent is absent', async () => {
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    const triggerCtrl = new FormControl('');
    // Form does NOT contain the dependent control yet
    const form = new FormGroup({ trigger: triggerCtrl });

    const { destroyRef } = createMockDestroyRef();
    const { cdr } = createMockCdr();
    let proceededAfterTimeout = false;

    const options: ValidationConfigPipelineOptions = {
      ...BASE_OPTIONS,
      configDebounceTime: 0,
      dependentExistenceTimeoutMs: 50,
    };

    const sub = createValidationConfigPipeline(
      form,
      { trigger: ['dependent'] } as Record<string, string[]>,
      options,
      cdr,
      destroyRef
    ).subscribe(() => {
      proceededAfterTimeout = true;
    });

    // Change trigger value
    triggerCtrl.setValue('value');

    // Debounce fires immediately (0ms), then pipeline waits for dependent
    await vi.advanceTimersByTimeAsync(0);
    expect(proceededAfterTimeout).toBe(false);

    // Still waiting at 40ms
    await vi.advanceTimersByTimeAsync(40);
    expect(proceededAfterTimeout).toBe(false);

    // After dependentExistenceTimeoutMs → pipeline emits (proceeds without dependent)
    await vi.advanceTimersByTimeAsync(10);
    expect(proceededAfterTimeout).toBe(true);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'timed out waiting for dependent controls: dependent'
      )
    );

    sub.unsubscribe();
    consoleWarnSpy.mockRestore();
  });

  it('revalidates when dependent control appears before the timeout', async () => {
    const triggerCtrl = new FormControl('');
    const dependentCtrl = new FormControl('');
    const form = new FormGroup({ trigger: triggerCtrl });

    const { destroyRef } = createMockDestroyRef();
    const { cdr } = createMockCdr();
    const getCount = trackUpdateCount(dependentCtrl);

    const options: ValidationConfigPipelineOptions = {
      ...BASE_OPTIONS,
      configDebounceTime: 0,
      dependentExistenceTimeoutMs: 100,
    };

    const sub = createValidationConfigPipeline(
      form,
      { trigger: ['dependent'] } as Record<string, string[]>,
      options,
      cdr,
      destroyRef
    ).subscribe();

    // Change trigger value
    triggerCtrl.setValue('value');
    await vi.advanceTimersByTimeAsync(0);

    // Dependent not there yet → pipeline waits
    expect(getCount()).toBe(0);

    // Add the dependent control before the timeout
    (form as FormGroup).addControl('dependent', dependentCtrl);
    // statusChanges emits → pipeline wakes up
    await vi.advanceTimersByTimeAsync(0);

    expect(getCount()).toBeGreaterThanOrEqual(1);

    sub.unsubscribe();
  });

  // NOTE: trigger-control recreation (an `@if`-toggled trigger destroyed and
  // recreated as a new AbstractControl instance) is a documented KNOWN
  // LIMITATION — the pipeline stays bound to the first instance by design
  // (the `take(1)` that prevents a statusChanges feedback loop). See the
  // deferred ADR. No test asserts rebind because the behaviour is
  // intentionally not supported in this release.

  // -------------------------------------------------------------------------
  // 5. Circular config (A → B and B → A) does not loop indefinitely
  // -------------------------------------------------------------------------
  it('does not loop infinitely for a bidirectional config (A→B and B→A)', async () => {
    const ctrlA = new FormControl('');
    const ctrlB = new FormControl('');
    const form = new FormGroup({ fieldA: ctrlA, fieldB: ctrlB });

    const { destroyRef } = createMockDestroyRef();
    const { cdr } = createMockCdr();

    let countA = 0;
    let countB = 0;

    const origA = ctrlA.updateValueAndValidity.bind(ctrlA);
    ctrlA.updateValueAndValidity = (...args: Parameters<typeof origA>) => {
      countA++;
      return origA(...args);
    };

    const origB = ctrlB.updateValueAndValidity.bind(ctrlB);
    ctrlB.updateValueAndValidity = (...args: Parameters<typeof origB>) => {
      countB++;
      return origB(...args);
    };

    const options: ValidationConfigPipelineOptions = {
      ...BASE_OPTIONS,
      configDebounceTime: 0,
      validationInProgressCooldownMs: 50,
    };

    const sub = createValidationConfigPipeline(
      form,
      {
        fieldA: ['fieldB'],
        fieldB: ['fieldA'],
      } as Record<string, string[]>,
      options,
      cdr,
      destroyRef
    ).subscribe();

    // Change fieldA → should trigger fieldB revalidation
    ctrlA.setValue('new');

    // Advance well past all timings
    await vi.advanceTimersByTimeAsync(200);

    // Neither control should have been updated hundreds of times
    expect(countA).toBeLessThan(5);
    expect(countB).toBeLessThan(5);

    sub.unsubscribe();
  });

  // -------------------------------------------------------------------------
  // 6. Loop-prevention cooldown defers (never drops) user changes
  // -------------------------------------------------------------------------
  it('defers a trigger change arriving within the cooldown window and replays it after the cooldown expires', async () => {
    const triggerCtrl = new FormControl('');
    const dependentCtrl = new FormControl('');
    const form = new FormGroup({
      trigger: triggerCtrl,
      dependent: dependentCtrl,
    });

    const { destroyRef } = createMockDestroyRef();
    const { cdr } = createMockCdr();
    const getCount = trackUpdateCount(dependentCtrl);

    const options: ValidationConfigPipelineOptions = {
      ...BASE_OPTIONS,
      configDebounceTime: 0,
      validationInProgressCooldownMs: 50,
    };

    const sub = createValidationConfigPipeline(
      form,
      { trigger: ['dependent'] } as Record<string, string[]>,
      options,
      cdr,
      destroyRef
    ).subscribe();

    // First trigger cycle
    triggerCtrl.setValue('first');
    await vi.advanceTimersByTimeAsync(0);

    const countAfterFirst = getCount();
    expect(countAfterFirst).toBeGreaterThanOrEqual(1);

    // A user-initiated valueChanges emission within the cooldown window is
    // NOT processed immediately (loop prevention still gates it) ...
    triggerCtrl.setValue('second');
    await vi.advanceTimersByTimeAsync(0);
    expect(getCount()).toBe(countAfterFirst); // not processed yet

    // ... but it is deferred, not dropped: once the cooldown expires the
    // pipeline replays it and revalidates the dependent — no further user
    // interaction required. (Advance past the cooldown, then flush the
    // replay's own debounce timer.)
    await vi.advanceTimersByTimeAsync(50);
    await vi.advanceTimersByTimeAsync(10);
    expect(getCount()).toBeGreaterThan(countAfterFirst);

    // A later change (outside any cooldown) is processed directly.
    await vi.advanceTimersByTimeAsync(50);
    const countAfterReplay = getCount();
    triggerCtrl.setValue('third');
    await vi.advanceTimersByTimeAsync(0);
    expect(getCount()).toBeGreaterThan(countAfterReplay);

    sub.unsubscribe();
  });

  it('revalidates the dependent with the final trigger value when the trigger is edited twice within the cooldown window (regression: C-B1)', async () => {
    const triggerCtrl = new FormControl('');
    // Sync validator records the trigger value seen at each dependent
    // revalidation so we can assert latest-wins semantics.
    const seenTriggerValues: unknown[] = [];
    const dependentCtrl = new FormControl('', () => {
      seenTriggerValues.push(triggerCtrl.value);
      return null;
    });
    const form = new FormGroup({
      trigger: triggerCtrl,
      dependent: dependentCtrl,
    });

    const { destroyRef } = createMockDestroyRef();
    const { cdr } = createMockCdr();

    const options: ValidationConfigPipelineOptions = {
      ...BASE_OPTIONS,
      configDebounceTime: 0,
      validationInProgressCooldownMs: 50,
    };

    const sub = createValidationConfigPipeline(
      form,
      { trigger: ['dependent'] } as Record<string, string[]>,
      options,
      cdr,
      destroyRef
    ).subscribe();

    // First edit: processed immediately, dependent sees 'abc'.
    triggerCtrl.setValue('abc');
    await vi.advanceTimersByTimeAsync(0);
    expect(seenTriggerValues.at(-1)).toBe('abc');

    // Second edit 10ms later — well inside the 50ms cooldown window.
    await vi.advanceTimersByTimeAsync(10);
    triggerCtrl.setValue('abcd');
    await vi.advanceTimersByTimeAsync(0);
    // Still the stale verdict at this point (cooldown gates the cycle) ...
    expect(seenTriggerValues.at(-1)).toBe('abc');

    // ... but after the cooldown expires the deferred change replays and the
    // dependent revalidates against the FINAL trigger value.
    await vi.advanceTimersByTimeAsync(100);
    expect(seenTriggerValues.at(-1)).toBe('abcd');

    sub.unsubscribe();
  });

  it('replays a cycle whose shared dependent was skipped because another trigger still held it in cooldown', async () => {
    // Shared-dependent config: {'startDate': ['range'], 'endDate': ['range']}
    const startCtrl = new FormControl('');
    const endCtrl = new FormControl('');
    const seenEndValues: unknown[] = [];
    const rangeCtrl = new FormControl('', () => {
      seenEndValues.push(endCtrl.value);
      return null;
    });
    const form = new FormGroup({
      startDate: startCtrl,
      endDate: endCtrl,
      range: rangeCtrl,
    });

    const { destroyRef } = createMockDestroyRef();
    const { cdr } = createMockCdr();

    const options: ValidationConfigPipelineOptions = {
      ...BASE_OPTIONS,
      configDebounceTime: 0,
      validationInProgressCooldownMs: 50,
    };

    const sub = createValidationConfigPipeline(
      form,
      {
        startDate: ['range'],
        endDate: ['range'],
      } as Record<string, string[]>,
      options,
      cdr,
      destroyRef
    ).subscribe();

    // startDate cycle runs and puts `range` into cooldown.
    startCtrl.setValue('2026-01-01');
    await vi.advanceTimersByTimeAsync(0);
    const seenCountAfterStart = seenEndValues.length;
    expect(seenCountAfterStart).toBeGreaterThanOrEqual(1);

    // endDate is edited within the cooldown: its cycle runs but `range` is
    // still marked, so it is skipped in this cycle...
    await vi.advanceTimersByTimeAsync(10);
    endCtrl.setValue('2026-02-01');
    await vi.advanceTimersByTimeAsync(0);

    // ...and after the cooldown clears, the skipped cycle replays so `range`
    // is revalidated against the latest endDate value.
    await vi.advanceTimersByTimeAsync(200);
    expect(seenEndValues.at(-1)).toBe('2026-02-01');

    sub.unsubscribe();
  });

  it('does not replay pipeline-induced emissions after the cooldown (no deferred self-triggering)', async () => {
    const triggerCtrl = new FormControl('');
    const dependentCtrl = new FormControl('');
    const form = new FormGroup({
      trigger: triggerCtrl,
      dependent: dependentCtrl,
    });

    const { destroyRef } = createMockDestroyRef();
    const { cdr } = createMockCdr();
    const getDependentCount = trackUpdateCount(dependentCtrl);
    const getTriggerCount = trackUpdateCount(triggerCtrl);

    const options: ValidationConfigPipelineOptions = {
      ...BASE_OPTIONS,
      configDebounceTime: 0,
      validationInProgressCooldownMs: 50,
    };

    // Bidirectional config: the pipeline's own update of `dependent` emits a
    // valueChanges on `dependent`, which must be dropped outright — deferring
    // it would resurrect the infinite loop with a period of one cooldown.
    const sub = createValidationConfigPipeline(
      form,
      {
        trigger: ['dependent'],
        dependent: ['trigger'],
      } as Record<string, string[]>,
      options,
      cdr,
      destroyRef
    ).subscribe();

    triggerCtrl.setValue('new');
    // Advance across several cooldown windows — with a deferred self-induced
    // emission this would keep ping-ponging forever.
    await vi.advanceTimersByTimeAsync(500);

    expect(getTriggerCount()).toBeLessThan(5);
    expect(getDependentCount()).toBeLessThan(5);

    sub.unsubscribe();
  });

  // -------------------------------------------------------------------------
  // 7. Teardown: unsubscribing stops all processing
  // -------------------------------------------------------------------------
  it('stops revalidating after the subscription is torn down', async () => {
    const triggerCtrl = new FormControl('');
    const dependentCtrl = new FormControl('');
    const form = new FormGroup({
      trigger: triggerCtrl,
      dependent: dependentCtrl,
    });

    const { destroyRef } = createMockDestroyRef();
    const { cdr } = createMockCdr();
    const getCount = trackUpdateCount(dependentCtrl);

    const sub = createValidationConfigPipeline(
      form,
      { trigger: ['dependent'] } as Record<string, string[]>,
      { ...BASE_OPTIONS, configDebounceTime: 0 },
      cdr,
      destroyRef
    ).subscribe();

    // Trigger once — dependent updates
    triggerCtrl.setValue('a');
    await vi.advanceTimersByTimeAsync(0);
    const countBeforeUnsubscribe = getCount();
    expect(countBeforeUnsubscribe).toBeGreaterThanOrEqual(1);

    // Tear down
    sub.unsubscribe();
    await vi.advanceTimersByTimeAsync(100);

    // After teardown a further value change should NOT update dependent
    triggerCtrl.setValue('b');
    await vi.advanceTimersByTimeAsync(0);

    expect(getCount()).toBe(countBeforeUnsubscribe);
  });

  // -------------------------------------------------------------------------
  // 8. Empty config map → EMPTY
  // -------------------------------------------------------------------------
  it('returns EMPTY when config has no entries', () => {
    const form = new FormGroup({ trigger: new FormControl('') });
    const { destroyRef } = createMockDestroyRef();
    const { cdr } = createMockCdr();

    let emitted = false;
    const sub = createValidationConfigPipeline(
      form,
      {} as Record<string, string[]>,
      BASE_OPTIONS,
      cdr,
      destroyRef
    ).subscribe(() => {
      emitted = true;
    });

    // No trigger fired, no emission expected
    expect(emitted).toBe(false);
    sub.unsubscribe();
  });
});
