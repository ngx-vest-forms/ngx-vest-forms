/**
 * Error display strategies for controlling when validation errors are shown to users
 * Configurable strategies that work with Vest's isTested() state for optimal UX
 */

import { computed, type Signal } from '@angular/core';
import type { SuiteResult } from 'vest';
import type { ErrorDisplayStrategy } from './vest-form.types';

/**
 * Compute whether errors should be displayed based on the configured strategy
 * @param result - Current Vest suite result signal
 * @param fieldName - Name of the field to check
 * @param strategy - Error display strategy to use (can be static or signal)
 * @param submitted - Whether the form has been submitted (for 'on-submit' strategy)
 * @returns Signal indicating whether errors should be shown
 */
export function computeShowErrors(
  result: Signal<SuiteResult<string, string>>,
  fieldName: string,
  strategy: ErrorDisplayStrategy | Signal<ErrorDisplayStrategy>,
  hasSubmitted: Signal<boolean>,
  fieldTouched?: Signal<boolean>,
): Signal<boolean> {
  return computed(() => {
    const currentResult = result();
    const hasErrors = currentResult.hasErrors(fieldName);
    const isTested = currentResult.isTested(fieldName);
    const isSubmitted = hasSubmitted();
    // Vest.js first: Use explicit fieldTouched when provided, otherwise fall back to Vest's isTested
    // This allows precise WCAG control (explicit blur) while respecting Vest's validation state
    const touched = fieldTouched ? fieldTouched() : isTested;

    if (!hasErrors) {
      return false; // No errors to show
    }

    // Unwrap strategy (always a signal or function)
    const currentStrategy =
      typeof strategy === 'function' ? strategy() : strategy;

    switch (currentStrategy) {
      case 'immediate': {
        // Show errors as soon as validation produces them
        // Still requires validation to have run (isTested=true) - can't show errors that don't exist yet
        return hasErrors && isTested;
      }

      case 'on-touch': {
        // Show errors after field has been explicitly touched (blur) OR form has been submitted
        // Use explicit touch tracking (fieldTouched) when available
        return (touched || isSubmitted) && hasErrors;
      }

      case 'on-submit': {
        // Show errors only after form submission attempt
        // Requires both submission AND that the field was validated (isTested)
        return isSubmitted && hasErrors && isTested;
      }

      case 'manual': {
        // Never show errors automatically - developer controls display
        return false;
      }

      default: {
        // Default to 'on-touch' behavior
        return (touched || isSubmitted) && hasErrors;
      }
    }
  });
}

/**
 * Create a custom error display strategy function
 * @param strategyFn - Custom function to determine if errors should be shown
 * @returns Strategy function compatible with computeShowErrors
 */
export function createCustomErrorStrategy(
  strategyFunction: (parameters: {
    hasErrors: boolean;
    isTested: boolean;
    isSubmitted: boolean;
    isPending: boolean;
    fieldName: string;
  }) => boolean,
): (
  result: Signal<SuiteResult<string, string>>,
  fieldName: string,
  hasSubmitted: Signal<boolean>,
) => Signal<boolean> {
  return (result, fieldName, hasSubmitted) => {
    return computed(() => {
      const currentResult = result();
      const hasErrors = currentResult.hasErrors(fieldName);
      const isTested = currentResult.isTested(fieldName);
      const isPending = currentResult.isPending(fieldName);
      const isSubmitted = hasSubmitted();

      return strategyFunction({
        hasErrors,
        isTested,
        isSubmitted,
        isPending,
        fieldName,
      });
    });
  };
}

/**
 * Predefined error display strategies with their descriptions and use cases
 */
export const ERROR_STRATEGIES = {
  immediate: {
    name: 'Immediate',
    description: 'Show errors as soon as they occur',
    useCase: 'Real-time feedback, password strength indicators',
    pros: ['Instant feedback', 'Clear guidance'],
    cons: ['Can be overwhelming', 'May interrupt user flow'],
  },

  'on-touch': {
    name: 'On Touch',
    description: 'Show errors after field loses focus or form is submitted',
    useCase: 'Standard forms, balanced UX (default) - WCAG recommended',
    pros: [
      'Balanced feedback timing',
      'Less intrusive during data entry',
      'Shows all errors on submit (even untouched fields)',
    ],
    cons: ['Requires interaction or submit for initial display'],
  },

  'on-submit': {
    name: 'On Submit',
    description: 'Show errors only after form submission',
    useCase: 'Simple forms, minimal interruption',
    pros: ['Non-intrusive', 'Clean interface'],
    cons: ['Late error feedback', 'May frustrate users'],
  },

  manual: {
    name: 'Manual',
    description: 'Developer controls error display entirely',
    useCase: 'Custom flows, wizards, complex validation',
    pros: ['Full control', 'Custom timing'],
    cons: ['More implementation work', 'Easy to forget errors'],
  },
} as const;

/**
 * Get strategy information for documentation and debugging
 * @param strategy - Strategy to get information about
 * @returns Strategy information object
 */
export function getStrategyInfo(strategy: ErrorDisplayStrategy) {
  return ERROR_STRATEGIES[strategy] || ERROR_STRATEGIES['on-touch'];
}

/**
 * Utility to create a debounced error display strategy
 * Useful for preventing rapid error state changes during typing
 * @param baseStrategy - Base strategy to debounce
 * @param debounceMs - Debounce delay in milliseconds
 * @returns Debounced strategy function
 */
export function debounceErrorStrategy(baseStrategy: ErrorDisplayStrategy) {
  // Note: This is a simplified implementation
  // Full debouncing would require more complex signal coordination
  return createCustomErrorStrategy((parameters) => {
    // For immediate hiding of errors (when they're fixed)
    if (!parameters.hasErrors) {
      return false;
    }

    // Use the base strategy to determine if we should show errors
    return computeShowErrorsSync(parameters, baseStrategy);
  });
}

/**
 * Synchronous version of error display logic for use in custom strategies
 * @param params - Error state parameters
 * @param strategy - Strategy to apply
 * @returns Whether errors should be shown
 */
function computeShowErrorsSync(
  parameters: {
    hasErrors: boolean;
    isTested: boolean;
    isSubmitted: boolean;
  },
  strategy: ErrorDisplayStrategy,
): boolean {
  if (!parameters.hasErrors) {
    return false;
  }

  switch (strategy) {
    case 'immediate': {
      return parameters.hasErrors;
    }

    case 'on-touch': {
      // Show errors after field has been touched OR form has been submitted
      return (
        (parameters.isTested || parameters.isSubmitted) && parameters.hasErrors
      );
    }

    case 'on-submit': {
      return parameters.isSubmitted && parameters.hasErrors;
    }

    case 'manual': {
      return false;
    }

    default: {
      return (
        (parameters.isTested || parameters.isSubmitted) && parameters.hasErrors
      );
    }
  }
}
