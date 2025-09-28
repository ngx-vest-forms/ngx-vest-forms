/**
 * Form composition utilities for combining multiple VestForm instances
 * Enables complex UIs like wizards, multi-step forms, and composite schemas
 */

import { computed, signal, Signal } from '@angular/core';
import type { VestForm } from './vest-form.types';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Options for composing multiple forms
 */
export type ComposeFormsOptions = {
  /** Strategy for combining validation results */
  strategy?: 'all-valid' | 'any-valid' | 'sequential';

  /** Whether to automatically sync models between forms */
  syncModels?: boolean;

  /** Custom validation order (for sequential strategy) */
  validationOrder?: string[];

  /** Whether to merge error messages */
  mergeErrors?: boolean;
};

/**
 * Composed form interface providing unified access to multiple forms
 */
export type ComposedVestForm<TForms extends Record<string, VestForm<any>>> = {
  /** Individual forms by name */
  forms: TForms;

  /** Combined model from all forms */
  model: Signal<{ [K in keyof TForms]: ReturnType<TForms[K]['model']> }>;

  /** Overall validity based on composition strategy */
  valid: Signal<boolean>;

  /** Whether any form has pending validation */
  pending: Signal<boolean>;

  /** Combined errors from all forms */
  errors: Signal<Record<string, string[]>>;

  /** Whether any form is being submitted */
  submitting: Signal<boolean>;

  /** Get a specific form by name */
  getForm<K extends keyof TForms>(name: K): TForms[K];

  /** Validate all forms or specific forms */
  validate(formNames?: (keyof TForms)[]): void;

  /** Submit all forms (validates first) */
  submit(): Promise<{ [K in keyof TForms]: ReturnType<TForms[K]['model']> }>;

  /** Reset all forms or specific forms */
  reset(formNames?: (keyof TForms)[]): void;

  /** Dispose all forms */
  dispose(): void;
};

/**
 * Compose multiple VestForm instances into a unified form
 * @param forms - Object mapping form names to VestForm instances
 * @param options - Composition options
 * @returns Composed form instance
 */
export function composeVestForms<TForms extends Record<string, VestForm<any>>>(
  forms: TForms,
  options: ComposeFormsOptions = {},
): ComposedVestForm<TForms> {
  const { strategy = 'all-valid', mergeErrors = true } = options;

  // Combined model signal
  const model = computed(() => {
    const result = {} as any;
    for (const [name, form] of Object.entries(forms)) {
      result[name] = form.model();
    }
    return result;
  });

  // Combined validity based on strategy
  const valid = computed(() => {
    const formEntries = Object.values(forms);

    switch (strategy) {
      case 'all-valid': {
        return formEntries.every((form) => form.valid());
      }

      case 'any-valid': {
        return formEntries.some((form) => form.valid());
      }

      case 'sequential': {
        // For sequential, check forms in order - stop at first invalid
        const order = options.validationOrder || Object.keys(forms);
        for (const formName of order) {
          const form = forms[formName];
          if (!form.valid()) {
            return false;
          }
        }
        return true;
      }

      default: {
        return formEntries.every((form) => form.valid());
      }
    }
  });

  // Combined pending state
  const pending = computed(() => {
    return Object.values(forms).some((form) => form.pending());
  });

  // Combined errors
  const errors = computed(() => {
    if (!mergeErrors) {
      return {};
    }

    const combinedErrors: Record<string, string[]> = {};

    for (const [formName, form] of Object.entries(forms)) {
      const formErrors = form.errors();

      for (const [fieldName, fieldErrors] of Object.entries(formErrors)) {
        // Prefix field names with form name to avoid conflicts
        const prefixedFieldName = `${formName}.${fieldName}`;
        combinedErrors[prefixedFieldName] = fieldErrors;
      }
    }

    return combinedErrors;
  });

  // Combined submitting state
  const submitting = computed(() => {
    return Object.values(forms).some((form) => form.submitting());
  });

  /**
   * Form operations
   */
  const getForm = <K extends keyof TForms>(name: K): TForms[K] => {
    return forms[name];
  };

  const validate = (formNames?: (keyof TForms)[]) => {
    const formsToValidate = formNames
      ? formNames.map((name) => forms[name])
      : Object.values(forms);

    for (const form of formsToValidate) {
      form.validate();
    }
  };

  const submit = async (): Promise<{
    [K in keyof TForms]: ReturnType<TForms[K]['model']>;
  }> => {
    // Validate all forms first
    validate();

    // Wait for all validations to complete
    await Promise.all(
      Object.values(forms).map(
        (form) =>
          new Promise<void>((resolve) => {
            // If the form has a result signal, wait for it to settle
            if ('result' in form) {
              const result = (form as any).result();
              if (result && typeof result.done === 'function') {
                result.done(() => resolve());
              } else {
                resolve();
              }
            } else {
              resolve();
            }
          }),
      ),
    );

    // Check if all forms are valid
    if (!valid()) {
      throw new Error('Form composition validation failed');
    }

    // Submit all forms in parallel
    const submissions = await Promise.all(
      Object.entries(forms).map(async ([name, form]) => {
        const result = await form.submit();
        return [name, result] as const;
      }),
    );

    // Convert to object format
    const result = {} as any;
    for (const [name, formResult] of submissions) {
      result[name] = formResult;
    }

    return result;
  };

  const reset = (formNames?: (keyof TForms)[]) => {
    const formsToReset = formNames
      ? formNames.map((name) => forms[name])
      : Object.values(forms);

    for (const form of formsToReset) {
      form.reset();
    }
  };

  const dispose = () => {
    for (const form of Object.values(forms)) {
      form.dispose();
    }
  };

  return {
    forms,
    model,
    valid,
    pending,
    errors,
    submitting,
    getForm,
    validate,
    submit,
    reset,
    dispose,
  };
}

/**
 * Wizard form implementation - a specialized composition for sequential forms
 */
export type WizardForm<TSteps extends Record<string, VestForm<any>>> =
  ComposedVestForm<TSteps> & {
    /** Current step index */
    currentStep: Signal<number>;

    /** Current step name */
    currentStepName: Signal<keyof TSteps>;

    /** Whether we're on the first step */
    isFirstStep: Signal<boolean>;

    /** Whether we're on the last step */
    isLastStep: Signal<boolean>;

    /** Whether current step is valid */
    currentStepValid: Signal<boolean>;

    /** Whether we can proceed to next step */
    canProceed: Signal<boolean>;

    /** Go to next step */
    nextStep(): void;

    /** Go to previous step */
    previousStep(): void;

    /** Go to specific step */
    goToStep(step: number | keyof TSteps): void;

    /** Get step names in order */
    getStepNames(): (keyof TSteps)[];
  };

/**
 * Create a wizard form from multiple step forms
 * @param steps - Object mapping step names to VestForm instances
 * @param options - Composition options
 * @returns Wizard form instance
 */
export function createWizardForm<TSteps extends Record<string, VestForm<any>>>(
  steps: TSteps,
  options: ComposeFormsOptions = {},
): WizardForm<TSteps> {
  const baseComposition = composeVestForms(steps, {
    ...options,
    strategy: 'sequential', // Wizards are inherently sequential
  });

  const stepNames = Object.keys(steps) as (keyof TSteps)[];
  const currentStepIndex = signal(0);

  // Wizard-specific computed signals
  const currentStep = computed(() => currentStepIndex());
  const currentStepName = computed(() => stepNames[currentStepIndex()]);
  const isFirstStep = computed(() => currentStepIndex() === 0);
  const isLastStep = computed(
    () => currentStepIndex() === stepNames.length - 1,
  );

  const currentStepValid = computed(() => {
    const stepName = currentStepName();
    const form = steps[stepName];
    return form.valid();
  });

  const canProceed = computed(() => {
    return currentStepValid() && !isLastStep();
  });

  // Wizard navigation
  const nextStep = () => {
    if (!isLastStep() && currentStepValid()) {
      currentStepIndex.update((index) => index + 1);
    }
  };

  const previousStep = () => {
    if (!isFirstStep()) {
      currentStepIndex.update((index) => index - 1);
    }
  };

  const goToStep = (step: number | keyof TSteps) => {
    const targetIndex =
      typeof step === 'number' ? step : stepNames.indexOf(step);

    if (targetIndex >= 0 && targetIndex < stepNames.length) {
      currentStepIndex.set(targetIndex);
    }
  };

  const getStepNames = () => stepNames;

  return {
    ...baseComposition,
    currentStep,
    currentStepName,
    isFirstStep,
    isLastStep,
    currentStepValid,
    canProceed,
    nextStep,
    previousStep,
    goToStep,
    getStepNames,
  };
}

/**
 * Utility functions for form composition
 */
export const compositionUtilities = {
  /**
   * Merge models from multiple forms into a single object
   */
  mergeModels: <T extends Record<string, any>>(
    forms: Record<string, VestForm<any>>,
  ): T => {
    const merged = {} as any;

    for (const [name, form] of Object.entries(forms)) {
      merged[name] = form.model();
    }

    return merged;
  },

  /**
   * Get all errors from multiple forms with optional prefixing
   */
  getAllErrors: (
    forms: Record<string, VestForm<any>>,
    prefix = true,
  ): Record<string, string[]> => {
    const allErrors: Record<string, string[]> = {};

    for (const [formName, form] of Object.entries(forms)) {
      const formErrors = form.errors();

      for (const [fieldName, fieldErrors] of Object.entries(formErrors)) {
        const key = prefix ? `${formName}.${fieldName}` : fieldName;
        allErrors[key] = fieldErrors;
      }
    }

    return allErrors;
  },

  /**
   * Check if all forms in a composition are valid
   */
  allFormsValid: (forms: Record<string, VestForm<any>>): boolean => {
    return Object.values(forms).every((form) => form.valid());
  },

  /**
   * Check if any form in a composition is valid
   */
  anyFormValid: (forms: Record<string, VestForm<any>>): boolean => {
    return Object.values(forms).some((form) => form.valid());
  },

  /**
   * Reset all forms in a composition
   */
  resetAll: (forms: Record<string, VestForm<any>>) => {
    for (const form of Object.values(forms)) {
      form.reset();
    }
  },
};
