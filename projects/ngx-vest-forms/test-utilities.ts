/**
 * Shared test utilities for ngx-vest-forms
 *
 * This file contains reusable test helpers that can be imported by test files
 * without causing TestBed initialization conflicts.
 */

import { ApplicationRef, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';

/**
 * Utility function to run code within Angular's injection context and wait for stability.
 *
 * This is the recommended pattern for testing signal factories and reactive logic
 * that lives beneath components. It ensures:
 * - Code runs in proper injection context
 * - All pending effects are flushed
 * - Async operations complete before assertions
 *
 * @example
 * ```typescript
 * test('signal effect updates correctly', async () => {
 *   const storage = TestBed.inject(StorageFake);
 *   const recipe = signal('babaganoush');
 *
 *   await runInAngular(() => {
 *     autoSave('favorite-recipe', recipe);
 *     recipe.set('burger');
 *   });
 *
 *   expect(storage.getSync('favorite-recipe')).toBe('"burger"');
 * });
 * ```
 *
 * @param callback - Function to execute in Angular context
 * @returns Promise that resolves with the function's return value after Angular stabilizes
 *
 * @see https://cookbook.marmicode.io/angular/testing/flushing-flusheffects#testing-signal-factories
 */
export async function runInAngular<RETURN>(
  callback: () => RETURN | Promise<RETURN>,
): Promise<RETURN> {
  return TestBed.runInInjectionContext(async () => {
    const app = inject(ApplicationRef);
    const result = await callback();
    await app.whenStable();
    return result;
  });
}
