/**
 * Test setup for ngx-vest-forms library
 * Configures Angular testing environment and global test utilities for zoneless Angular
 *
 * ## Angular Signal & Effect Cleanup
 *
 * This setup ensures proper cleanup of Angular signals and effects between tests to prevent
 * state leakage. Based on Marmicode's "Flushing flushEffects" and Angular testing best practices:
 *
 * 1. **TestBed.resetTestingModule()** - Destroys all providers and triggers ngOnDestroy
 * 2. **ApplicationRef.whenStable()** - Waits for async effects to complete
 * 3. **Vitest isolation disabled** - TestBed provides sufficient isolation for Angular tests
 *
 * @see https://cookbook.marmicode.io/angular/testing/flushing-flusheffects
 * @see https://cookbook.marmicode.io/angular/testing/why-vitest#vitest-isolation-modes
 */

import '@analogjs/vitest-angular/setup-snapshots';
import '@angular/compiler';
import '@testing-library/jest-dom/vitest';

import { NgModule, provideZonelessChangeDetection } from '@angular/core';
import { getTestBed, TestBed } from '@angular/core/testing';
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing';
import { afterEach } from 'vitest';

@NgModule({
  providers: [provideZonelessChangeDetection()],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ZonelessTestModule {}

getTestBed().initTestEnvironment(
  [BrowserTestingModule, ZonelessTestModule],
  platformBrowserTesting(),
);

// Hide Vite's error overlay in browser tests so it doesn't intercept pointer events
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  (style as HTMLElement).dataset.hideViteOverlay = 'true';
  style.textContent = `
    vite-error-overlay, vite-error-overlay::part(frame) {
      display: none !important;
      pointer-events: none !important;
    }
  `;
  document.head.append(style);
}

// Global test utilities
Object.assign(globalThis, {
  ngDevMode: true,
});

// Mock ResizeObserver for tests
globalThis.ResizeObserver = class MockResizeObserver {
  observe(): void {
    // Mock implementation
  }
  unobserve(): void {
    // Mock implementation
  }
  disconnect(): void {
    // Mock implementation
  }
};

globalThis.IntersectionObserver = class MockIntersectionObserver {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor() {
    // Mock implementation
  }
  observe(): void {
    // Mock implementation
  }
  unobserve(): void {
    // Mock implementation
  }
  disconnect(): void {
    // Mock implementation
  }
  takeRecords(): unknown[] {
    return [];
  }
};

/**
 * Global afterEach hook to ensure proper cleanup of Angular TestBed between tests.
 *
 * **Why this is critical:**
 * - Destroys all providers created by TestBed
 * - Triggers ngOnDestroy lifecycle hooks
 * - Cleans up signal effects and subscriptions
 * - Prevents state leakage between tests
 *
 * Without this, signal state and effects can persist across tests, causing
 * false positives/negatives and flaky test behavior.
 *
 * @see https://cookbook.marmicode.io/angular/testing/flushing-flusheffects
 */
afterEach(() => {
  TestBed.resetTestingModule();
});

/**
 * Re-export test utilities for convenience
 * Import from './test-utilities' directly in test files to avoid setup conflicts
 */
export { runInAngular } from './test-utilities';
