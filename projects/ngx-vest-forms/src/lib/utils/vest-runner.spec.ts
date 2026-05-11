import { DestroyRef } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runVestSuite } from './vest-runner';

type MockVestSuite = ((
  model: { username: string },
  field?: string,
  options?: { signal: AbortSignal }
) => { done: (cb: (result: unknown) => void) => void }) & {
  get: () => { isPending: () => boolean };
};

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
      for (const listener of [...listeners]) {
        listener();
      }
    },
  };
}

describe('runVestSuite', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('aborts async test signal on teardown and leaves suite.get() non-pending', async () => {
    let latestSignal: AbortSignal | undefined;
    let pending = false;
    const suite: MockVestSuite = ((
      _model: { username: string },
      _field?: string,
      context?: { signal: AbortSignal }
    ) => {
      latestSignal = context?.signal;
      pending = true;

      return {
        done: (_cb: (result: unknown) => void) => {
          latestSignal?.addEventListener(
            'abort',
            () => {
              pending = false;
            },
            { once: true }
          );
        },
      };
    }) as MockVestSuite;

    suite.get = () => ({
      isPending: () => pending,
    });

    const { destroyRef } = createMockDestroyRef();
    const subscription = runVestSuite({
      suite,
      model: { username: 'alice' },
      field: 'username',
      destroyRef,
      mapResult: () => null,
      onError: () => null,
    }).subscribe();

    vi.runOnlyPendingTimers();
    await Promise.resolve();
    expect(suite.get().isPending()).toBe(true);
    expect(latestSignal?.aborted).toBe(false);

    subscription.unsubscribe();
    await Promise.resolve();

    expect(latestSignal?.aborted).toBe(true);
    expect(suite.get().isPending()).toBe(false);
  });
});
