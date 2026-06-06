import { DestroyRef } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import type { NgxSuiteRunResult, NgxVestSuite } from './validation-suite';
import {
  extractFieldErrors,
  extractFieldWarnings,
  runFieldValidation,
  type NgxSuiteFocusSpec,
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

/**
 * Builds a structural `NgxSuiteRunResult`. Vest 6.3 `run()` is ALWAYS
 * thenable (a promise merged with the sync selectors), but — crucially —
 * the value it RESOLVES TO is a concrete result snapshot, NOT the thenable
 * itself. Modelling the thenable as resolving to itself would make
 * `Promise.resolve(result)` / `from(result)` adopt it forever (JS heap OOM).
 * So the returned object carries the selectors + a `then`, and that `then`
 * resolves to a separate, NON-thenable `snapshot`. `resolvesTo`/`rejects`
 * override the resolution behaviour to simulate async (de)resolution.
 */
function createSuiteResult(
  errors: Record<string, string[]> = {},
  warnings: Record<string, string[]> = {},
  opts: {
    resolvesTo?: NgxSuiteRunResult | undefined;
    rejects?: unknown;
    pending?: Promise<unknown>;
  } = {}
): NgxSuiteRunResult {
  const selectors = {
    getErrors: ((field?: string) =>
      field !== undefined
        ? (errors[field] ?? [])
        : errors) as NgxSuiteRunResult['getErrors'],
    getWarnings: ((field?: string) =>
      field !== undefined
        ? (warnings[field] ?? [])
        : warnings) as NgxSuiteRunResult['getWarnings'],
  };

  // The plain, NON-thenable snapshot the thenable resolves to (mirrors the
  // value Vest's merged promise actually resolves with).
  const snapshot: NgxSuiteRunResult = { ...selectors } as NgxSuiteRunResult;

  const thenable: NgxSuiteRunResult = { ...selectors } as NgxSuiteRunResult;
  thenable.then = (<TResult1, TResult2>(
    onfulfilled?:
      | ((value: NgxSuiteRunResult) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> => {
    if (opts.pending) {
      return opts.pending.then(
        () =>
          (onfulfilled
            ? onfulfilled(
                'resolvesTo' in opts
                  ? (opts.resolvesTo as NgxSuiteRunResult)
                  : snapshot
              )
            : undefined) as TResult1,
        (r) => (onrejected ? onrejected(r) : Promise.reject(r)) as TResult2
      );
    }
    if (opts.rejects !== undefined) {
      return Promise.reject(opts.rejects).then(
        undefined,
        onrejected ?? undefined
      ) as PromiseLike<TResult2>;
    }
    const resolved =
      'resolvesTo' in opts ? (opts.resolvesTo as NgxSuiteRunResult) : snapshot;
    return Promise.resolve(resolved).then(
      onfulfilled ?? undefined
    ) as PromiseLike<TResult1>;
  }) as NgxSuiteRunResult['then'];

  return thenable;
}

type TestModel = { username: string };

function createSuiteMock(overrides: {
  runResult?: NgxSuiteRunResult;
  latestResult?: NgxSuiteRunResult;
  onRun?: () => void;
  enableFocus?: boolean;
}): RunnableVestSuite<TestModel> & {
  run: ReturnType<typeof vi.fn>;
  only: ReturnType<typeof vi.fn>;
  focus?: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
} {
  const returnValue = overrides.runResult ?? createSuiteResult();
  const run = vi.fn((_model: TestModel) => {
    overrides.onRun?.();
    return returnValue;
  });
  const only = vi.fn(() => ({ run }));
  const focus = vi.fn((_focus: NgxSuiteFocusSpec) => ({ run }));
  const get = vi.fn(() => overrides.latestResult ?? createSuiteResult());
  const suite = { run, only, get } as RunnableVestSuite<TestModel> & {
    run: ReturnType<typeof vi.fn>;
    only: ReturnType<typeof vi.fn>;
    focus?: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
  };
  if (overrides.enableFocus) {
    suite.focus = focus;
  }
  return suite;
}

function createFocusSuiteMock(
  result: NgxSuiteRunResult
): RunnableVestSuite<TestModel> & {
  run: ReturnType<typeof vi.fn>;
  only: ReturnType<typeof vi.fn>;
  focus: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
} {
  const suite = createSuiteMock({ runResult: result, enableFocus: true });
  return suite as RunnableVestSuite<TestModel> & {
    run: ReturnType<typeof vi.fn>;
    only: ReturnType<typeof vi.fn>;
    focus: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
  };
}

async function flushMicrotasks(): Promise<void> {
  // One macrotask flush so `timer(0)` fires, plus microtask flushes for the
  // subsequent `from(Promise.resolve(...))`/`map(...)` operators.
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  await Promise.resolve();
  await Promise.resolve();
}

describe('vest-runner', () => {
  it('emits the resolved per-run snapshot and completes', async () => {
    const { destroyRef } = createMockDestroyRef();
    const result = createSuiteResult({ username: ['Required'] });
    const suite = createSuiteMock({ runResult: result });

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
    expect(suite.run).toHaveBeenCalledWith({ username: '' });
    // The model is the ONLY arg — no dead {signal}/hooks transport.
    expect(suite.run.mock.calls[0]).toHaveLength(1);
    // `from(result)` emits the value the thenable RESOLVES TO (the per-run
    // snapshot), not the thenable wrapper itself. The snapshot shares the
    // result's selector functions, so assert via selector identity.
    expect(values).toHaveLength(1);
    expect(values[0]?.getErrors).toBe(result.getErrors);
    expect(values[0]?.getErrors('username')).toEqual(['Required']);
    expect(complete).toHaveBeenCalledOnce();
  });

  it('emits the value the run promise RESOLVES to, not shared suite.get()', async () => {
    // Cross-field contamination guard (#1): the resolved per-run snapshot must
    // win over the shared, mutable `suite.get()` state.
    const { destroyRef } = createMockDestroyRef();
    const perRunSnapshot = createSuiteResult({ username: ['Per-run'] });
    const sharedState = createSuiteResult({ username: ['Contaminated'] });
    const runResult = createSuiteResult({}, {}, {
      resolvesTo: perRunSnapshot,
    });
    const suite = createSuiteMock({
      runResult,
      latestResult: sharedState,
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

    expect(values).toHaveLength(1);
    expect(values[0]?.getErrors('username')).toEqual(['Per-run']);
    // suite.get() must NOT be used on the happy path.
    expect(suite.get).not.toHaveBeenCalled();
  });

  it('falls back to suite.get() when the run promise resolves to nothing', async () => {
    const { destroyRef } = createMockDestroyRef();
    const fallback = createSuiteResult({ username: ['Fallback'] });
    const runResult = createSuiteResult({}, {}, {
      resolvesTo: undefined,
    });
    const suite = createSuiteMock({
      runResult,
      latestResult: fallback,
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
    expect(values).toEqual([fallback]);
  });

  it('emits the latest suite state when the run promise rejects', async () => {
    const { destroyRef } = createMockDestroyRef();
    const latestResult = createSuiteResult({
      username: ['Recovered latest state'],
    });
    const runResult = createSuiteResult({}, {}, {
      rejects: new Error('boom'),
    });
    const suite = createSuiteMock({
      runResult,
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
      runResult: createSuiteResult({}, {}, { pending }),
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

  it('calls suite.run(model) directly when the focus spec is empty', async () => {
    const { destroyRef } = createMockDestroyRef();
    const model = { username: 'ada' };
    const result = createSuiteResult();
    const suite = createSuiteMock({ runResult: result });

    const emitted = await new Promise<unknown>((resolve, reject) => {
      runFieldValidation(
        suite,
        {},
        model,
        { debounceTime: 0 },
        destroyRef
      ).subscribe({ next: resolve, error: reject });
    });

    expect(suite.run).toHaveBeenCalledWith(model);
    expect(suite.run.mock.calls[0]).toHaveLength(1);
    expect(suite.only).not.toHaveBeenCalled();
    // Emitted value is the resolved per-run snapshot (shares the result's
    // selector functions), not the thenable wrapper itself.
    expect((emitted as NgxSuiteRunResult).getErrors).toBe(result.getErrors);
  });

  it('routes onlyGroup focus through suite.focus and keeps field-only precedence', async () => {
    const { destroyRef } = createMockDestroyRef();
    const model = { username: 'ada' };
    const result = createSuiteResult();
    const suite = createFocusSuiteMock(result);

    const emitted = await new Promise<unknown>((resolve, reject) => {
      runFieldValidation(
        suite,
        { onlyGroup: 'step-1', only: 'ignored-by-caller' },
        model,
        { debounceTime: 0 },
        destroyRef
      ).subscribe({ next: resolve, error: reject });
    });

    expect(suite.focus).toHaveBeenCalledWith({
      onlyGroup: 'step-1',
      only: 'ignored-by-caller',
    });
    expect(suite.only).not.toHaveBeenCalled();
    expect(suite.run).toHaveBeenCalledWith(model);
    // Emitted value is the resolved per-run snapshot (shares the result's
    // selector functions), not the thenable wrapper itself.
    expect((emitted as NgxSuiteRunResult).getErrors).toBe(result.getErrors);
  });

  it('routes skipGroup focus through suite.focus', async () => {
    const { destroyRef } = createMockDestroyRef();
    const model = { username: 'ada' };
    const result = createSuiteResult();
    const suite = createFocusSuiteMock(result);

    const emitted = await new Promise<unknown>((resolve, reject) => {
      runFieldValidation(
        suite,
        { skipGroup: 'step-2', only: 'username' },
        model,
        { debounceTime: 0 },
        destroyRef
      ).subscribe({ next: resolve, error: reject });
    });

    expect(suite.focus).toHaveBeenCalledWith({
      skipGroup: 'step-2',
      only: 'username',
    });
    expect(suite.only).not.toHaveBeenCalled();
    expect(suite.run).toHaveBeenCalledWith(model);
    // Emitted value is the resolved per-run snapshot (shares the result's
    // selector functions), not the thenable wrapper itself.
    expect((emitted as NgxSuiteRunResult).getErrors).toBe(result.getErrors);
  });

  it('embeds warnings alongside errors, and stays null for warnings-only', () => {
    const result = createSuiteResult(
      { username: ['Required'] },
      { username: ['Heads up'] }
    );
    const warningsOnly = createSuiteResult({}, { username: ['Heads up'] });

    // Vest M1 (deferred, see ADR-0002): warnings ARE embedded alongside
    // errors so consumers reading `control.errors.warnings` keep working.
    // Validity is unaffected because we only embed when real errors exist.
    expect(extractFieldErrors(result, 'username')).toEqual({
      errors: ['Required'],
      warnings: ['Heads up'],
    });
    // Warning-only field has no errors → null (warnings never block validity).
    expect(extractFieldErrors(warningsOnly, 'username')).toBeNull();
  });

  it('extractFieldWarnings still surfaces warnings as a separate source', () => {
    const result = createSuiteResult(
      { username: ['Required'] },
      { username: ['Heads up'] }
    );
    expect(extractFieldWarnings(result, 'username')).toEqual(['Heads up']);
    expect(
      extractFieldWarnings(createSuiteResult(), 'username')
    ).toBeUndefined();
  });

  it('completes without emission when the destroy ref fires first', async () => {
    const { destroyRef, destroy } = createMockDestroyRef();

    let resolvePending!: (value: unknown) => void;
    const pending = new Promise<unknown>((resolve) => {
      resolvePending = resolve;
    });
    const suite = createSuiteMock({
      runResult: createSuiteResult({}, {}, { pending }),
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
      const suite = createSuiteMock({ runResult: createSuiteResult() });
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
