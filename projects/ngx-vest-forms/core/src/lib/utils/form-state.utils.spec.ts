import { describe, expect, it } from 'vitest';
import type { NgxFormState } from '../directives/form.directive';
import { createEmptyFormState } from './form-state.utils';

describe('createEmptyFormState', () => {
  it('should create a valid empty form state with default values', () => {
    const emptyState = createEmptyFormState();

    expect(emptyState).toEqual({
      value: null,
      errors: {},
      warnings: {},
      root: null,
      status: 'VALID',
      dirty: false,
      valid: true,
      invalid: false,
      pending: false,
      disabled: false,
      idle: true,
      submitted: false,
      errorCount: 0,
      warningCount: 0,
      firstInvalidField: null,
      schema: undefined,
    });
  });

  it('should create a form state with proper type inference', () => {
    type TestModel = {
      name: string;
      email: string;
    };

    const emptyState = createEmptyFormState<TestModel>();

    // TypeScript should infer the correct type
    expect(emptyState.value).toBe(null);

    // The type should be NgxFormState<TestModel>
    const typedState: NgxFormState<TestModel> = emptyState;
    expect(typedState).toBeDefined();
  });

  it('should have all required NgxFormState properties', () => {
    const emptyState = createEmptyFormState();

    // Verify all required properties exist
    const requiredProperties = [
      'value',
      'errors',
      'warnings',
      'root',
      'status',
      'dirty',
      'valid',
      'invalid',
      'pending',
      'disabled',
      'idle',
      'submitted',
      'errorCount',
      'warningCount',
      'firstInvalidField',
      'schema',
    ];

    for (const property of requiredProperties) {
      expect(emptyState).toHaveProperty(property);
    }
  });

  it('should create valid state that indicates no validation errors', () => {
    const emptyState = createEmptyFormState();

    expect(emptyState.valid).toBe(true);
    expect(emptyState.invalid).toBe(false);
    expect(emptyState.pending).toBe(false);
    expect(emptyState.errorCount).toBe(0);
    expect(emptyState.warningCount).toBe(0);
    expect(emptyState.status).toBe('VALID');
  });

  it('should create pristine state', () => {
    const emptyState = createEmptyFormState();

    expect(emptyState.dirty).toBe(false);
    expect(emptyState.submitted).toBe(false);
    expect(emptyState.idle).toBe(true);
  });

  it('should have empty collections for errors and warnings', () => {
    const emptyState = createEmptyFormState();

    expect(emptyState.errors).toEqual({});
    expect(emptyState.warnings).toEqual({});
    expect(emptyState.root).toBe(null);
    expect(emptyState.firstInvalidField).toBe(null);
  });

  it('should be compatible with FormStateDisplay component expectations', () => {
    const emptyState = createEmptyFormState();

    // Should satisfy all properties that FormStateDisplay might access
    expect(emptyState.valid).toBeDefined();
    expect(emptyState.pending).toBeDefined();
    expect(emptyState.errors).toBeDefined();
    expect(emptyState.warnings).toBeDefined();
    expect(emptyState.status).toBeDefined();
    expect(emptyState.errorCount).toBeDefined();
    expect(emptyState.warningCount).toBeDefined();

    // Should be safe to JSON.stringify (for FormStateDisplay JSON preview)
    expect(() => JSON.stringify(emptyState)).not.toThrow();
  });
});
