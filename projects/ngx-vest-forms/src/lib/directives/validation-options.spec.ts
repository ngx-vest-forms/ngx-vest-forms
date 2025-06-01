import { describe, expectTypeOf, it } from 'vitest';
import type { ValidationOptions } from './validation-options';

/**
 * Tests for ValidationOptions type
 * - Type: ValidationOptions enforces correct shape (type-level test)
 * - Default value is { debounceTime: 0 }
 * - Used correctly in consuming directives (can be covered in integration tests)
 */
describe('ValidationOptions', () => {
  it('should enforce correct type shape', () => {
    expectTypeOf<ValidationOptions>().toMatchTypeOf<{ debounceTime: number }>();
  });

  it('should have a default value of { debounceTime: 0 }', () => {
    // TODO: Implement test (type-level or integration)
  });
});
