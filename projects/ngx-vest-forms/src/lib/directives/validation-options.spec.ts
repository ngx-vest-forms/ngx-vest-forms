import { describe, expectTypeOf, it } from 'vitest';
import type { NgxValidationOptions } from './validation-options';

/**
 * Tests for NgxValidationOptions type
 * - Type: NgxValidationOptions enforces correct shape (type-level test)
 * - Default value is { debounceTime: 0 }
 * - Used correctly in consuming directives (can be covered in integration tests)
 */
describe('NgxValidationOptions', () => {
  it('should enforce correct type shape', () => {
    expectTypeOf<NgxValidationOptions>().toMatchTypeOf<{
      debounceTime: number;
    }>();
  });

  it('should have a default value of { debounceTime: 0 }', () => {
    // TODO: Implement test (type-level or integration)
  });
});
