import { DestroyRef } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import type { NgxSuiteRunResult, NgxVestSuite } from './validation-suite';
import {
  extractFieldErrors,
  runFieldValidation,
  type NgxSuiteRunHooks,
  type RunnableVestSuite,
} from './vest-runner';

// Compile-time check that `NgxVestSuite` is assignable to `RunnableVestSuite`.
// No runtime assertion is needed: if the assignment fails type-checking, the
// build breaks. Kept at module scope so the check runs once per file.
const _assertAssignable: (
  suite: NgxVestSuite<{ username: string }>
) => RunnableVestSuite<{ username: string }> = (suite) => suite;
void _assertAssignable;

function createMockDestroyRef(): {
  destroyRef: DestroyRef;
  destroy: () => void;
} {
  const listeners: Array<() => void> = [];

  const destroyRef = {
    onDestroy(cb: () => void): () => void {
      listeners.push(cb);
      return () => {
        const index = listeners.indexOf(cb);
        if (index >= 0) {
          listeners.splice(index, 1);
        }
      };
    },
  } as unknown as DestroyRef;

  return {
    destroyRef,
    destroy: () => {
      for (const listener of [...listeners]) {
        listener();
      }
    },
  };
}

function createSuiteResult(
  errors: Record<string, string[]> = {},
  warnings: Record<string, string[]> = {}
): NgxSuiteRunResult {
  return {
    getErrors: ((field?: string) =>
      field !== undefined ? errors[field] ?? [] : errors) as NgxSuiteRunResult['getErrors'],
    getWarnings: ((field?: string) =>
      field !== undefined ? warnings[field] ?? [] : warnings) as NgxSuiteRunResult['getWarnings'],
  } as NgxSuiteRunResult;
}

type TestModel = { username: string };

function createSuiteMock(overrides: {
  syncResult?: NgxSuiteRunResult;
  asyncResult?: PromiseLike<NgxSuiteRunResult>;
  latestResult?: NgxSuiteRunResult;
  onRun?: (hooks?: NgxSuiteRunHooks) => void;
}): RunnableVestSuite<TestModel> & {
  run: ReturnType<typeof vi.fn>;
  only: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
} {
  const returnValue = overrides.asyncResult ?? overrides.syncResult;
  const run = vi.fn(
    (_model: TestModel, _field?: unknown, hooks?: NgxSuiteRunHooks) => {
    overrides.onRun?.(hooks);
    return returnValue as NgxSuiteRunResult;
    }
  );
  const only = vi.fn(() => ({ run }));
  const get = vi.fn(
    () => overrides.latestResult ?? overrides.syncResult ?? createSuiteResult()
  );
  return { run, only, get } as unknown as RunnableVestSuite<TestModel> & {
    run: ReturnType<typeof vi.fn>;
    only: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
  };
}

async function flushMicrotasks(): Promise<void> {
  // One macrotask flush so `timer(0)` fires, plus a microtask flush for the
  // subsequent `from(...)`/`map(...)` operators in the runner.
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  await Promise.resolve();
}

describe('vest-runner', () => {
  // Most tests use real timers because `timer(0)` defers the suite run by one task
  // and the assertions follow microtask flushes. The single test that asserts
  // debounce timing opts into fake timers locally.

  it('emits once and completes for a synchronous suite result', async () => {
    const { destroyRef } = createMockDestroyRef();
    const result = createSuiteResult({ username: ['Required'] });
    const suite = createSuiteMock({ syncResult: result });

    const values: NgxSuiteRunResult[] = [];
    const complete = vi.fn();

    runFieldValidation(
      suite,
      { only: 'username' },
      { username: '' },
      { debounceTime: 0 },
      destroyRef
    ).subscribe({
      next: (value) => values.push(value),
      complete,
    });

    await flushMicrotasks();

    expect(suite.only).toHaveBeenCalledWith('username');
    expect(suite.run).toHaveBeenCalledWith(
      { username: '' },
      undefined,
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    );
    expect(values).toEqual([result]);
    expect(complete).toHaveBeenCalledOnce();
  });

  it('emits after a thenable suite result resolves', async () => {
    const { destroyRef } = createMockDestroyRef();
    const final = createSuiteResult({ username: ['Taken'] });

    let resolvePending!: (value: unknown) => void;
    const pending = new Promise<unknown>((resolve) => {
      resolvePending = resolve;
    });
    const suite = createSuiteMock({
      asyncResult: pending as unknown as PromiseLike<NgxSuiteRunResult>,
      latestResult: final,
    });

    const values: NgxSuiteRunResult[] = [];

    runFieldValidation(
      suite,
      {},
      { username: 'ada' },
      { debounceTime: 0 },
      destroyRef
    ).subscribe((value) => values.push(value));

    await flushMicrotasks();
    expect(values).toEqual([]);

    resolvePending(undefined);
    await flushMicrotasks();

    expect(suite.run).toHaveBeenCalledOnce();
    expect(suite.get).toHaveBeenCalled();
    expect(values).toEqual([final]);
  });

  it('emits the latest suite state when the thenable rejects', async () => {
    const { destroyRef } = createMockDestroyRef();
    const latestResult = createSuiteResult({
      username: ['Recovered latest state'],
    });
    const suite = createSuiteMock({
      asyncResult: Promise.reject(
        new Error('boom')
      ) as unknown as PromiseLike<NgxSuiteRunResult>,
      latestResult,
    });

    const values: NgxSuiteRunResult[] = [];

    runFieldValidation(
      suite,
      {},
      { username: 'ada' },
      { debounceTime: 0 },
      destroyRef
    ).subscribe((value) => values.push(value));

    await flushMicrotasks();

    expect(suite.get).toHaveBeenCalled();
    expect(values).toEqual([latestResult]);
  });

  it('stops emission when the upstream subscription is torn down', async () => {
    const { destroyRef } = createMockDestroyRef();

    let resolvePending!: (value: unknown) => void;
    const pending = new Promise<unknown>((resolve) => {
      resolvePending = resolve;
    });
    const suite = createSuiteMock({
      asyncResult: pending as unknown as PromiseLike<NgxSuiteRunResult>,
      latestResult: createSuiteResult({ username: ['Late result'] }),
    });

    const next = vi.fn();
    const complete = vi.fn();

    const subscription = runFieldValidation(
      suite,
      {},
      { username: 'ada' },
      { debounceTime: 0 },
      destroyRef
    ).subscribe({ next, complete });

    subscription.unsubscribe();
    resolvePending(undefined);
    await flushMicrotasks();

    expect(next).not.toHaveBeenCalled();
    expect(complete).not.toHaveBeenCalled();
  });

  it('aborts the provided signal when the upstream subscription is torn down', async () => {
    const { destroyRef } = createMockDestroyRef();
    let receivedSignal: AbortSignal | undefined;

    let resolvePending!: (value: unknown) => void;
    const pending = new Promise<unknown>((resolve) => {
      resolvePending = resolve;
    });
    const suite = createSuiteMock({
      asyncResult: pending as unknown as PromiseLike<NgxSuiteRunResult>,
      latestResult: createSuiteResult({ username: ['Late result'] }),
      onRun: (hooks) => {
        receivedSignal = hooks?.signal;
      },
    });

    const subscription = runFieldValidation(
      suite,
      {},
      { username: 'ada' },
      { debounceTime: 0 },
      destroyRef
    ).subscribe();

    await flushMicrotasks();
    expect(receivedSignal?.aborted).toBe(false);

    subscription.unsubscribe();
    resolvePending(undefined);
    await flushMicrotasks();

    expect(receivedSignal?.aborted).toBe(true);
  });

  it('calls suite.run(model) directly when the focus spec is empty', async () => {
    const { destroyRef } = createMockDestroyRef();
    const model = { username: 'ada' };
    const result = createSuiteResult();
    const suite = createSuiteMock({ syncResult: result });

    const emitted = await new Promise<NgxSuiteRunResult>((resolve, reject) => {
      runFieldValidation(
        suite,
        {},
        model,
        { debounceTime: 0 },
        destroyRef
      ).subscribe({ next: resolve, error: reject });
    });

    expect(suite.run).toHaveBeenCalledWith(
      model,
      undefined,
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    );
    expect(suite.only).not.toHaveBeenCalled();
    expect(emitted).toBe(result);
  });

  it('extractFieldErrors returns errors plus warnings, but null for warnings only', () => {
    const result = createSuiteResult(
      { username: ['Required'] },
      { username: ['Heads up'] }
    );
    const warningsOnly = createSuiteResult({}, { username: ['Heads up'] });

    expect(extractFieldErrors(result, 'username')).toEqual({
      errors: ['Required'],
      warnings: ['Heads up'],
    });
    expect(extractFieldErrors(warningsOnly, 'username')).toBeNull();
  });

  it('completes without emission when the destroy ref fires first', async () => {
    const { destroyRef, destroy } = createMockDestroyRef();

    let resolvePending!: (value: unknown) => void;
    const pending = new Promise<unknown>((resolve) => {
      resolvePending = resolve;
    });
    const suite = createSuiteMock({
      asyncResult: pending as unknown as PromiseLike<NgxSuiteRunResult>,
      latestResult: createSuiteResult({ username: ['Late result'] }),
    });

    const next = vi.fn();
    const complete = vi.fn();

    runFieldValidation(
      suite,
      {},
      { username: 'ada' },
      { debounceTime: 0 },
      destroyRef
    ).subscribe({ next, complete });

    destroy();
    resolvePending(undefined);
    await flushMicrotasks();

    expect(next).not.toHaveBeenCalled();
    expect(complete).toHaveBeenCalledOnce();
  });

  it('cancels pending debounce when destroy ref fires before the timer elapses', () => {
    vi.useFakeTimers();
    try {
      const { destroyRef, destroy } = createMockDestroyRef();
      const suite = createSuiteMock({ syncResult: createSuiteResult() });
      const next = vi.fn();
      const complete = vi.fn();

      runFieldValidation(
        suite,
        {},
        { username: 'ada' },
        { debounceTime: 100 },
        destroyRef
      ).subscribe({ next, complete });

      destroy();
      vi.advanceTimersByTime(200);

      expect(suite.run).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
      expect(complete).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });

});
