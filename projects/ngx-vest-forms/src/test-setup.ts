import { setupZonelessTestEnv } from 'jest-preset-angular/setup-env/zoneless';
import '@testing-library/jest-dom';

setupZonelessTestEnv();

// Polyfill for structuredClone if not available (Jest environment)
if (typeof structuredClone === 'undefined') {
  // @ts-ignore
  global.structuredClone = function structuredClone(obj: any) {
    return JSON.parse(JSON.stringify(obj));
  };
}
