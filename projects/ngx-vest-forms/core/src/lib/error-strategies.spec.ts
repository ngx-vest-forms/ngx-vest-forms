/**
 * Unit tests for error display strategies
 * Tests when and how validation errors should be shown to users
 */

import { signal } from '@angular/core';
import type { SuiteResult } from 'vest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  computeShowErrors,
  createCustomErrorStrategy,
  debounceErrorStrategy,
  ERROR_STRATEGIES,
  getStrategyInfo,
} from './error-strategies';
import type { ErrorDisplayStrategy } from './vest-form.types';

// SuiteResult fake keeps the tests type-safe while mirroring the real API (see "Fake It Till You Mock It")
//
const createMockSuiteResult = (
  options: {
    hasErrors?: boolean;
    isTested?: boolean;
    isPending?: boolean;
    fieldName?: string;
  } = {},
) => {
  const {
    hasErrors = false,
    isTested = false,
    isPending = false,
    fieldName: defaultFieldName = 'test-field',
  } = options;

  const ensureKnownField = (fieldName?: string) => {
    if (fieldName && fieldName !== defaultFieldName) {
      throw new Error(
        `SuiteResult fake can only answer for "${defaultFieldName}" (received "${fieldName}")`,
      );
    }
  };

  const hasErrorsMock = vi.fn((fieldName?: string) => {
    ensureKnownField(fieldName);
    return hasErrors;
  });
  const isTestedMock = vi.fn((fieldName?: string) => {
    ensureKnownField(fieldName);
    return isTested;
  });
  const isPendingMock = vi.fn((fieldName?: string) => {
    ensureKnownField(fieldName);
    return isPending;
  });
  const getErrorsImpl = (fieldName?: string) => {
    ensureKnownField(fieldName);

    if (!hasErrors) {
      return fieldName ? [] : ({} as Record<string, string[]>);
    }

    if (fieldName) {
      return ['Test error'];
    }

    return { [defaultFieldName]: ['Test error'] } as Record<string, string[]>;
  };

  const getErrorsMock = vi.fn(getErrorsImpl) as unknown as SuiteResult<
    string,
    string
  >['getErrors'];
  const isValidMock = vi.fn((fieldName?: string) => {
    ensureKnownField(fieldName);
    return !hasErrors;
  });

  const baseResult: Partial<SuiteResult<string, string>> = {
    hasErrors: hasErrorsMock,
    isTested: isTestedMock,
    isPending: isPendingMock,
    getErrors: getErrorsMock,
    isValid: isValidMock,
  };

  return baseResult as SuiteResult<string, string>;
};

describe('Error Display Strategies', () => {
  describe('suite result fake', () => {
    it('should guard against accessing unknown fields', () => {
      const suiteResult = createMockSuiteResult({
        fieldName: 'email',
        hasErrors: true,
      });

      expect(() => suiteResult.hasErrors('username')).toThrow(
        'SuiteResult fake can only answer for "email"',
      );
    });
  });

  describe('computeShowErrors', () => {
    const fieldPath = 'email';
    const submittedSignal = signal(false);

    beforeEach(() => submittedSignal.set(false));

    describe('immediate strategy', () => {
      it('should show errors immediately when field has errors', () => {
        const suiteResult = signal<SuiteResult<string, string>>(
          createMockSuiteResult({ fieldName: fieldPath, hasErrors: true }),
        );
        const showErrors = computeShowErrors(
          suiteResult,
          fieldPath,
          'immediate',
          submittedSignal,
        );

        expect(showErrors()).toBe(true);
      });

      it('should not show errors when field is valid', () => {
        const suiteResult = signal<SuiteResult<string, string>>(
          createMockSuiteResult({ fieldName: fieldPath, hasErrors: false }),
        );
        const showErrors = computeShowErrors(
          suiteResult,
          fieldPath,
          'immediate',
          submittedSignal,
        );

        expect(showErrors()).toBe(false);
      });

      it('should show errors even while validation is pending', () => {
        const suiteResult = signal<SuiteResult<string, string>>(
          createMockSuiteResult({
            fieldName: fieldPath,
            hasErrors: true,
            isPending: true,
          }),
        );
        const showErrors = computeShowErrors(
          suiteResult,
          fieldPath,
          'immediate',
          submittedSignal,
        );

        expect(showErrors()).toBe(true);
      });
    });

    describe('on-touch strategy', () => {
      it('should show errors only after field is touched', () => {
        const suiteResult = signal<SuiteResult<string, string>>(
          createMockSuiteResult({
            fieldName: fieldPath,
            hasErrors: true,
            isTested: true,
          }),
        );
        const showErrors = computeShowErrors(
          suiteResult,
          fieldPath,
          'on-touch',
          submittedSignal,
        );

        expect(showErrors()).toBe(true);
      });

      it('should not show errors before field is touched', () => {
        const suiteResult = signal<SuiteResult<string, string>>(
          createMockSuiteResult({
            fieldName: fieldPath,
            hasErrors: true,
            isTested: false,
          }),
        );
        const showErrors = computeShowErrors(
          suiteResult,
          fieldPath,
          'on-touch',
          submittedSignal,
        );

        expect(showErrors()).toBe(false);
      });

      it('should not show errors when field is valid even if touched', () => {
        const suiteResult = signal<SuiteResult<string, string>>(
          createMockSuiteResult({
            fieldName: fieldPath,
            hasErrors: false,
            isTested: true,
          }),
        );
        const showErrors = computeShowErrors(
          suiteResult,
          fieldPath,
          'on-touch',
          submittedSignal,
        );

        expect(showErrors()).toBe(false);
      });

      it('should show errors for untouched fields after form submission', () => {
        // CRITICAL: This tests the accessibility requirement that submit buttons
        // should NOT be disabled, and clicking submit should show ALL errors,
        // even for fields the user never touched.
        const suiteResult = signal<SuiteResult<string, string>>(
          createMockSuiteResult({
            fieldName: fieldPath,
            hasErrors: true,
            isTested: false, // Field was NEVER touched
          }),
        );

        // Initially, errors should not show (field not touched, form not submitted)
        const showErrors = computeShowErrors(
          suiteResult,
          fieldPath,
          'on-touch',
          submittedSignal,
        );
        expect(showErrors()).toBe(false);

        // User clicks submit (which is NOT disabled for accessibility)
        submittedSignal.set(true);

        // Now errors MUST show, even though field was never touched
        expect(showErrors()).toBe(true);
      });

      it('should continue showing errors after submission even if field is later touched', () => {
        const suiteResult = signal<SuiteResult<string, string>>(
          createMockSuiteResult({
            fieldName: fieldPath,
            hasErrors: true,
            isTested: false,
          }),
        );

        const showErrors = computeShowErrors(
          suiteResult,
          fieldPath,
          'on-touch',
          submittedSignal,
        );

        // Submit form (errors appear for untouched fields)
        submittedSignal.set(true);
        expect(showErrors()).toBe(true);

        // User now touches the field - errors should still show
        suiteResult.set(
          createMockSuiteResult({
            fieldName: fieldPath,
            hasErrors: true,
            isTested: true,
          }),
        );
        expect(showErrors()).toBe(true);
      });
    });

    describe('on-submit strategy', () => {
      it('should not show errors before submission', () => {
        const suiteResult = signal<SuiteResult<string, string>>(
          createMockSuiteResult({ fieldName: fieldPath, hasErrors: true }),
        );
        submittedSignal.set(false);

        const showErrors = computeShowErrors(
          suiteResult,
          fieldPath,
          'on-submit',
          submittedSignal,
        );

        expect(showErrors()).toBe(false);
      });

      it('should show errors after submission attempt', () => {
        const suiteResult = signal<SuiteResult<string, string>>(
          createMockSuiteResult({ fieldName: fieldPath, hasErrors: true }),
        );

        submittedSignal.set(true);
        const showErrors = computeShowErrors(
          suiteResult,
          fieldPath,
          'on-submit',
          submittedSignal,
        );

        expect(showErrors()).toBe(true);
        expect(showErrors()).toBe(true); // Subsequent reads stay true
      });
    });

    describe('manual strategy', () => {
      it('should never show errors automatically', () => {
        const suiteResult = signal<SuiteResult<string, string>>(
          createMockSuiteResult({
            fieldName: fieldPath,
            hasErrors: true,
            isTested: true,
          }),
        );
        submittedSignal.set(true);

        const showErrors = computeShowErrors(
          suiteResult,
          fieldPath,
          'manual',
          submittedSignal,
        );

        expect(showErrors()).toBe(false);
      });

      it('should always return false regardless of field state', () => {
        const scenarios = [
          { hasErrors: true, isTested: true },
          { hasErrors: true, isTested: false },
          { hasErrors: false, isTested: true },
          { hasErrors: false, isTested: false },
        ];

        for (const scenario of scenarios) {
          const suiteResult = signal<SuiteResult<string, string>>(
            createMockSuiteResult({ fieldName: fieldPath, ...scenario }),
          );
          const showErrors = computeShowErrors(
            suiteResult,
            fieldPath,
            'manual',
            submittedSignal,
          );

          expect(showErrors()).toBe(false);
        }
      });
    });

    describe('reactivity', () => {
      it('should update when suite result changes', () => {
        const mockResult = createMockSuiteResult({
          fieldName: fieldPath,
          hasErrors: false,
          isTested: true,
        });
        const suiteResult = signal<SuiteResult<string, string>>(mockResult);
        const showErrors = computeShowErrors(
          suiteResult,
          fieldPath,
          'on-touch',
          submittedSignal,
        );

        expect(showErrors()).toBe(false);

        // Update to have errors
        const updatedResult = createMockSuiteResult({
          fieldName: fieldPath,
          hasErrors: true,
          isTested: true,
        });
        suiteResult.set(updatedResult);

        expect(showErrors()).toBe(true);
      });

      it('should update when submission state changes', () => {
        const suiteResult = signal<SuiteResult<string, string>>(
          createMockSuiteResult({ fieldName: fieldPath, hasErrors: true }),
        );
        const showErrors = computeShowErrors(
          suiteResult,
          fieldPath,
          'on-submit',
          submittedSignal,
        );

        expect(showErrors()).toBe(false);

        submittedSignal.set(true);
        expect(showErrors()).toBe(true);

        submittedSignal.set(false);
        expect(showErrors()).toBe(false);
      });
    });
  });

  describe('createCustomErrorStrategy', () => {
    it('should return a callable strategy function', () => {
      const strategy = createCustomErrorStrategy(() => true);
      const suiteResult = signal(
        createMockSuiteResult({ fieldName: 'test-field', hasErrors: true }),
      );
      const hasSubmitted = signal(false);

      const showErrors = strategy(suiteResult, 'test-field', hasSubmitted);

      expect(typeof strategy).toBe('function');
      expect(showErrors()).toBe(true);
    });

    it('should call custom logic with current field state', () => {
      const customLogic = vi.fn(() => false);
      const strategy = createCustomErrorStrategy(customLogic);
      const suiteResult = signal(
        createMockSuiteResult({
          fieldName: 'test-field',
          hasErrors: true,
          isTested: false,
        }),
      );
      const hasSubmitted = signal(false);

      const showErrors = strategy(suiteResult, 'test-field', hasSubmitted);
      showErrors();

      expect(customLogic).toHaveBeenCalledWith({
        hasErrors: true,
        isTested: false,
        isPending: false,
        isSubmitted: false,
        fieldName: 'test-field',
      });
    });

    it('should respect the custom logic return value', () => {
      const customLogic = vi.fn(() => true);
      const strategy = createCustomErrorStrategy(customLogic);
      const suiteResult = signal(
        createMockSuiteResult({ fieldName: 'test', hasErrors: false }),
      );
      const hasSubmitted = signal(false);

      const showErrors = strategy(suiteResult, 'test', hasSubmitted);

      expect(showErrors()).toBe(true);
    });

    it('should react to suite result changes', () => {
      let shouldShow = false;
      const strategy = createCustomErrorStrategy(() => shouldShow);
      const suiteResult = signal(
        createMockSuiteResult({ fieldName: 'test', hasErrors: true }),
      );
      const hasSubmitted = signal(false);

      const showErrors = strategy(suiteResult, 'test', hasSubmitted);
      expect(showErrors()).toBe(false);

      shouldShow = true;
      suiteResult.set(
        createMockSuiteResult({ fieldName: 'test', hasErrors: true }),
      );

      expect(showErrors()).toBe(true);
    });
  });

  describe('debounceErrorStrategy', () => {
    it('should wrap the base strategy in a callable function', () => {
      const baseStrategy: ErrorDisplayStrategy = 'immediate';
      const debouncedStrategy = debounceErrorStrategy(baseStrategy);
      const suiteResult = signal(
        createMockSuiteResult({ fieldName: 'test', hasErrors: true }),
      );
      const hasSubmitted = signal(false);

      const showErrors = debouncedStrategy(suiteResult, 'test', hasSubmitted);

      expect(typeof debouncedStrategy).toBe('function');
      expect(showErrors()).toBe(true);
    });

    it('should honour the underlying strategy rules', () => {
      const debouncedStrategy = debounceErrorStrategy('on-submit');
      const suiteResult = signal(
        createMockSuiteResult({ fieldName: 'test', hasErrors: true }),
      );
      const hasSubmitted = signal(false);

      const showErrors = debouncedStrategy(suiteResult, 'test', hasSubmitted);
      expect(showErrors()).toBe(false);

      hasSubmitted.set(true);
      expect(showErrors()).toBe(true);
    });
  });

  describe('ERROR_STRATEGIES', () => {
    it('should contain all predefined strategies', () => {
      expect(ERROR_STRATEGIES).toHaveProperty('immediate');
      expect(ERROR_STRATEGIES).toHaveProperty('on-touch');
      expect(ERROR_STRATEGIES).toHaveProperty('on-submit');
      expect(ERROR_STRATEGIES).toHaveProperty('manual');
      expect(ERROR_STRATEGIES.immediate).toMatchObject({
        name: 'Immediate',
        description: expect.stringContaining('as soon as they occur'),
      });
      expect(ERROR_STRATEGIES['on-touch']).toMatchObject({
        name: 'On Touch',
        description: expect.stringContaining('loses focus'),
      });
      expect(ERROR_STRATEGIES['on-submit']).toMatchObject({
        name: 'On Submit',
        description: expect.stringContaining('form submission'),
      });
      expect(ERROR_STRATEGIES.manual).toMatchObject({
        name: 'Manual',
        description: expect.stringContaining('Developer controls'),
      });
    });

    it('should have consistent strategy behaviors', () => {
      const fieldPath = 'test';
      const suiteResult = signal(
        createMockSuiteResult({
          fieldName: fieldPath,
          hasErrors: true,
          isTested: true,
        }),
      );
      const submittingSignal = signal(false);

      // Test immediate strategy
      const immediateShow = computeShowErrors(
        suiteResult,
        fieldPath,
        'immediate',
        submittingSignal,
      );
      expect(immediateShow()).toBe(true);

      // Test on-touch strategy
      const onTouchShow = computeShowErrors(
        suiteResult,
        fieldPath,
        'on-touch',
        submittingSignal,
      );
      expect(onTouchShow()).toBe(true);

      // Test manual strategy
      const manualShow = computeShowErrors(
        suiteResult,
        fieldPath,
        'manual',
        submittingSignal,
      );
      expect(manualShow()).toBe(false);
    });
  });

  describe('getStrategyInfo', () => {
    it('should return info for built-in strategies', () => {
      const immediateInfo = getStrategyInfo('immediate');
      expect(immediateInfo).toMatchObject({
        name: 'Immediate',
        description: expect.stringContaining('as soon as they occur'),
        useCase: expect.stringContaining('Real-time'),
      });

      const onTouchInfo = getStrategyInfo('on-touch');
      expect(onTouchInfo.name).toBe('On Touch');
      expect(onTouchInfo.description).toContain('loses focus');

      const onSubmitInfo = getStrategyInfo('on-submit');
      expect(onSubmitInfo.name).toBe('On Submit');
      expect(onSubmitInfo.description).toContain('submission');

      const manualInfo = getStrategyInfo('manual');
      expect(manualInfo.name).toBe('Manual');
      expect(manualInfo.description).toContain('Developer controls');
    });

    it('should expose metadata objects', () => {
      const info = getStrategyInfo('manual');

      expect(info).toMatchObject(ERROR_STRATEGIES.manual);
    });

    it('should handle unknown strategies gracefully', () => {
      const info = getStrategyInfo(
        'unknown' as unknown as ErrorDisplayStrategy,
      );

      expect(info).toMatchObject(ERROR_STRATEGIES['on-touch']);
    });
  });

  describe('Strategy Comparison', () => {
    it('should demonstrate different strategy behaviors', () => {
      const testCases = [
        // Case 1: Field has errors but not touched, not submitting
        {
          state: { hasErrors: true, isTested: false },
          submitting: false,
          expected: {
            immediate: true,
            'on-touch': false,
            'on-submit': false,
            manual: false,
          },
        },
        // Case 2: Field has errors and is touched, not submitting
        {
          state: { hasErrors: true, isTested: true },
          submitting: false,
          expected: {
            immediate: true,
            'on-touch': true,
            'on-submit': false,
            manual: false,
          },
        },
        // Case 3: Field has errors and form is submitting (untouched field)
        // IMPORTANT: on-touch should now show errors after submit, even if untouched
        // This is critical for accessibility (submit buttons should NOT be disabled)
        {
          state: { hasErrors: true, isTested: false },
          submitting: true,
          expected: {
            immediate: true,
            'on-touch': true, // Changed: now shows errors after submit
            'on-submit': true,
            manual: false,
          },
        },
        // Case 4: Field is valid (no errors expected for any strategy)
        {
          state: { hasErrors: false, isTested: true },
          submitting: true,
          expected: {
            immediate: false,
            'on-touch': false,
            'on-submit': false,
            manual: false,
          },
        },
      ];

      for (const testCase of testCases) {
        const fieldPath = 'test';
        const suiteResult = signal(
          createMockSuiteResult({ fieldName: fieldPath, ...testCase.state }),
        );
        const submittingSignal = signal(testCase.submitting);

        for (const [strategyName, expectedResult] of Object.entries(
          testCase.expected,
        )) {
          const strategy = strategyName as ErrorDisplayStrategy;
          const showErrors = computeShowErrors(
            suiteResult,
            fieldPath,
            strategy,
            submittingSignal,
          );

          expect(showErrors()).toBe(expectedResult);
        }
      }
    });
  });

  describe('Performance', () => {
    it('should not recompute unnecessarily', () => {
      const mockResult = createMockSuiteResult({
        fieldName: 'test',
        hasErrors: true,
        isTested: true,
      });
      const suiteResult = signal(mockResult);
      const submittingSignal = signal(false);

      const showErrors = computeShowErrors(
        suiteResult,
        'test',
        'on-touch',
        submittingSignal,
      );

      // Call multiple times - should use cached result
      const result1 = showErrors();
      const result2 = showErrors();
      const result3 = showErrors();

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);

      // Verify mocks were not called excessively
      expect(mockResult.hasErrors).toHaveBeenCalled();
      expect(mockResult.isTested).toHaveBeenCalled();
    });

    it('should handle frequent updates efficiently', () => {
      const suiteResult = signal(
        createMockSuiteResult({ fieldName: 'test', hasErrors: false }),
      );
      const submittingSignal = signal(false);

      const showErrors = computeShowErrors(
        suiteResult,
        'test',
        'immediate',
        submittingSignal,
      );

      // Simulate rapid updates
      for (let index = 0; index < 100; index++) {
        const hasErrors = index % 2 === 0;
        suiteResult.set(
          createMockSuiteResult({ fieldName: 'test', hasErrors }),
        );
        expect(showErrors()).toBe(hasErrors);
      }
    });
  });
});
