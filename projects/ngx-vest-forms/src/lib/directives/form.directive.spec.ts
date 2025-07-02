import { JsonPipe } from '@angular/common';
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
import { afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest';
import { ngxVestForms } from '../exports';
import { NgxFormCompatibleDeepRequired } from '../utils/deep-required';

import { NgxFormDirective } from './form.directive';
import { NgxValidationOptions } from './validation-options';

/**
 * Enhanced helper function for zoneless Angular validation completion
 * Uses ApplicationRef.whenStable() instead of zone-dependent code
 */
async function waitForValidationCompletion(
  formDirective: NgxFormDirective | undefined,
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
  formDirective: NgxFormDirective | undefined,
  expected: {
    status?: string;
    valid?: boolean;
    invalid?: boolean;
    pending?: boolean;
    hasErrors?: boolean; // General check for any errors
    hasRootErrors?: boolean; // Check for root errors
    hasFieldErrors?: boolean; // Check for field-specific errors
    hasRootWarnings?: boolean; // Check for root warnings
    hasFieldWarnings?: boolean; // Check for field-specific warnings
  },
) {
  if (!formDirective) {
    throw new Error('NgxFormDirective is not available');
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

  // Updated error and warning checks
  if (expected.hasErrors !== undefined) {
    const fieldErrors =
      formState.errors && Object.keys(formState.errors).length > 0;
    const rootErrors =
      formState.root?.errors && formState.root.errors.length > 0;
    const rootInternalError = !!formState.root?.internalError;
    expect(fieldErrors || rootErrors || rootInternalError).toBe(
      expected.hasErrors,
    );
  }
  if (expected.hasRootErrors !== undefined) {
    const rootErrors =
      formState.root?.errors && formState.root.errors.length > 0;
    const rootInternalError = !!formState.root?.internalError;
    expect(rootErrors || rootInternalError).toBe(expected.hasRootErrors);
  }
  if (expected.hasFieldErrors !== undefined) {
    const fieldErrors =
      formState.errors && Object.keys(formState.errors).length > 0;
    expect(fieldErrors).toBe(expected.hasFieldErrors);
  }
  if (expected.hasRootWarnings !== undefined) {
    const rootWarnings =
      formState.root?.warnings && formState.root.warnings.length > 0;
    expect(rootWarnings).toBe(expected.hasRootWarnings);
  }
  if (expected.hasFieldWarnings !== undefined) {
    const fieldWarnings =
      formState.warnings && Object.keys(formState.warnings).length > 0;
    expect(fieldWarnings).toBe(expected.hasFieldWarnings);
  }
}

// Test component that uses NgxFormDirective with proper unidirectional flow
@Component({
  imports: [ngxVestForms, FormsModule, JsonPipe],
  template: `
    <form
      ngxVestForm
      [vestSuite]="vestSuite"
      [(formValue)]="formValue"
      [validationOptions]="validationOptions"
      [validationConfig]="validationConfig"
      #vestForm="ngxVestForm"
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
      <div data-testid="form-root-errors">
        {{ vestForm.formState().root?.errors | json }}
      </div>
      <div data-testid="form-root-warnings">
        {{ vestForm.formState().root?.warnings | json }}
      </div>
      <div data-testid="form-field-errors">
        {{ vestForm.formState().errors | json }}
      </div>
      <div data-testid="form-field-warnings">
        {{ vestForm.formState().warnings | json }}
      </div>
    </form>
  `,
})
class TestFormComponent {
  readonly vestForm = viewChild<NgxFormDirective>('vestForm');
  formValue: WritableSignal<{ email: string; password: string } | null> =
    signal({
      email: '',
      password: '',
    });

  validationOptions: NgxValidationOptions = { debounceTime: 50 }; // Reduced for testing
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
  imports: [ngxVestForms, FormsModule, JsonPipe],
  template: `
    <form
      ngxVestForm
      [vestSuite]="asyncVestSuite"
      [(formValue)]="formValue"
      [validationOptions]="validationOptions"
      #vestForm="ngxVestForm"
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
      <div data-testid="form-root-errors">
        {{ vestForm.formState().root?.errors | json }}
      </div>
      <div data-testid="form-field-errors">
        {{ vestForm.formState().errors | json }}
      </div>
    </form>
  `,
})
class AsyncValidationComponent {
  readonly vestForm = viewChild<NgxFormDirective>('vestForm');

  formValue = signal({ username: '' });
  validationOptions: NgxValidationOptions = { debounceTime: 100 }; // Realistic debounce for testing

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
 * DateFormComponent demonstrates NgxFormCompatibleDeepRequired<T> utility type
 * with actual Date fields to show form initialization compatibility
 */
@Component({
  selector: 'ngx-date-form',
  imports: [FormsModule, ngxVestForms, JsonPipe],
  template: `
    <form
      ngxVestForm
      [vestSuite]="dateVestSuite"
      [(formValue)]="formValue"
      [validationOptions]="validationOptions"
      #vestForm="ngxVestForm"
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
      <div data-testid="form-warnings">
        {{ vestForm.formState().warnings | json }}
      </div>
      <div data-testid="form-root-issues">
        Root Errors: {{ vestForm.formState().root?.errors | json }} Root
        Warnings: {{ vestForm.formState().root?.warnings | json }} Root
        Internal: {{ vestForm.formState().root?.internalError }}
      </div>
    </form>
  `,
})
class DateFormComponent {
  readonly vestForm = viewChild<NgxFormDirective>('vestForm');

  // Use NgxFormCompatibleDeepRequired to make all fields required and Date fields compatible with strings
  formValue = signal<NgxFormCompatibleDeepRequired<EventFormModel>>({
    title: '',
    startDate: '', // ✅ Should work with NgxFormCompatibleDeepRequired
    endDate: '',
    details: {
      createdAt: '', // ✅ Should work with NgxFormCompatibleDeepRequired
      category: '',
      metadata: {
        lastUpdated: '', // ✅ Should work with NgxFormCompatibleDeepRequired
        version: 0,
      },
    },
  } satisfies NgxFormCompatibleDeepRequired<EventFormModel>); // Type assertion to work around TS strictness

  validationOptions: NgxValidationOptions = { debounceTime: 50 };

  dateVestSuite = staticSuite(
    (
      data: NgxFormCompatibleDeepRequired<EventFormModel> | undefined,
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
        } satisfies NgxFormCompatibleDeepRequired<EventFormModel>);
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

      // Use enhanced validation state expectations
      expectValidationState(componentInstance.vestForm(), {
        status: 'VALID',
        valid: true,
        invalid: false,
        pending: false,
      });

      // Verify form values are synchronized
      const formState = componentInstance.vestForm()?.formState();
      expect(formState?.value).toEqual({
        email: 'test@example.com',
        password: 'password123',
      });
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

      const componentInstance = fixture.componentInstance;
      const formState = componentInstance.vestForm()?.formState();
      expect((formState?.value as { email: string })?.email).toBe(
        'test@example.com',
      );
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
});
