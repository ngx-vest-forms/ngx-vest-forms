import { NgxFormState, createEmptyFormState } from './form-state.utils';

describe('form-state.utils', () => {
  describe('createEmptyFormState', () => {
    it('should create an empty form state with default values', () => {
      const state = createEmptyFormState();

      expect(state).toEqual({
        value: null,
        errors: {},
        valid: true,
      });
    });

    it('should create an empty form state with specific type', () => {
      interface TestModel {
        name: string;
        email: string;
      }

      const state = createEmptyFormState<TestModel>();

      expect(state.value).toBeNull();
      expect(state.errors).toEqual({});
      expect(state.valid).toBe(true);
    });

    it('should have the correct type structure', () => {
      const state: NgxFormState<{ test: string }> = createEmptyFormState();

      // Type checks
      expect(typeof state.valid).toBe('boolean');
      expect(typeof state.errors).toBe('object');
      expect(state.value).toBeNull();
    });

    it('should be useful as a fallback when child form is not initialized', () => {
      // Simulating a scenario where child form might be undefined
      const mockFormState = (): NgxFormState<unknown> | null => null;

      // This pattern is useful in parent components
      const formState = mockFormState() ?? createEmptyFormState();

      expect(formState.valid).toBe(true);
      expect(formState.errors).toEqual({});
      expect(formState.value).toBeNull();
    });
  });
});
