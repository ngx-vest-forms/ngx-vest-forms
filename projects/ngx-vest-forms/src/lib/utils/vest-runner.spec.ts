import { DestroyRef } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  extractFieldErrors,
  NgxSuiteFocusSpec,
  NgxSuiteRunResult,
  runFieldValidation,
} from './vest-runner';

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
    getErrors(field?: string) {
      return field ? errors[field] ?? [] : errors;
    },
    getWarnings(field?: string) {
      return field ? warnings[field] ?? [] : warnings;
    },
  };
}

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('vest-runner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('emits once and completes for a synchronous suite result', async () => {
    const { destroyRef } = createMockDestroyRef();
    const result = createSuiteResult({ username: ['Required'] });
    const suite = {
      run: vi.fn(() => result),
      focus: vi.fn((focus: NgxSuiteFocusSpec) => ({
        run: vi.fn(() => {
          expect(focus).toEqual({ only: 'username' });
          return result;
        }),
      })),
    };

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

    expect(values).toEqual([result]);
    expect(complete).toHaveBeenCalledOnce();
  });

  it('emits after a thenable suite result resolves', async () => {
    const { destroyRef } = createMockDestroyRef();
    const result = createSuiteResult({ username: ['Taken'] });

    let resolveResult!: (value: NgxSuiteRunResult) => void;
    const suite = {
      run: vi.fn(
        () =>
          new Promise<NgxSuiteRunResult>((resolve) => {
            resolveResult = resolve;
          })
      ),
      focus: vi.fn(),
    };

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

    resolveResult(result);
    await flushMicrotasks();

    expect(values).toEqual([result]);
  });

  it('emits the latest suite state when the thenable rejects', async () => {
    const { destroyRef } = createMockDestroyRef();
    const latestResult = createSuiteResult({ username: ['Recovered latest state'] });
    const suite = {
      get: vi.fn(() => latestResult),
      run: vi.fn(() => Promise.reject(new Error('boom'))),
      focus: vi.fn(),
    };

    const values: NgxSuiteRunResult[] = [];

    runFieldValidation(
      suite,
      {},
      { username: 'ada' },
      { debounceTime: 0 },
      destroyRef
    ).subscribe((value) => values.push(value));

    await flushMicrotasks();

    expect(suite.get).toHaveBeenCalledOnce();
    expect(values).toEqual([latestResult]);
  });

  it('stops emission when the upstream subscription is torn down', async () => {
    const { destroyRef } = createMockDestroyRef();

    let resolveResult!: (value: NgxSuiteRunResult) => void;
    const suite = {
      run: vi.fn(
        () =>
          new Promise<NgxSuiteRunResult>((resolve) => {
            resolveResult = resolve;
          })
      ),
      focus: vi.fn(),
    };

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
    resolveResult(createSuiteResult({ username: ['Late result'] }));
    await flushMicrotasks();

    expect(next).not.toHaveBeenCalled();
    expect(complete).not.toHaveBeenCalled();
  });

  it('routes group focus through suite.focus(...).run(...)', async () => {
    const { destroyRef } = createMockDestroyRef();
    const result = createSuiteResult({ rootForm: ['Group error'] });
    const run = vi.fn(() => result);
    const focus = vi.fn(() => ({ run }));
    const suite = {
      run: vi.fn(),
      focus,
    };

    const emitted = await new Promise<NgxSuiteRunResult>((resolve, reject) => {
      runFieldValidation(
        suite,
        { onlyGroup: 'account' },
        { username: 'ada' },
        { debounceTime: 0 },
        destroyRef
      ).subscribe({ next: resolve, error: reject });
    });

    expect(focus).toHaveBeenCalledWith({ onlyGroup: 'account' });
    expect(run).toHaveBeenCalledWith({ username: 'ada' });
    expect(suite.run).not.toHaveBeenCalled();
    expect(emitted).toBe(result);
  });

  it('calls suite.run(model) directly when the focus spec is empty', async () => {
    const { destroyRef } = createMockDestroyRef();
    const model = { username: 'ada' };
    const result = createSuiteResult();
    const run = vi.fn(() => result);
    const suite = {
      run,
      focus: vi.fn(),
    };

    const emitted = await new Promise<NgxSuiteRunResult>((resolve, reject) => {
      runFieldValidation(
        suite,
        {},
        model,
        { debounceTime: 0 },
        destroyRef
      ).subscribe({ next: resolve, error: reject });
    });

    expect(run).toHaveBeenCalledWith(model);
    expect(suite.focus).not.toHaveBeenCalled();
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

    let resolveResult!: (value: NgxSuiteRunResult) => void;
    const suite = {
      run: vi.fn(
        () =>
          new Promise<NgxSuiteRunResult>((resolve) => {
            resolveResult = resolve;
          })
      ),
      focus: vi.fn(),
    };

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
    resolveResult(createSuiteResult({ username: ['Late result'] }));
    await flushMicrotasks();

    expect(next).not.toHaveBeenCalled();
    expect(complete).toHaveBeenCalledOnce();
  });
});
