import { DestroyRef } from '@angular/core';

/**
 * Schedules a callback to run after a delay, automatically cancelling it if the
 * provided `DestroyRef` fires before the timer expires.
 *
 * @param callback - Function to invoke after the delay.
 * @param delayMs - Delay in milliseconds (passed to `setTimeout`).
 * @param destroyRef - Angular `DestroyRef` to register auto-cancellation against.
 * @returns A cancel function; calling it before the timer fires prevents the
 *          callback from running and unregisters the destroy listener.
 */
export function scheduleTimeout(
  callback: () => void,
  delayMs: number,
  destroyRef: DestroyRef
): () => void {
  let cancelled = false;
  let unregisterDestroy: (() => void) | undefined;

  const handle = setTimeout(() => {
    unregisterDestroy?.();
    if (!cancelled) {
      callback();
    }
  }, delayMs);

  unregisterDestroy = destroyRef.onDestroy(() => {
    cancelled = true;
    clearTimeout(handle);
  });

  return () => {
    if (!cancelled) {
      cancelled = true;
      clearTimeout(handle);
      unregisterDestroy?.();
    }
  };
}

/**
 * Schedules a microtask callback, automatically suppressing it if the provided
 * `DestroyRef` fires before the microtask runs.
 *
 * Since `queueMicrotask` has no native cancellation API, this relies on a
 * destroyed flag that is set inside the registered `onDestroy` hook.
 *
 * @param callback - Function to invoke in the next microtask checkpoint.
 * @param destroyRef - Angular `DestroyRef` to register auto-cancellation against.
 * @returns A cancel function; calling it before the microtask runs prevents the
 *          callback from executing and unregisters the destroy listener.
 */
export function scheduleMicrotask(
  callback: () => void,
  destroyRef: DestroyRef
): () => void {
  let cancelled = false;
  let unregisterDestroy: (() => void) | undefined;

  queueMicrotask(() => {
    unregisterDestroy?.();
    if (!cancelled) {
      callback();
    }
  });

  unregisterDestroy = destroyRef.onDestroy(() => {
    cancelled = true;
  });

  return () => {
    if (!cancelled) {
      cancelled = true;
      unregisterDestroy?.();
    }
  };
}
