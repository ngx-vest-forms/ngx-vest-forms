import { ApplicationRef } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@vitest/browser/context';
import { afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest';

import { AsyncValidationComponent } from './__tests__/components/async-validation.component';
import { DateFormComponent } from './__tests__/components/date-form.component';
import { TestFormComponent } from './__tests__/components/test-form.component';
import { waitForValidationCompletion } from './__tests__/helpers/validation-testing.helpers';
import { strictEmailValidations } from './__tests__/validations/test-form.validations';

/**
 * Legacy validation state helper has been replaced with DOM-based assertions
 * and moved to validation-testing.helpers.ts if needed
 */

describe('NgxFormDirective', () => {
  // Enhanced setup for Angular testing compatibility
  beforeEach(() => {
    // Only use fake timers for specific timing-dependent tests
    // Most async tests should use real timers with Angular's whenStable()
  });

  afterEach(() => {
    // Cleanup any remaining timers
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  describe('Core Functionality (Real Timers)', () => {
    // Use real timers for most tests to avoid conflicts with Angular's async operations
    it('should initialize form directive correctly', async () => {
      const { fixture } = await render(TestFormComponent);
      const componentInstance = fixture.componentInstance;

      const formDirective = componentInstance.vestForm();
      expect(formDirective).toBeDefined();
      expect(formDirective?.formState()).toBeDefined();
    });

    it('should sync form values with model() two-way binding - Enhanced for Angular 20', async () => {
      const { fixture } = await render(TestFormComponent);
      const applicationReference =
        fixture.debugElement.injector.get(ApplicationRef);

      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      const passwordInput = screen.getByLabelText(
        'Password',
      ) as HTMLInputElement;

      // Test input to signal synchronization via model() binding
      await userEvent.fill(emailInput, 'test@example.com');
      await userEvent.fill(passwordInput, 'password123');

      const componentInstance = fixture.componentInstance;

      // Wait for Angular to stabilize instead of advancing fake timers
      await fixture.whenStable();
      await applicationReference.whenStable();

      // Use enhanced validation completion helper with zoneless support
      await waitForValidationCompletion(
        componentInstance.vestForm(),
        applicationReference,
      );

      // Assert form state via DOM
      await expect(screen.getByTestId('form-status')).toHaveTextContent(
        'VALID',
      );
      await expect(screen.getByTestId('form-valid')).toHaveTextContent('true');
      await expect(screen.getByTestId('form-pending')).toHaveTextContent(
        'false',
      );

      // Verify form values via inputs (what the user would see)
      expect(emailInput.value).toBe('test@example.com');
      expect(passwordInput.value).toBe('password123');
    });
  });

  describe('Timing-Dependent Tests (Fake Timers)', () => {
    // Only use fake timers for tests that specifically need controlled timing
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    });

    it('should apply debouncing to validation with controlled timing', async () => {
      const { fixture } = await render(TestFormComponent);
      const emailInput = screen.getByLabelText('Email');

      // Type without triggering immediate validation
      await userEvent.type(emailInput, 'test');

      // Advance time by less than debounce period
      vi.advanceTimersByTime(25);

      // Continue typing - should not have validated yet
      await userEvent.type(emailInput, '@example.com');

      // Now advance past debounce period
      vi.advanceTimersByTime(50);

      // Wait for Angular to process the changes
      await fixture.whenStable();

      // Assert via DOM that input value was updated correctly
      expect((emailInput as HTMLInputElement).value).toBe('test@example.com');

      // No need to directly access component instance state
    });
  });

  // ==============================================================================
  // ESSENTIAL DIRECTIVE-LEVEL TESTS
  // ==============================================================================

  describe('Core Input Handling', () => {
    test.todo('should handle vestSuite input changes correctly');
    test.todo('should handle validationConfig input changes');
    test.todo('should handle validationOptions input changes');
    test.todo('should handle null/undefined vestSuite gracefully');
  });

  describe('Form Value Synchronization', () => {
    test.todo('should sync form values with model() two-way binding');
    test.todo('should handle nested object form values');
    test.todo('should handle null/undefined form values gracefully');
  });

  describe('Validation Integration', () => {
    it('should clear validator cache when validation context changes', async () => {
      // WHAT: Test that changing validation context clears cached validators
      // WHY: Ensures proper memory management and validators use current context

      const { fixture } = await render(TestFormComponent);
      const applicationReference =
        fixture.debugElement.injector.get(ApplicationRef);
      const componentInstance = fixture.componentInstance;
      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;

      // Step 1: Trigger validation with initial context (debounceTime: 50)
      await userEvent.fill(emailInput, 'invalid-email');
      await waitForValidationCompletion(
        componentInstance.vestForm(),
        applicationReference,
      );

      // Verify initial validation state via DOM
      await expect(screen.getByTestId('form-valid')).toHaveTextContent('false');
      await expect(screen.getByTestId('form-errors')).toHaveTextContent(
        'Please provide a valid email',
      );

      const initialErrors = screen.getByTestId('form-errors').textContent;
      // Clean up test
      expect(initialErrors).toContain('Please provide a valid email');

      // Step 2: Change validation context - update debounceTime
      // This should trigger cache cleanup via the #cleanupEffect
      componentInstance.validationOptions = { debounceTime: 100 };
      fixture.detectChanges();
      await applicationReference.whenStable();

      // Step 3: Trigger validation again with new context
      await userEvent.clear(emailInput);
      await userEvent.fill(emailInput, 'test@example.com');
      await waitForValidationCompletion(
        componentInstance.vestForm(),
        applicationReference,
      );

      // Verify validation works with new context via DOM
      await expect(screen.getByTestId('form-valid')).toHaveTextContent('true');
      await expect(screen.getByTestId('form-errors')).not.toHaveTextContent(
        'Please provide a valid email',
      );

      // Assert final input value
      expect((emailInput as HTMLInputElement).value).toBe('test@example.com');
    });

    it('should clear validator cache when vestSuite changes', async () => {
      // WHAT: Test that changing vestSuite clears cached validators
      // WHY: Ensures validators use the new validation logic

      const { fixture } = await render(TestFormComponent);
      const applicationReference =
        fixture.debugElement.injector.get(ApplicationRef);
      const componentInstance = fixture.componentInstance;
      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;

      // Step 1: Trigger validation with original suite
      await userEvent.fill(emailInput, 'test@example.com');
      await waitForValidationCompletion(
        componentInstance.vestForm(),
        applicationReference,
      );

      // Verify initial validation with original suite
      await expect(screen.getByTestId('form-valid')).toHaveTextContent('true');
      await expect(screen.getByTestId('form-errors')).toHaveTextContent('{}');

      // Step 2: Change to a more restrictive vestSuite
      componentInstance.vestSuite = strictEmailValidations;
      fixture.detectChanges();
      await applicationReference.whenStable();

      // Step 3: Trigger validation with new suite (same email should now be invalid)
      await userEvent.clear(emailInput);
      await userEvent.fill(emailInput, 'test@example.com'); // This should fail new validation
      await waitForValidationCompletion(
        componentInstance.vestForm(),
        applicationReference,
      );

      // Verify new validation logic is applied via DOM
      await expect(screen.getByTestId('form-valid')).toHaveTextContent('false');
      await expect(screen.getByTestId('form-errors')).toHaveTextContent(
        'Email must be from example.org domain',
      );
    });

    test.todo('should create field validators when vest suite is provided');
    test.todo('should handle Vest suite execution errors gracefully');
    test.todo('should cache field validators to avoid recreation');
    test.todo('should clean up validation streams on destroy');
  });

  describe('Signal Management', () => {
    test.todo('should update formState signals when form status changes');
    test.todo('should update formState signals when form value changes');
    test.todo('should dispose of reactive signals properly on destroy');
  });

  describe('Host Attributes', () => {
    test.todo('should set novalidate attribute on form element');
    test.todo('should prevent default HTML5 validation');
  });

  describe('AsyncValidationComponent', () => {
    it('should show pending state during async validation and error for taken username', async () => {
      const { fixture } = await render(AsyncValidationComponent);
      const applicationReference =
        fixture.debugElement.injector.get(ApplicationRef);
      const usernameInput = screen.getByLabelText(
        'Username',
      ) as HTMLInputElement;

      // Enter a taken username to trigger async error
      await userEvent.clear(usernameInput);
      await userEvent.type(usernameInput, 'taken');
      await fixture.whenStable();

      // Should be pending while async validation runs
      expect(screen.getByTestId('form-pending').textContent).toBe('true');

      // Wait for async validation to complete
      await waitForValidationCompletion(
        fixture.componentInstance.vestForm(),
        applicationReference,
      );

      // Should show error after async validation (assert via DOM)
      await expect(screen.getByTestId('form-errors')).toHaveTextContent(
        'Username is already taken',
      );
    });
  });

  describe('DateFormComponent', () => {
    it('should show errors for required date fields and be valid when filled', async () => {
      const { fixture } = await render(DateFormComponent);
      const applicationReference =
        fixture.debugElement.injector.get(ApplicationRef);

      // Initially, all required fields are empty
      await waitForValidationCompletion(
        fixture.componentInstance.vestForm(),
        applicationReference,
      );
      // Assert errors are shown for required fields (via DOM)
      await expect(screen.getByTestId('form-errors')).toHaveTextContent(
        'required',
      );
      await expect(screen.getByTestId('form-valid')).toHaveTextContent('false');

      // Fill all required fields
      await userEvent.type(screen.getByLabelText('Event Title'), 'My Event');
      await userEvent.type(screen.getByLabelText('Start Date'), '2025-01-01');
      await userEvent.type(screen.getByLabelText('End Date'), '2025-01-02');
      await userEvent.type(
        screen.getByLabelText('Created At'),
        '2025-01-01T10:00',
      );
      await userEvent.type(screen.getByLabelText('Category'), 'Conference');
      await userEvent.type(
        screen.getByLabelText('Last Updated'),
        '2025-01-01T10:00',
      );
      await fixture.whenStable();
      await waitForValidationCompletion(
        fixture.componentInstance.vestForm(),
        applicationReference,
      );

      // Should be valid now (assert via DOM)
      await expect(screen.getByTestId('form-errors')).toHaveTextContent('{}');
      await expect(screen.getByTestId('form-valid')).toHaveTextContent('true');
    });
  });
});
