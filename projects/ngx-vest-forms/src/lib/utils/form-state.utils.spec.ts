import { computed, signal } from '@angular/core';
import {
  createEmptyFormState,
  createFormFeedbackSignals,
  fieldWarningsToRecord,
  NgxFormFeedbackSource,
  NgxFormState,
} from './form-state.utils';

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
      // Simulating a scenario where child form might return null or a state
      let childState: NgxFormState<unknown> | null = null;
      const mockFormState = (): NgxFormState<unknown> | null => childState;

      // Test fallback when null
      const formStateWhenNull = mockFormState() ?? createEmptyFormState();
      expect(formStateWhenNull.valid).toBe(true);
      expect(formStateWhenNull.errors).toEqual({});
      expect(formStateWhenNull.value).toBeNull();

      // Test that it uses the actual state when available
      childState = {
        value: { test: 'data' },
        errors: { field: ['error'] },
        valid: false,
      };
      const formStateWhenPresent = mockFormState() ?? createEmptyFormState();
      expect(formStateWhenPresent).toBe(childState);
      expect(formStateWhenPresent.valid).toBe(false);
    });
  });

  describe('fieldWarningsToRecord', () => {
    it('should convert a warning map to a plain record', () => {
      const warnings = fieldWarningsToRecord(
        new Map([
          ['email', ['Invalid format']],
          ['password', ['Too weak', 'Needs symbol']],
        ])
      );

      expect(warnings).toEqual({
        email: ['Invalid format'],
        password: ['Too weak', 'Needs symbol'],
      });
    });

    it('should clone message arrays when converting', () => {
      const originalMessages = ['Too weak'];
      const warnings = fieldWarningsToRecord(
        new Map([['password', originalMessages]])
      );

      warnings.password?.push('Needs symbol');

      expect(originalMessages).toEqual(['Too weak']);
    });
  });

  describe('createFormFeedbackSignals', () => {
    it('should expose safe fallback values when no form source is available', () => {
      const source = signal<NgxFormFeedbackSource<{ email: string }> | undefined>(
        undefined
      );

      const feedback = createFormFeedbackSignals(source);

      expect(feedback.formState()).toEqual(createEmptyFormState());
      expect(feedback.warnings()).toEqual({});
      expect(feedback.validatedFields()).toEqual([]);
      expect(feedback.pending()).toBe(false);
    });

    it('should derive form feedback from the provided source', () => {
      const formState = signal<NgxFormState<{ email: string }>>({
        value: { email: 'demo@example.com' },
        errors: { email: ['Required'] },
        valid: false,
      });
      const fieldWarnings = signal<ReadonlyMap<string, readonly string[]>>(
        new Map([['email', ['Looks suspicious']]])
      );
      const touchedFieldPaths = signal<readonly string[]>(['email']);
      const pending = signal(true);

      const source = signal<NgxFormFeedbackSource<{ email: string }> | undefined>({
        formState,
        fieldWarnings,
        touchedFieldPaths,
        pending,
      });

      const feedback = createFormFeedbackSignals(source);

      expect(feedback.formState()).toEqual(formState());
      expect(feedback.warnings()).toEqual({
        email: ['Looks suspicious'],
      });
      expect(feedback.validatedFields()).toEqual(['email']);
      expect(feedback.pending()).toBe(true);

      fieldWarnings.set(new Map([['email', ['Still suspicious']]]));
      touchedFieldPaths.set(['email', 'profile.name']);
      pending.set(false);

      expect(feedback.warnings()).toEqual({
        email: ['Still suspicious'],
      });
      expect(feedback.validatedFields()).toEqual(['email', 'profile.name']);
      expect(feedback.pending()).toBe(false);
    });

    it('should fall back safely when the source becomes unavailable after initialization', () => {
      const formState = signal<NgxFormState<{ email: string }>>({
        value: { email: 'demo@example.com' },
        errors: { email: ['Required'] },
        valid: false,
      });
      const source = signal<NgxFormFeedbackSource<{ email: string }> | undefined>({
        formState,
        fieldWarnings: signal(new Map([['email', ['Looks suspicious']]])),
        touchedFieldPaths: signal(['email']),
        pending: signal(true),
      });

      const feedback = createFormFeedbackSignals(source);

      expect(feedback.formState()).toEqual(formState());
      expect(feedback.warnings()).toEqual({ email: ['Looks suspicious'] });

      source.set(undefined);

      expect(feedback.formState()).toEqual(createEmptyFormState());
      expect(feedback.warnings()).toEqual({});
      expect(feedback.validatedFields()).toEqual([]);
      expect(feedback.pending()).toBe(false);
    });

    it('should support overriding the exposed formState', () => {
      const baseState = signal<NgxFormState<{ email: string }>>({
        value: { email: 'demo@example.com' },
        errors: {},
        valid: true,
      });
      const source = signal<NgxFormFeedbackSource<{ email: string }> | undefined>({
        formState: baseState,
        fieldWarnings: signal(new Map()),
        touchedFieldPaths: signal([]),
        pending: signal(false),
      });

      const override = computed(() => ({
        ...baseState(),
        errors: { email: ['Injected error'] },
        valid: false,
      }));

      const feedback = createFormFeedbackSignals(source, {
        formState: override,
      });

      expect(feedback.formState()).toEqual({
        value: { email: 'demo@example.com' },
        errors: { email: ['Injected error'] },
        valid: false,
      });
    });

    it('should fall back to the source formState when an override is nullish', () => {
      const baseState = signal<NgxFormState<{ email: string }>>({
        value: { email: 'demo@example.com' },
        errors: {},
        valid: true,
      });
      const useOverride = signal(true);
      const source = signal<NgxFormFeedbackSource<{ email: string }> | undefined>({
        formState: baseState,
        fieldWarnings: signal(new Map()),
        touchedFieldPaths: signal([]),
        pending: signal(false),
      });

      const override = computed(() =>
        useOverride()
          ? {
              ...baseState(),
              errors: { email: ['Injected error'] },
              valid: false,
            }
          : null
      );

      const feedback = createFormFeedbackSignals(source, {
        formState: override,
      });

      expect(feedback.formState()).toEqual({
        value: { email: 'demo@example.com' },
        errors: { email: ['Injected error'] },
        valid: false,
      });

      useOverride.set(false);

      expect(feedback.formState()).toEqual(baseState());
    });
  });
});
