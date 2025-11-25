import '@angular/compiler';
import '@analogjs/vitest-angular/setup-snapshots';

import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Initialize TestBed environment
setupTestBed();

