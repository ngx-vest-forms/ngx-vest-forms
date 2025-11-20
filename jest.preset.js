const { createCjsPreset } = require('jest-preset-angular/presets');

module.exports = createCjsPreset({
  tsconfig: '<rootDir>/tsconfig.spec.json',
  testEnvironment: 'jsdom',
});
