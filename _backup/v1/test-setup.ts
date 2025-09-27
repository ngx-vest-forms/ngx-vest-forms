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
