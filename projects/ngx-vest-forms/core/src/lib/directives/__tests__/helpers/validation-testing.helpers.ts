import { ApplicationRef } from '@angular/core';
import { expect } from 'vitest';
import { NgxFormDirective } from '../../form.directive';

/**
 * Helper to wait for validation to complete with proper Angular integration
 * Uses ApplicationRef.whenStable() instead of zone-dependent code
 */
export async function waitForValidationCompletion(
  formDirective: NgxFormDirective | undefined,
  applicationReference?: ApplicationRef,
): Promise<void> {
  if (!formDirective) return;

  // Use expect.poll() for better async assertion handling
  await expect
    .poll(() => formDirective.formState().pending, {
      timeout: 5000,
      interval: 50,
    })
    .toBe(false);

  // Ensure application is stable for zoneless Angular
  if (applicationReference) {
    await applicationReference.whenStable();
  }
}
