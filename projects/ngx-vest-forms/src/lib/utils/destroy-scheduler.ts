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
  let unregisterCalled = false;
  // eslint-disable-next-line prefer-const -- assigned after onDestroy returns
  let unregisterDestroy: (() => void) | undefined;

  // Idempotent unregister wrapper so all paths (timer-fires, explicit-cancel,
  // and onDestroy) can call it safely without double-removal.
  const safeUnregister = () => {
    if (unregisterCalled) return;
    unregisterCalled = true;
    unregisterDestroy?.();
  };

  const handle = setTimeout(() => {
    safeUnregister();
    if (!cancelled) {
      callback();
    }
  }, delayMs);

  unregisterDestroy = destroyRef.onDestroy(() => {
    cancelled = true;
    clearTimeout(handle);
    safeUnregister();
  });

  return () => {
    if (!cancelled) {
      cancelled = true;
      clearTimeout(handle);
      safeUnregister();
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
  let unregisterCalled = false;

  // Register the onDestroy listener before queuing the microtask so that
  // `unregisterDestroy` is always defined when the microtask fires.
  const unregisterDestroy = destroyRef.onDestroy(() => {
    cancelled = true;
    safeUnregister();
  });

  // Idempotent unregister wrapper so all paths (microtask-fires, explicit-cancel,
  // and onDestroy) can call it safely without double-removal.
  function safeUnregister() {
    if (unregisterCalled) return;
    unregisterCalled = true;
    unregisterDestroy();
  }

  queueMicrotask(() => {
    // Always clean up the destroy listener when the microtask fires,
    // regardless of whether the callback is suppressed.
    safeUnregister();
    if (!cancelled) {
      callback();
    }
  });

  return () => {
    if (!cancelled) {
      cancelled = true;
      safeUnregister();
    }
  };
}
