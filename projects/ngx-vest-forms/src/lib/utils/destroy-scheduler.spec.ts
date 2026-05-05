import { DestroyRef } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { scheduleMicrotask, scheduleTimeout } from './destroy-scheduler';

/** Minimal DestroyRef mock that lets tests trigger the destroy lifecycle. */
function createMockDestroyRef(): { destroyRef: DestroyRef; destroy: () => void } {
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

describe('destroy-scheduler', () => {
  describe('scheduleTimeout', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('runs callback when not destroyed', () => {
      const { destroyRef } = createMockDestroyRef();
      const cb = vi.fn();

      scheduleTimeout(cb, 100, destroyRef);
      vi.advanceTimersByTime(100);

      expect(cb).toHaveBeenCalledOnce();
    });

    it('cancels on DestroyRef.onDestroy before timer fires', () => {
      const { destroyRef, destroy } = createMockDestroyRef();
      const cb = vi.fn();

      scheduleTimeout(cb, 100, destroyRef);
      destroy();
      vi.advanceTimersByTime(100);

      expect(cb).not.toHaveBeenCalled();
    });

    it('explicit cancel handle prevents callback', () => {
      const { destroyRef } = createMockDestroyRef();
      const cb = vi.fn();

      const cancel = scheduleTimeout(cb, 100, destroyRef);
      cancel();
      vi.advanceTimersByTime(100);

      expect(cb).not.toHaveBeenCalled();
    });

    it('multiple schedules on same DestroyRef cancel independently', () => {
      const { destroyRef } = createMockDestroyRef();
      const cb1 = vi.fn();
      const cb2 = vi.fn();

      const cancel1 = scheduleTimeout(cb1, 100, destroyRef);
      scheduleTimeout(cb2, 100, destroyRef);

      cancel1();
      vi.advanceTimersByTime(100);

      expect(cb1).not.toHaveBeenCalled();
      expect(cb2).toHaveBeenCalledOnce();
    });

    it('destroy cancels all pending timers on the same DestroyRef', () => {
      const { destroyRef, destroy } = createMockDestroyRef();
      const cb1 = vi.fn();
      const cb2 = vi.fn();

      scheduleTimeout(cb1, 100, destroyRef);
      scheduleTimeout(cb2, 200, destroyRef);

      destroy();
      vi.advanceTimersByTime(300);

      expect(cb1).not.toHaveBeenCalled();
      expect(cb2).not.toHaveBeenCalled();
    });
  });

  describe('scheduleMicrotask', () => {
    it('runs callback when not destroyed', async () => {
      const { destroyRef } = createMockDestroyRef();
      const cb = vi.fn();

      scheduleMicrotask(cb, destroyRef);
      await Promise.resolve(); // flush microtask queue

      expect(cb).toHaveBeenCalledOnce();
    });

    it('cancels on DestroyRef.onDestroy before microtask runs', async () => {
      const { destroyRef, destroy } = createMockDestroyRef();
      const cb = vi.fn();

      scheduleMicrotask(cb, destroyRef);
      destroy(); // synchronous - fires before microtask
      await Promise.resolve(); // flush microtask queue

      expect(cb).not.toHaveBeenCalled();
    });

    it('explicit cancel handle prevents callback', async () => {
      const { destroyRef } = createMockDestroyRef();
      const cb = vi.fn();

      const cancel = scheduleMicrotask(cb, destroyRef);
      cancel();
      await Promise.resolve(); // flush microtask queue

      expect(cb).not.toHaveBeenCalled();
    });

    it('multiple schedules on same DestroyRef cancel independently', async () => {
      const { destroyRef } = createMockDestroyRef();
      const cb1 = vi.fn();
      const cb2 = vi.fn();

      const cancel1 = scheduleMicrotask(cb1, destroyRef);
      scheduleMicrotask(cb2, destroyRef);

      cancel1();
      await Promise.resolve(); // flush microtask queue

      expect(cb1).not.toHaveBeenCalled();
      expect(cb2).toHaveBeenCalledOnce();
    });

    it('destroy cancels all pending microtasks on the same DestroyRef', async () => {
      const { destroyRef, destroy } = createMockDestroyRef();
      const cb1 = vi.fn();
      const cb2 = vi.fn();

      scheduleMicrotask(cb1, destroyRef);
      scheduleMicrotask(cb2, destroyRef);

      destroy();
      await Promise.resolve(); // flush microtask queue

      expect(cb1).not.toHaveBeenCalled();
      expect(cb2).not.toHaveBeenCalled();
    });
  });
});
