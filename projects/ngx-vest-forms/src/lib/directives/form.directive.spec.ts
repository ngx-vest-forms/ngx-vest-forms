import {
  ApplicationRef,
  Component,
  signal,
  viewChild,
  WritableSignal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@vitest/browser/context';
import { enforce, only, staticSuite, test as vestTest } from 'vest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { vestForms } from '../exports';
import { FormCompatibleDeepRequired } from '../utils/deep-required';
import { FormDirective } from './form.directive';
import { ValidationOptions } from './validation-options';

/**
 * Enhanced helper function for zoneless Angular validation completion
 * Uses ApplicationRef.whenStable() instead of zone-dependent code
 */
async function waitForValidationCompletion(
  formDirective: FormDirective | undefined,
  applicationReference?: ApplicationRef,
): Promise<void> {
  if (!formDirective) return;

  // Use expect.poll() for better async assertion handling
  await expect
    .poll(() => formDirective.formState().pending, {
      timeout: 5000,
      interval: 50,
    })
    .toBe(false);

  // Ensure application is stable for zoneless Angular
  if (applicationReference) {
    await applicationReference.whenStable();
  }
}

/**
 * Enhanced expectations for Resource-based validation
 */
function expectValidationState(
  formDirective: FormDirective | undefined,
  expected: {
    status?: string;
    valid?: boolean;
    invalid?: boolean;
    pending?: boolean;
    hasErrors?: boolean;
  },
) {
  if (!formDirective) {
    throw new Error('FormDirective is not available');
  }

  const formState = formDirective.formState();

  if (expected.status !== undefined) {
    expect(formState.status).toBe(expected.status);
  }
  if (expected.valid !== undefined) {
    expect(formState.valid).toBe(expected.valid);
  }
  if (expected.invalid !== undefined) {
    expect(formState.invalid).toBe(expected.invalid);
  }
  if (expected.pending !== undefined) {
    expect(formState.pending).toBe(expected.pending);
  }
  if (expected.hasErrors !== undefined) {
    const hasErrors =
      formState.errors && Object.keys(formState.errors).length > 0;
    expect(hasErrors).toBe(expected.hasErrors);
  }
}

// Test component that uses FormDirective with proper unidirectional flow
@Component({
  imports: [vestForms, FormsModule],
  template: `
    <form
      scVestForm
      [vestSuite]="vestSuite"
      [(formValue)]="formValue"
      [validationOptions]="validationOptions"
      [validationConfig]="validationConfig"
      #vestForm="scVestForm"
    >
      <label for="email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        [ngModel]="formValue().email"
        placeholder="Enter email"
      />

      <label for="password">Password</label>
      <input
        id="password"
        name="password"
        type="password"
        [ngModel]="formValue().password"
        placeholder="Enter password"
      />

      <button type="submit">Submit</button>

      <!-- Display form state for testing -->
      <div data-testid="form-status">{{ vestForm.formState().status }}</div>
      <div data-testid="form-valid">{{ vestForm.formState().valid }}</div>
      <div data-testid="form-dirty">{{ vestForm.formState().dirty }}</div>
      <div data-testid="form-pending">{{ vestForm.formState().pending }}</div>
    </form>
  `,
})
class TestFormComponent {
  readonly vestForm = viewChild<FormDirective>('vestForm');
  formValue: WritableSignal<{ email: string; password: string } | null> =
    signal({
      email: '',
      password: '',
    });

  validationOptions: ValidationOptions = { debounceTime: 50 }; // Reduced for testing
  validationConfig: Record<string, string[]> | null = null;

  vestSuite = staticSuite(
    (data: { email: string; password: string } | undefined, field?: string) => {
      const actualData = data ?? { email: '', password: '' };
      only(field);

      vestTest('email', 'Email is required', () => {
        enforce(actualData.email).isNotEmpty();
      });

      vestTest('email', 'Must be valid email', () => {
        enforce(actualData.email).matches(/^[^@]+@[^@]+\.[^@]+$/);
      });

      vestTest('password', 'Password is required', () => {
        enforce(actualData.password).isNotEmpty();
      });

      vestTest('password', 'Password must be at least 8 characters', () => {
        enforce(actualData.password).longerThanOrEquals(8);
      });
    },
  );
}

// Component for testing async validation with Resource API
@Component({
  imports: [vestForms, FormsModule],
  template: `
    <form
      scVestForm
      [vestSuite]="asyncVestSuite"
      [(formValue)]="formValue"
      [validationOptions]="validationOptions"
      #vestForm="scVestForm"
    >
      <label for="username">Username</label>
      <input
        id="username"
        name="username"
        [ngModel]="formValue().username"
        placeholder="Enter username"
      />

      <div data-testid="form-pending">{{ vestForm.formState().pending }}</div>
      <div data-testid="form-status">{{ vestForm.formState().status }}</div>
    </form>
  `,
})
class AsyncValidationComponent {
  readonly vestForm = viewChild<FormDirective>('vestForm');

  formValue = signal({ username: '' });
  validationOptions: ValidationOptions = { debounceTime: 100 }; // Realistic debounce for testing

  // Mock async validation suite with controlled timing
  asyncVestSuite = staticSuite(
    (data: { username: string } | undefined, field?: string) => {
      const actualData = data ?? { username: '' };
      only(field);

      vestTest('username', 'Username is required', () => {
        enforce(actualData.username).isNotEmpty();
      });

      vestTest('username', 'Username must be available', async () => {
        if (actualData.username) {
          // Simulate async validation with controlled timing
          await new Promise((resolve) => setTimeout(resolve, 200));
          if (actualData.username === 'taken') {
            throw new Error('Username is already taken');
          }
        }
      });
    },
  );
}

// Define the form model type with optional Date fields
type EventFormModel = {
  title?: string;
  startDate?: Date;
  endDate?: Date;
  details?: {
    createdAt?: Date;
    category?: string;
    metadata?: {
      lastUpdated?: Date;
      version?: number;
    };
  };
};

/**
 * DateFormComponent demonstrates FormCompatibleDeepRequired<T> utility type
 * with actual Date fields to show form initialization compatibility
 */
@Component({
  selector: 'sc-date-form',
  imports: [FormsModule, vestForms],
  template: `
    <form
      scVestForm
      [vestSuite]="dateVestSuite"
      [(formValue)]="formValue"
      [validationOptions]="validationOptions"
      #vestForm="scVestForm"
    >
      <label for="title">Event Title</label>
      <input
        id="title"
        name="title"
        type="text"
        [ngModel]="formValue().title"
        placeholder="Enter event title"
      />

      <label for="startDate">Start Date</label>
      <input
        id="startDate"
        name="startDate"
        type="date"
        [ngModel]="formValue().startDate"
      />

      <label for="endDate">End Date</label>
      <input
        id="endDate"
        name="endDate"
        type="date"
        [ngModel]="formValue().endDate"
      />

      <!-- Nested object with Date -->
      <fieldset>
        <legend>Event Details</legend>

        <label for="createdAt">Created At</label>
        <input
          id="createdAt"
          name="details.createdAt"
          type="datetime-local"
          [ngModel]="formValue().details.createdAt"
        />

        <label for="category">Category</label>
        <input
          id="category"
          name="details.category"
          type="text"
          [ngModel]="formValue().details.category"
          placeholder="Enter category"
        />

        <label for="lastUpdated">Last Updated</label>
        <input
          id="lastUpdated"
          name="details.metadata.lastUpdated"
          type="datetime-local"
          [ngModel]="formValue().details.metadata.lastUpdated"
        />
      </fieldset>

      <button type="submit">Submit</button>

      <!-- Display form state for testing -->
      <div data-testid="form-status">{{ vestForm.formState().status }}</div>
      <div data-testid="form-valid">{{ vestForm.formState().valid }}</div>
      <div data-testid="form-dirty">{{ vestForm.formState().dirty }}</div>
      <div data-testid="form-pending">{{ vestForm.formState().pending }}</div>
      <div data-testid="form-errors">
        {{ vestForm.formState().errors | json }}
      </div>
    </form>
  `,
})
class DateFormComponent {
  readonly vestForm = viewChild<FormDirective>('vestForm');

  // Use FormCompatibleDeepRequired to make all fields required and Date fields compatible with strings
  formValue = signal<FormCompatibleDeepRequired<EventFormModel>>({
    title: '',
    startDate: '', // ✅ Should work with FormCompatibleDeepRequired
    endDate: '',
    details: {
      createdAt: '', // ✅ Should work with FormCompatibleDeepRequired
      category: '',
      metadata: {
        lastUpdated: '', // ✅ Should work with FormCompatibleDeepRequired
        version: 0,
      },
    },
  } satisfies FormCompatibleDeepRequired<EventFormModel>); // Type assertion to work around TS strictness

  validationOptions: ValidationOptions = { debounceTime: 50 };

  dateVestSuite = staticSuite(
    (
      data: FormCompatibleDeepRequired<EventFormModel> | undefined,
      field?: string,
    ) => {
      const actualData =
        data ??
        ({
          title: '',
          startDate: '',
          endDate: '',
          details: {
            createdAt: '',
            category: '',
            metadata: {
              lastUpdated: '',
              version: 0,
            },
          },
        } satisfies FormCompatibleDeepRequired<EventFormModel>);
      only(field);

      vestTest('title', 'Title is required', () => {
        enforce(actualData.title).isNotEmpty();
      });

      vestTest('startDate', 'Start date is required', () => {
        if (typeof actualData.startDate === 'string') {
          enforce(actualData.startDate).isNotEmpty();
        } else {
          enforce(actualData.startDate).isNotEmpty();
        }
      });

      vestTest('endDate', 'End date is required', () => {
        if (typeof actualData.endDate === 'string') {
          enforce(actualData.endDate).isNotEmpty();
        } else {
          enforce(actualData.endDate).isNotEmpty();
        }
      });

      vestTest('startDate', 'Start date must be valid', () => {
        if (actualData.startDate) {
          const date =
            typeof actualData.startDate === 'string'
              ? new Date(actualData.startDate)
              : actualData.startDate;
          enforce(date).condition(
            (d) => d instanceof Date && !Number.isNaN(d.getTime()),
          );
        }
      });

      vestTest('details.createdAt', 'Created date is required', () => {
        if (typeof actualData.details.createdAt === 'string') {
          enforce(actualData.details.createdAt).isNotEmpty();
        } else {
          enforce(actualData.details.createdAt).isNotEmpty();
        }
      });

      vestTest('details.category', 'Category is required', () => {
        enforce(actualData.details.category).isNotEmpty();
      });
    },
  );

  // Method to demonstrate setting actual Date objects
  setActualDates(): void {
    this.formValue.set({
      title: 'Conference 2024',
      startDate: new Date('2024-12-01'), // ✅ Can also use actual Date objects
      endDate: new Date('2024-12-03'),
      details: {
        createdAt: new Date(), // ✅ Current date
        category: 'Technology',
        metadata: {
          lastUpdated: new Date(),
          version: 1,
        },
      },
    });
  }
}

describe('FormDirective', () => {
  // Setup and cleanup for fake timers
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });
  describe('Core Functionality', () => {
    it('should initialize form directive correctly', async () => {
      const { fixture } = await render(TestFormComponent);
      const componentInstance = fixture.componentInstance;

      const formDirective = componentInstance.vestForm();
      expect(formDirective).toBeDefined();
      expect(formDirective?.formState()).toBeDefined();
    });

    it('should sync form values with model() two-way binding - Resource API enhanced', async () => {
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

      // Fast-forward debounce time using fake timers
      vi.advanceTimersByTime(50);

      // Use enhanced validation completion helper with zoneless support
      await waitForValidationCompletion(
        componentInstance.vestForm(),
        applicationReference,
      );

      // Use enhanced validation state expectations
      expectValidationState(componentInstance.vestForm(), {
        status: 'VALID',
        valid: true,
        invalid: false,
        pending: false,
      });

      // Verify form values are synchronized
      expect(componentInstance.vestForm()?.formState().value).toEqual({
        email: 'test@example.com',
        password: 'password123',
      });

      // Verify DOM input values are correct
      expect(emailInput.value).toBe('test@example.com');
      expect(passwordInput.value).toBe('password123');

      // Test signal to input synchronization using linkedSignal improvements
      componentInstance.formValue.set({
        email: 'programmatic@example.com',
        password: 'programmaticpass123',
      });

      // With linkedSignal enhancements, no need for complex timing
      fixture.detectChanges();
      await waitForValidationCompletion(
        componentInstance.vestForm(),
        applicationReference,
      );

      // Verify input values are updated from signal
      expect(emailInput.value).toBe('programmatic@example.com');
      expect(passwordInput.value).toBe('programmaticpass123');
    });

    it('should update formState.value reactively as form changes', async () => {
      const { fixture } = await render(TestFormComponent);
      const applicationReference =
        fixture.debugElement.injector.get(ApplicationRef);

      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      const passwordInput = screen.getByLabelText(
        'Password',
      ) as HTMLInputElement;
      const componentInstance = fixture.componentInstance;

      // Initial state - should have empty values
      let formState = componentInstance.vestForm()?.formState();
      expect(formState?.value).toEqual({ email: '', password: '' });

      // Type partial email
      await userEvent.type(emailInput, 'test');
      vi.advanceTimersByTime(50); // Fast-forward debounce
      await applicationReference.whenStable();

      formState = componentInstance.vestForm()?.formState();
      expect(formState?.value).toEqual({ email: 'test', password: '' });
      expect(formState?.status).toBe('INVALID');

      // Complete email
      await userEvent.type(emailInput, '@example.com');
      vi.advanceTimersByTime(50); // Fast-forward debounce
      await applicationReference.whenStable();

      formState = componentInstance.vestForm()?.formState();
      expect(formState?.value).toEqual({
        email: 'test@example.com',
        password: '',
      });
      expect(formState?.status).toBe('INVALID'); // Still invalid due to empty password

      // Add valid password
      await userEvent.type(passwordInput, 'password123');
      vi.advanceTimersByTime(50); // Fast-forward debounce
      await applicationReference.whenStable();

      formState = componentInstance.vestForm()?.formState();
      expect(formState?.value).toEqual({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(formState?.status).toBe('VALID');
    });

    it('should reflect formState.value when programmatically setting formValue', async () => {
      const { fixture } = await render(TestFormComponent);
      const applicationReference =
        fixture.debugElement.injector.get(ApplicationRef);
      const componentInstance = fixture.componentInstance;

      // Set values programmatically
      componentInstance.formValue.set({
        email: 'programmatic@test.com',
        password: 'securepass',
      });

      fixture.detectChanges();
      await applicationReference.whenStable();

      // Verify formState.value reflects the programmatic changes
      const formState = componentInstance.vestForm()?.formState();
      expect(formState?.value).toEqual({
        email: 'programmatic@test.com',
        password: 'securepass',
      });
      expect(formState?.status).toBe('VALID');
    });

    it('should handle partial form data in formState.value', async () => {
      const { fixture } = await render(TestFormComponent);
      const applicationReference =
        fixture.debugElement.injector.get(ApplicationRef);
      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      const componentInstance = fixture.componentInstance;

      // Fill only email field
      await userEvent.fill(emailInput, 'partial@example.com');
      vi.advanceTimersByTime(50); // Fast-forward debounce
      await applicationReference.whenStable();

      const formState = componentInstance.vestForm()?.formState();
      expect(formState?.value).toEqual({
        email: 'partial@example.com',
        password: '',
      });
      expect(formState?.status).toBe('INVALID');
      expect(formState?.valid).toBe(false);
    });

    it('should maintain formState.value consistency during validation errors', async () => {
      const { fixture } = await render(TestFormComponent);
      const applicationReference =
        fixture.debugElement.injector.get(ApplicationRef);
      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      const passwordInput = screen.getByLabelText(
        'Password',
      ) as HTMLInputElement;
      const componentInstance = fixture.componentInstance;

      // Enter invalid email
      await userEvent.fill(emailInput, 'invalid-email');
      await userEvent.fill(passwordInput, 'short');
      vi.advanceTimersByTime(50); // Fast-forward debounce
      await applicationReference.whenStable();

      const formState = componentInstance.vestForm()?.formState();
      expect(formState?.value).toEqual({
        email: 'invalid-email',
        password: 'short',
      });
      expect(formState?.status).toBe('INVALID');
      expect(formState?.errors).toBeDefined();
      expect(Object.keys(formState?.errors || {})).toContain('email');
      expect(Object.keys(formState?.errors || {})).toContain('password');
    });

    it('should update all formState properties consistently', async () => {
      const { fixture } = await render(TestFormComponent);
      const applicationReference =
        fixture.debugElement.injector.get(ApplicationRef);
      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      const componentInstance = fixture.componentInstance;

      // Initial state verification
      let formState = componentInstance.vestForm()?.formState();
      expect(formState?.dirty).toBe(false);
      expect(formState?.pending).toBe(false);
      expect(formState?.idle).toBe(true);

      // Make form dirty
      await userEvent.type(emailInput, 'test@example.com');
      vi.advanceTimersByTime(50); // Fast-forward debounce
      await applicationReference.whenStable();

      formState = componentInstance.vestForm()?.formState();
      expect(formState?.value).toEqual({
        email: 'test@example.com',
        password: '',
      });
      expect(formState?.dirty).toBe(true);
      expect(formState?.status).toBe('INVALID');
      expect(formState?.valid).toBe(false);
      expect(formState?.invalid).toBe(true);
    });

    it('should update form state signals reactively', async () => {
      await render(TestFormComponent);

      const emailInput = screen.getByLabelText('Email');
      const statusDiv = screen.getByTestId('form-status');
      const validDiv = screen.getByTestId('form-valid');
      const dirtyDiv = screen.getByTestId('form-dirty');

      // Initial state
      expect(statusDiv).toHaveTextContent('VALID');
      expect(validDiv).toHaveTextContent('true');
      expect(dirtyDiv).toHaveTextContent('false');

      // Make form dirty with invalid email
      await userEvent.type(emailInput, 'invalid-email');

      // Wait for validation and state updates
      await expect.poll(() => dirtyDiv.textContent).toBe('true');
      await expect.poll(() => statusDiv.textContent).toBe('INVALID');
      await expect.poll(() => validDiv.textContent).toBe('false');
    });

    it('should apply debouncing to validation', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(vi.fn());

      await render(TestFormComponent);

      const emailInput = screen.getByLabelText('Email');

      // Type rapidly to test debouncing
      await userEvent.click(emailInput);

      // Simulate rapid typing by sending individual keystrokes quickly
      await userEvent.keyboard('t');
      await userEvent.keyboard('e');
      await userEvent.keyboard('s');
      await userEvent.keyboard('t');

      // Fast-forward less than debounce time - validation shouldn't complete
      vi.advanceTimersByTime(25);

      // Continue typing
      await userEvent.keyboard('@example.com');

      // Now advance past the full debounce time
      vi.advanceTimersByTime(50);

      // Should see cached validator creation message (only once per field)
      const validatorCreationLogs = consoleSpy.mock.calls.filter((call) =>
        call[0]?.includes?.('Created Resource-based validator for field'),
      );

      expect(validatorCreationLogs.length).toBeLessThanOrEqual(1);

      consoleSpy.mockRestore();
    });

    it('should handle Resource API async validation properly', async () => {
      const { fixture } = await render(AsyncValidationComponent);
      const applicationReference =
        fixture.debugElement.injector.get(ApplicationRef);
      const usernameInput = screen.getByLabelText(
        'Username',
      ) as HTMLInputElement;
      const componentInstance = fixture.componentInstance;

      // Type a value that triggers async validation
      await userEvent.type(usernameInput, 'testuser');

      // Fast-forward debounce time (100ms)
      vi.advanceTimersByTime(100);

      // Should show pending state initially
      await expect
        .poll(() => screen.getByTestId('form-pending').textContent, {
          timeout: 1000,
          interval: 50,
        })
        .toBe('true');

      // Fast-forward async validation time (200ms)
      vi.advanceTimersByTime(200);

      // Wait for validation to complete using enhanced helper
      await waitForValidationCompletion(
        componentInstance.vestForm(),
        applicationReference,
      );

      // Should resolve to valid
      expectValidationState(componentInstance.vestForm(), {
        status: 'VALID',
        pending: false,
        valid: true,
      });
    });

    it('should handle Resource abortion during rapid input changes', async () => {
      const { fixture } = await render(AsyncValidationComponent);
      const applicationReference =
        fixture.debugElement.injector.get(ApplicationRef);
      const usernameInput = screen.getByLabelText(
        'Username',
      ) as HTMLInputElement;
      const componentInstance = fixture.componentInstance;

      // Rapid input changes to test Resource API abortion
      await userEvent.type(usernameInput, 'a');
      vi.advanceTimersByTime(50); // Partial debounce

      await userEvent.type(usernameInput, 'b');
      vi.advanceTimersByTime(50); // Partial debounce

      await userEvent.clear(usernameInput);
      await userEvent.type(usernameInput, 'finalvalue');

      // Complete debounce and async validation
      vi.advanceTimersByTime(100); // Complete debounce
      vi.advanceTimersByTime(200); // Complete async validation

      // Resource API should automatically abort previous validations
      await waitForValidationCompletion(
        componentInstance.vestForm(),
        applicationReference,
      );

      // Only the final validation should complete
      expectValidationState(componentInstance.vestForm(), {
        status: 'VALID',
        pending: false,
      });

      expect(componentInstance.formValue().username).toBe('finalvalue');
    });

    it('should handle async validation errors with fake timers', async () => {
      const { fixture } = await render(AsyncValidationComponent);
      const applicationReference =
        fixture.debugElement.injector.get(ApplicationRef);
      const usernameInput = screen.getByLabelText(
        'Username',
      ) as HTMLInputElement;
      const componentInstance = fixture.componentInstance;

      // Type a value that will trigger async validation error
      await userEvent.type(usernameInput, 'taken');

      // Fast-forward debounce and async validation times
      vi.advanceTimersByTime(100); // debounce
      vi.advanceTimersByTime(200); // async validation

      // Wait for validation to complete
      await waitForValidationCompletion(
        componentInstance.vestForm(),
        applicationReference,
      );

      // Should show validation error
      expectValidationState(componentInstance.vestForm(), {
        status: 'INVALID',
        pending: false,
        valid: false,
        hasErrors: true,
      });

      const formState = componentInstance.vestForm()?.formState();
      expect(formState?.errors?.['username']).toContain(
        'Username is already taken',
      );
    });

    it('should handle multiple rapid async validations correctly', async () => {
      const { fixture } = await render(AsyncValidationComponent);
      const applicationReference =
        fixture.debugElement.injector.get(ApplicationRef);
      const usernameInput = screen.getByLabelText(
        'Username',
      ) as HTMLInputElement;
      const componentInstance = fixture.componentInstance;

      // Simulate multiple rapid changes
      const values = ['a', 'ab', 'abc', 'valid'];

      for (const value of values) {
        await userEvent.clear(usernameInput);
        await userEvent.type(usernameInput, value);
        vi.advanceTimersByTime(50); // Partial debounce to simulate rapid typing
      }

      // Complete final debounce and validation
      vi.advanceTimersByTime(100); // Complete debounce
      vi.advanceTimersByTime(200); // Complete async validation

      await waitForValidationCompletion(
        componentInstance.vestForm(),
        applicationReference,
      );

      // Only the final validation should have completed
      expectValidationState(componentInstance.vestForm(), {
        status: 'VALID',
        pending: false,
      });

      expect(componentInstance.formValue().username).toBe('valid');
    });
  });

  describe('FormState Value Edge Cases', () => {
    it('should handle rapid value changes in formState.value', async () => {
      const { fixture } = await render(TestFormComponent);
      const applicationReference =
        fixture.debugElement.injector.get(ApplicationRef);
      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      const componentInstance = fixture.componentInstance;

      // Rapid sequential changes
      const values = ['a', 'ab', 'abc', 'abc@', 'abc@test', 'abc@test.com'];

      for (const value of values) {
        await userEvent.clear(emailInput);
        await userEvent.type(emailInput, value);
        vi.advanceTimersByTime(25); // Partial debounce between changes
      }

      // Complete final debounce
      vi.advanceTimersByTime(50);
      await applicationReference.whenStable();

      const formState = componentInstance.vestForm()?.formState();
      expect(formState?.value).toEqual({
        email: 'abc@test.com',
        password: '',
      });
      expect(formState?.status).toBe('INVALID');
      expect(formState?.valid).toBe(false);
    });

    it('should maintain formState.value during async validation', async () => {
      // Component with async validation
      @Component({
        imports: [vestForms, FormsModule],
        template: `
          <form
            scVestForm
            [vestSuite]="asyncSuite"
            [(formValue)]="formValue"
            #vestForm="scVestForm"
          >
            <label for="email">Email</label>
            <input id="email" name="email" [ngModel]="formValue().email" />
          </form>
        `,
      })
      class AsyncValidationComponent {
        formValue = signal({ email: '' });
        readonly vestForm = viewChild<FormDirective>('vestForm');

        asyncSuite = staticSuite((data: { email: string }, field?: string) => {
          only(field);
          vestTest('email', 'Async validation', async () => {
            await new Promise((resolve) => setTimeout(resolve, 50));
            enforce(data.email).matches(/^[^@]+@[^@]+\.[^@]+$/);
          });
        });
      }

      const { fixture } = await render(AsyncValidationComponent);
      const applicationReference =
        fixture.debugElement.injector.get(ApplicationRef);
      const emailInput = screen.getByLabelText('Email');
      const componentInstance = fixture.componentInstance;

      await userEvent.type(emailInput, 'test@example.com');

      // Even during async validation, formState.value should be current
      const formState = componentInstance.vestForm()?.formState();
      expect(formState?.value).toEqual({
        email: 'test@example.com',
      });

      // Fast-forward async validation
      vi.advanceTimersByTime(50);
      await applicationReference.whenStable();

      // After validation completes, value should still be correct
      const finalFormState = componentInstance.vestForm()?.formState();
      expect(finalFormState?.value).toEqual({
        email: 'test@example.com',
      });
    });

    it('should handle null formValue in formState', async () => {
      @Component({
        imports: [vestForms, FormsModule],
        template: `
          <form
            scVestForm
            [vestSuite]="vestSuite"
            [(formValue)]="formValue"
            #vestForm="scVestForm"
          >
            <input name="test" ngModel />
          </form>
        `,
      })
      class NullFormValueComponent {
        formValue = signal(null);
        vestSuite = staticSuite(vi.fn());
        readonly vestForm = viewChild<FormDirective>('vestForm');
      }

      const { fixture } = await render(NullFormValueComponent);
      const applicationReference =
        fixture.debugElement.injector.get(ApplicationRef);
      const componentInstance = fixture.componentInstance;

      await applicationReference.whenStable();

      const formState = componentInstance.vestForm()?.formState();
      // Should handle null gracefully
      expect(formState?.value).toBeDefined();
    });

    it('should preserve formState.value type safety with complex objects', async () => {
      @Component({
        imports: [vestForms, FormsModule],
        template: `
          <form
            scVestForm
            [vestSuite]="vestSuite"
            [(formValue)]="formValue"
            #vestForm="scVestForm"
          >
            <input name="user.name" [ngModel]="formValue().user?.name" />
            <input
              name="user.age"
              type="number"
              [ngModel]="formValue().user?.age"
            />
            <input name="tags" [ngModel]="formValue().tags?.join(',')" />
          </form>
        `,
      })
      class ComplexFormComponent {
        formValue = signal({
          user: { name: '', age: 0 },
          tags: [] as string[],
          metadata: { created: new Date() },
        });
        vestSuite = staticSuite(vi.fn());
        readonly vestForm = viewChild<FormDirective>('vestForm');
      }

      const { fixture } = await render(ComplexFormComponent);
      const applicationReference =
        fixture.debugElement.injector.get(ApplicationRef);
      const componentInstance = fixture.componentInstance;

      await applicationReference.whenStable();

      const formState = componentInstance.vestForm()?.formState();
      expect(formState?.value).toHaveProperty('user');
      expect(formState?.value).toHaveProperty('tags');
      expect(formState?.value).toHaveProperty('metadata');
      expect(typeof formState?.value).toBe('object');
    });
  });

  describe('FormCompatibleDeepRequired Integration Tests', () => {
    it('should initialize DateFormComponent with empty strings for Date fields', async () => {
      const { fixture } = await render(DateFormComponent);
      const applicationReference =
        fixture.debugElement.injector.get(ApplicationRef);
      const componentInstance = fixture.componentInstance;

      await applicationReference.whenStable();

      // Verify the form initializes with empty strings for Date fields
      const formState = componentInstance.vestForm()?.formState();
      expect(formState?.value).toEqual({
        title: '',
        startDate: '',
        endDate: '',
        details: {
          createdAt: '',
          category: '',
          metadata: {
            lastUpdated: '',
            version: 0,
          },
        },
      });

      // Verify initial form state
      expect(formState?.status).toBe('INVALID'); // All required fields are empty
      expect(formState?.valid).toBe(false);
      expect(formState?.dirty).toBe(false);
    });

    it('should handle Date field validation with string inputs', async () => {
      const { fixture } = await render(DateFormComponent);
      const applicationReference =
        fixture.debugElement.injector.get(ApplicationRef);
      const componentInstance = fixture.componentInstance;

      const titleInput = screen.getByLabelText(
        'Event Title',
      ) as HTMLInputElement;
      const startDateInput = screen.getByLabelText(
        'Start Date',
      ) as HTMLInputElement;
      const categoryInput = screen.getByLabelText(
        'Category',
      ) as HTMLInputElement;

      // Fill in valid form data
      await userEvent.fill(titleInput, 'Tech Conference');
      await userEvent.fill(startDateInput, '2024-12-01');
      await userEvent.fill(categoryInput, 'Technology');

      vi.advanceTimersByTime(50); // Fast-forward debounce
      await waitForValidationCompletion(
        componentInstance.vestForm(),
        applicationReference,
      );

      // Should show partial validation success
      const formState = componentInstance.vestForm()?.formState();
      const formValue = formState?.value as FormCompatibleDeepRequired<EventFormModel>;
      expect(formValue.title).toBe('Tech Conference');
      expect(formValue.startDate).toBe('2024-12-01');
      expect(formValue.details.category).toBe('Technology');

      // Form should still be invalid because endDate and createdAt are required
      expect(formState?.status).toBe('INVALID');
      expect(formState?.errors).toBeDefined();
    });

    it('should validate Date fields properly when they contain string values', async () => {
      const { fixture } = await render(DateFormComponent);
      const applicationReference =
        fixture.debugElement.injector.get(ApplicationRef);
      const componentInstance = fixture.componentInstance;

      const startDateInput = screen.getByLabelText(
        'Start Date',
      ) as HTMLInputElement;

      // Test with invalid date string
      await userEvent.fill(startDateInput, 'invalid-date');
      vi.advanceTimersByTime(50);
      await waitForValidationCompletion(
        componentInstance.vestForm(),
        applicationReference,
      );

      const formState = componentInstance.vestForm()?.formState();
      expect(formState?.errors?.['startDate']).toContain(
        'Start date must be valid',
      );

      // Test with valid date string
      await userEvent.clear(startDateInput);
      await userEvent.fill(startDateInput, '2024-12-01');
      vi.advanceTimersByTime(50);
      await waitForValidationCompletion(
        componentInstance.vestForm(),
        applicationReference,
      );

      const updatedFormState = componentInstance.vestForm()?.formState();
      expect(updatedFormState?.errors?.['startDate']).toBeUndefined();
    });

    it('should allow setting actual Date objects programmatically', async () => {
      const { fixture } = await render(DateFormComponent);
      const applicationReference =
        fixture.debugElement.injector.get(ApplicationRef);
      const componentInstance = fixture.componentInstance;

      // Use the component method to set actual Date objects
      componentInstance.setActualDates();

      fixture.detectChanges();
      await applicationReference.whenStable();

      const formState = componentInstance.vestForm()?.formState();
      const formValue = formState?.value as FormCompatibleDeepRequired<EventFormModel>;

      // Verify Date objects are properly set
      expect(formValue.title).toBe('Conference 2024');
      expect(formValue.startDate).toBeInstanceOf(Date);
      expect(formValue.endDate).toBeInstanceOf(Date);
      expect(formValue.details.createdAt).toBeInstanceOf(Date);
      expect(formValue.details.category).toBe('Technology');
      expect(formValue.details.metadata.lastUpdated).toBeInstanceOf(
        Date,
      );

      // Verify the form becomes valid with complete data
      vi.advanceTimersByTime(50);
      await waitForValidationCompletion(
        componentInstance.vestForm(),
        applicationReference,
      );

      const validatedFormState = componentInstance.vestForm()?.formState();
      expect(validatedFormState?.status).toBe('VALID');
      expect(validatedFormState?.valid).toBe(true);
    });

    it('should handle mixed Date and string values in nested objects', async () => {
      const { fixture } = await render(DateFormComponent);
      const applicationReference =
        fixture.debugElement.injector.get(ApplicationRef);
      const componentInstance = fixture.componentInstance;

      // Set mixed Date/string values
      componentInstance.formValue.set({
        title: 'Mixed Date Form',
        startDate: new Date('2024-01-01'), // Date object
        endDate: '2024-01-02', // String
        details: {
          createdAt: '', // Empty string (invalid)
          category: 'Mixed',
          metadata: {
            lastUpdated: new Date(), // Date object
            version: 1,
          },
        },
      } as FormCompatibleDeepRequired<EventFormModel>);

      fixture.detectChanges();
      vi.advanceTimersByTime(50);
      await waitForValidationCompletion(
        componentInstance.vestForm(),
        applicationReference,
      );

      const formState = componentInstance.vestForm()?.formState();

      // Verify mixed types are handled correctly
      const typedFormValue = formState?.value as FormCompatibleDeepRequired<EventFormModel>;
      expect(typedFormValue.startDate).toBeInstanceOf(Date);
      expect(typeof typedFormValue.endDate).toBe('string');
      expect(typedFormValue.details.metadata.lastUpdated).toBeInstanceOf(Date);

      // Should be invalid due to empty createdAt
      expect(formState?.status).toBe('INVALID');
      expect(formState?.errors?.['details.createdAt']).toContain(
        'Created date is required',
      );
    });

    it('should demonstrate type safety benefits of FormCompatibleDeepRequired', async () => {
      const { fixture } = await render(DateFormComponent);
      const componentInstance = fixture.componentInstance;

      // This compilation test shows that FormCompatibleDeepRequired allows:

      // ✅ Empty string initialization for Date fields
      const emptyStringInit: FormCompatibleDeepRequired<EventFormModel> = {
        title: '',
        startDate: '', // Valid: string allowed for Date field
        endDate: '',
        details: {
          createdAt: '', // Valid: string allowed for nested Date field
          category: '',
          metadata: {
            lastUpdated: '', // Valid: string allowed for deeply nested Date field
            version: 0,
          },
        },
      };

      // ✅ Actual Date object assignment
      const dateObjectInit: FormCompatibleDeepRequired<EventFormModel> = {
        title: 'Test Event',
        startDate: new Date(), // Valid: Date still allowed
        endDate: new Date(),
        details: {
          createdAt: new Date(), // Valid: Date still allowed
          category: 'Test',
          metadata: {
            lastUpdated: new Date(), // Valid: Date still allowed
            version: 1,
          },
        },
      };

      // Set both to verify they work
      componentInstance.formValue.set(emptyStringInit);
      expect(componentInstance.formValue().startDate).toBe('');

      componentInstance.formValue.set(dateObjectInit);
      expect(componentInstance.formValue().startDate).toBeInstanceOf(Date);
    });

    it('should work with complex nested Date validation scenarios', async () => {
      const { fixture } = await render(DateFormComponent);
      const applicationReference =
        fixture.debugElement.injector.get(ApplicationRef);
      const componentInstance = fixture.componentInstance;

      const titleInput = screen.getByLabelText(
        'Event Title',
      ) as HTMLInputElement;
      const startDateInput = screen.getByLabelText(
        'Start Date',
      ) as HTMLInputElement;
      const endDateInput = screen.getByLabelText(
        'End Date',
      ) as HTMLInputElement;
      const createdAtInput = screen.getByLabelText(
        'Created At',
      ) as HTMLInputElement;
      const categoryInput = screen.getByLabelText(
        'Category',
      ) as HTMLInputElement;
      const lastUpdatedInput = screen.getByLabelText(
        'Last Updated',
      ) as HTMLInputElement;

      // Fill all fields with valid data
      await userEvent.fill(titleInput, 'Complete Event');
      await userEvent.fill(startDateInput, '2024-06-01');
      await userEvent.fill(endDateInput, '2024-06-03');
      await userEvent.fill(createdAtInput, '2024-01-01T10:00');
      await userEvent.fill(categoryInput, 'Conference');
      await userEvent.fill(lastUpdatedInput, '2024-05-01T14:30');

      vi.advanceTimersByTime(50);
      await waitForValidationCompletion(
        componentInstance.vestForm(),
        applicationReference,
      );

      const formState = componentInstance.vestForm()?.formState();

      // All Date fields should accept string values from date inputs
      expect(formState?.value).toEqual({
        title: 'Complete Event',
        startDate: '2024-06-01',
        endDate: '2024-06-03',
        details: {
          createdAt: '2024-01-01T10:00',
          category: 'Conference',
          metadata: {
            lastUpdated: '2024-05-01T14:30',
            version: 0, // Default from initial state
          },
        },
      });

      // Form should be valid with all required fields filled
      expect(formState?.status).toBe('VALID');
      expect(formState?.valid).toBe(true);
      expect(formState?.errors).toEqual({});
    });
  });
});
