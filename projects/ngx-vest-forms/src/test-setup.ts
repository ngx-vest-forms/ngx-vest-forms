import '@testing-library/jest-dom';
import { setupZonelessTestEnv } from 'jest-preset-angular/setup-env/zoneless';

setupZonelessTestEnv();

// Polyfill for structuredClone if not available (Jest environment)
if (typeof structuredClone === 'undefined') {
  global.structuredClone = function structuredClone(obj: unknown) {
    return JSON.parse(JSON.stringify(obj));
  };
}
