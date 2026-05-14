import '@analogjs/vitest-angular/setup-snapshots';
import '@angular/compiler';

import * as matchers from '@testing-library/jest-dom/matchers';
import { expect } from 'vitest';

expect.extend(matchers);

// JSDOM stubs: no layout engine, so provide minimal implementations so tests can spy on them
Element.prototype.scrollIntoView = () => {};
Element.prototype.getClientRects = () => [{ width: 1, height: 1 }] as unknown as DOMRectList;

if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (_query: string): MediaQueryList =>
      ({
        matches: false,
        media: _query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  });
}
