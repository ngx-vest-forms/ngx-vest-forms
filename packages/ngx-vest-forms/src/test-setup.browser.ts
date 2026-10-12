/**
 * Vitest Browser Mode setup for the ngx-vest-forms library.
 *
 * Deliberately does NOT reuse the jsdom `test-setup.ts`:
 * - no jsdom stubs (navigator, matchMedia, getClientRects,
 *   scrollIntoView) - the real browser provides them all;
 * - no `@testing-library/jest-dom` import - `expect.extend` in the
 *   setup does not reach the test context in browser mode, and the
 *   specs only use matchers that `@vitest/browser` registers itself
 *   (`toBeVisible`) plus direct DOM assertions
 *   (`document.activeElement`, `getAttribute`).
 */
import '@analogjs/vitest-angular/setup-serializers';
import '@analogjs/vitest-angular/setup-snapshots';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';
import '@angular/compiler';

setupTestBed({
  teardown: { destroyAfterEach: true },
});
