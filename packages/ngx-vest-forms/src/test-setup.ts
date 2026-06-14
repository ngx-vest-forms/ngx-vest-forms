// JSDOM stubs for navigator - must be set up before any other imports that might use it
if (typeof window !== 'undefined' && typeof window.navigator === 'undefined') {
  Object.defineProperty(window, 'navigator', {
    writable: true,
    configurable: true,
    value: {
      clipboard: {
        writeText: () => Promise.resolve(),
        readText: () => Promise.resolve(''),
      },
      userAgent: 'node.js',
      platform: 'node',
    },
  });
}

import '@analogjs/vitest-angular/setup-serializers';
import '@analogjs/vitest-angular/setup-snapshots';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';
import '@angular/compiler';
import * as matchers from '@testing-library/jest-dom/matchers';
import { expect } from 'vitest';

// Setup Angular test environment for zoneless (Angular 21+)
setupTestBed();

expect.extend(matchers);

// JSDOM stubs: no layout engine, so provide minimal implementations so tests can spy on them
if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = function () {
    // JSDOM stub: no layout engine
  };
  Element.prototype.getClientRects = () =>
    [{ width: 1, height: 1 }] as unknown as DOMRectList;
}

if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (_query: string): MediaQueryList =>
      ({
        matches: false,
        media: _query,
        onchange: null,
        addListener: (_listener: unknown) => {
          // JSDOM stub
        },
        removeListener: (_listener: unknown) => {
          // JSDOM stub
        },
        addEventListener: (_type: string, _listener: unknown) => {
          // JSDOM stub
        },
        removeEventListener: (_type: string, _listener: unknown) => {
          // JSDOM stub
        },
        dispatchEvent: () => false,
      }) as MediaQueryList,
  });
}

// JSDOM stubs for navigator
if (typeof window !== 'undefined' && typeof window.navigator === 'undefined') {
  Object.defineProperty(window, 'navigator', {
    writable: true,
    configurable: true,
    value: {
      clipboard: {
        writeText: () => Promise.resolve(),
        readText: () => Promise.resolve(''),
      },
      userAgent: 'node.js',
      platform: 'node',
    },
  });
}
