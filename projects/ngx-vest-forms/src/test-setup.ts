import '@angular/compiler';
import '@analogjs/vitest-angular/setup-snapshots';

import { beforeEach, afterEach, expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { provideZonelessChangeDetection, NgModule } from '@angular/core';
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing';
import { getTestBed } from '@angular/core/testing';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Module to provide zoneless change detection for tests
@NgModule({
  providers: [provideZonelessChangeDetection()],
})
class ZonelessTestModule {}

// Initialize TestBed environment once (browser mode requires this)
const TESTBED_SETUP = Symbol.for('ngx-vest-forms-testbed-setup');
if (!(globalThis as Record<symbol, boolean>)[TESTBED_SETUP]) {
  (globalThis as Record<symbol, boolean>)[TESTBED_SETUP] = true;

  getTestBed().initTestEnvironment(
    [BrowserTestingModule, ZonelessTestModule],
    platformBrowserTesting(),
    { teardown: { destroyAfterEach: true } }
  );
}

// Reset TestBed between tests to avoid component ID collisions (NG0912)
beforeEach(() => {
  getTestBed().resetTestingModule();
});

afterEach(() => {
  getTestBed().resetTestingModule();
});

