/**
 * Test setup for ngx-vest-forms library
 * Configures Angular testing environment and global test utilities for zoneless Angular
 */

import '@angular/compiler';
/// @angular/compiler should be imported other
import '@analogjs/vitest-angular/setup-snapshots';
import '@testing-library/jest-dom/vitest';

import { NgModule, provideZonelessChangeDetection } from '@angular/core';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing';

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

// Mock IntersectionObserver for tests
globalThis.IntersectionObserver = class MockIntersectionObserver {
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
