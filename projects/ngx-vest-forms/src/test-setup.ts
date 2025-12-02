import '@analogjs/vitest-angular/setup-snapshots';
import '@angular/compiler';

import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';
import * as matchers from '@testing-library/jest-dom/matchers';
import { expect } from 'vitest';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Initialize TestBed environment
setupTestBed();
