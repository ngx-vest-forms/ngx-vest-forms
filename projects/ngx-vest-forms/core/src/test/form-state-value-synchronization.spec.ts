import { JsonPipe } from '@angular/common';
import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@vitest/browser/context';
import { enforce, only, staticSuite, test } from 'vest';
import { beforeEach, describe, expect, it } from 'vitest';
import { ngxVestForms } from '../lib/exports';

/**
 * Comprehensive unit tests for form state value synchronization bug.
 *
 * Bug Report: https://github.com/your-org/ngx-vest-forms/issues/XXX
 * The formState().value should immediately reflect user input in form controls,
 * but was showing stale/empty values even when validation and other state worked correctly.
 */

type TestModel = {
  name: string;
  email: string;
  age: number;
  bio: string;
  preferences: {
    newsletter: boolean;
    notifications: boolean;
  };
};

// Utility functions for testing
function getFormStateValue(): TestModel {
  const formStateValueJson = screen.getByTestId('form-state-value-json');
  return JSON.parse(formStateValueJson.textContent ?? '{}') as TestModel;
}

function getModelState(): TestModel {
  const modelStateJson = screen.getByTestId('model-state-json');
  return JSON.parse(modelStateJson.textContent ?? '{}') as TestModel;
}

function getFormValid(): boolean {
  const formValidElement = screen.getByTestId('form-valid');
  return JSON.parse(formValidElement.textContent ?? 'false') as boolean;
}

const testSuite = staticSuite(
  (data: Partial<TestModel> = {}, field?: string) => {
    only(field);

    test('name', 'Name is required', () => {
      enforce(data.name).isNotEmpty();
    });

    test('email', 'Email is required and must be valid', () => {
      enforce(data.email)
        .isNotEmpty()
        .matches(/^[^@]+@[^@]+\.[^@]+$/);
    });

    test('age', 'Age must be at least 1', () => {
      enforce(data.age).greaterThan(0);
    });

    test('bio', 'Bio is required', () => {
      enforce(data.bio).isNotEmpty();
    });
  },
);

@Component({
  imports: [ngxVestForms, JsonPipe],
  template: `
    <form
      ngxVestForm
      [vestSuite]="suite"
      [(formValue)]="model"
      #vestForm="ngxVestForm"
    >
      <input
        name="name"
        [ngModel]="model().name"
        data-testid="name-input"
        placeholder="Enter your name"
      />

      <input
        name="email"
        type="email"
        [ngModel]="model().email"
        data-testid="email-input"
        placeholder="Enter your email"
      />

      <input
        name="age"
        type="number"
        [ngModel]="model().age"
        data-testid="age-input"
        placeholder="Enter your age"
      />

      <textarea
        name="bio"
        [ngModel]="model().bio"
        data-testid="bio-input"
        placeholder="Tell us about yourself"
      ></textarea>

      <fieldset ngModelGroup="preferences">
        <legend>Preferences</legend>
        <label>
          <input
            name="newsletter"
            type="checkbox"
            [ngModel]="model().preferences.newsletter"
            data-testid="newsletter-checkbox"
          />
          Subscribe to newsletter
        </label>

        <label>
          <input
            name="notifications"
            type="checkbox"
            [ngModel]="model().preferences.notifications"
            data-testid="notifications-checkbox"
          />
          Enable notifications
        </label>
      </fieldset>

      <button
        type="submit"
        [disabled]="!vestForm.formState().valid || vestForm.formState().pending"
        data-testid="submit-button"
      >
        Submit
      </button>

      <!-- Debug displays for testing -->
      <div data-testid="form-state-json" style="display: none;">
        {{ vestForm.formState() | json }}
      </div>

      <div data-testid="form-state-value-json" style="display: none;">
        {{ vestForm.formState().value | json }}
      </div>

      <div data-testid="model-state-json" style="display: none;">
        {{ model() | json }}
      </div>

      <div data-testid="form-valid" style="display: none;">
        {{ vestForm.formState().valid }}
      </div>

      <div data-testid="form-dirty" style="display: none;">
        {{ vestForm.formState().dirty }}
      </div>
    </form>
  `,
})
class TestFormComponent {
  readonly model = signal<TestModel>({
    name: '',
    email: '',
    age: 0,
    bio: '',
    preferences: {
      newsletter: false,
      notifications: false,
    },
  });

  readonly suite = testSuite;
}

describe('Form State Value Synchronization', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [TestFormComponent],
    });
  });

  describe('Immediate Value Synchronization', () => {
    it('should immediately reflect typed string values in formState.value', async () => {
      // Arrange
      await render(TestFormComponent);
      const nameInput = screen.getByTestId('name-input') as HTMLInputElement;

      // Act - type a value
      await userEvent.type(nameInput, 'John Doe');

      // Ensure Angular has processed the changes
      await TestBed.inject(ApplicationRef).whenStable();

      // Assert - formState.value should immediately reflect the typed value
      const formStateValue = getFormStateValue();

      expect(formStateValue.name).toBe('John Doe');

      // Verify the model is also synchronized
      const modelState = getModelState();

      expect(modelState.name).toBe('John Doe');
    });

    it('should immediately reflect typed email values in formState.value', async () => {
      // Arrange
      await render(TestFormComponent);
      const emailInput = screen.getByTestId('email-input') as HTMLInputElement;

      // Act
      await userEvent.type(emailInput, 'john.doe@example.com');
      await TestBed.inject(ApplicationRef).whenStable();

      // Assert
      const formStateValue = getFormStateValue();

      expect(formStateValue.email).toBe('john.doe@example.com');
    });

    it('should immediately reflect typed number values in formState.value', async () => {
      // Arrange
      await render(TestFormComponent);
      const ageInput = screen.getByTestId('age-input') as HTMLInputElement;

      // Act
      await userEvent.clear(ageInput);
      await userEvent.type(ageInput, '25');
      await TestBed.inject(ApplicationRef).whenStable();

      // Assert
      const formStateValue = getFormStateValue();

      expect(formStateValue.age).toBe(25);
    });

    it('should immediately reflect typed textarea values in formState.value', async () => {
      // Arrange
      await render(TestFormComponent);
      const bioInput = screen.getByTestId('bio-input') as HTMLTextAreaElement;

      // Act
      await userEvent.type(
        bioInput,
        'Software developer passionate about web tech',
      );
      await TestBed.inject(ApplicationRef).whenStable();

      // Assert
      const formStateValue = getFormStateValue();

      expect(formStateValue.bio).toBe(
        'Software developer passionate about web tech',
      );
    });

    it('should immediately reflect checkbox state changes in formState.value', async () => {
      // Arrange
      await render(TestFormComponent);
      const newsletterCheckbox = screen.getByTestId(
        'newsletter-checkbox',
      ) as HTMLInputElement;

      // Act
      await userEvent.click(newsletterCheckbox);
      await TestBed.inject(ApplicationRef).whenStable();

      // Assert
      const formStateValue = getFormStateValue();

      expect(formStateValue.preferences.newsletter).toBe(true);
    });
  });

  describe('Multiple Field Updates', () => {
    it('should synchronize all field values correctly when filled sequentially', async () => {
      // Arrange
      await render(TestFormComponent);
      const nameInput = screen.getByTestId('name-input') as HTMLInputElement;
      const emailInput = screen.getByTestId('email-input') as HTMLInputElement;
      const ageInput = screen.getByTestId('age-input') as HTMLInputElement;
      const bioInput = screen.getByTestId('bio-input') as HTMLTextAreaElement;
      const newsletterCheckbox = screen.getByTestId(
        'newsletter-checkbox',
      ) as HTMLInputElement;

      // Act - fill all fields sequentially
      await userEvent.type(nameInput, 'John Doe');
      await userEvent.type(emailInput, 'john.doe@example.com');
      await userEvent.clear(ageInput);
      await userEvent.type(ageInput, '25');
      await userEvent.type(bioInput, 'Software developer');
      await userEvent.click(newsletterCheckbox);

      await TestBed.inject(ApplicationRef).whenStable();

      // Assert - all values should be synchronized
      const formStateValue = getFormStateValue();

      expect(formStateValue).toEqual({
        name: 'John Doe',
        email: 'john.doe@example.com',
        age: 25,
        bio: 'Software developer',
        preferences: {
          newsletter: true,
          notifications: false,
        },
      });
    });

    it('should maintain synchronization during rapid consecutive updates', async () => {
      // Arrange
      await render(TestFormComponent);
      const nameInput = screen.getByTestId('name-input') as HTMLInputElement;

      // Act - rapid typing simulation
      await userEvent.type(nameInput, 'A');
      await userEvent.type(nameInput, 'l');
      await userEvent.type(nameInput, 'i');
      await userEvent.type(nameInput, 'c');
      await userEvent.type(nameInput, 'e');

      await TestBed.inject(ApplicationRef).whenStable();

      // Assert
      const formStateValue = getFormStateValue();

      expect(formStateValue.name).toBe('Alice');
    });
  });

  describe('Form State Validation Integration', () => {
    it('should show form as invalid when required fields are empty', async () => {
      // Arrange
      await render(TestFormComponent);

      await TestBed.inject(ApplicationRef).whenStable();

      // Assert - form should be invalid with empty required fields
      const isFormValid = getFormValid();

      expect(isFormValid).toBe(false);

      // Submit button should be disabled
      const submitButton = screen.getByTestId(
        'submit-button',
      ) as HTMLButtonElement;
      expect(submitButton.disabled).toBe(true);
    });

    it('should show form as valid when all required fields are filled correctly', async () => {
      // Arrange
      await render(TestFormComponent);
      const nameInput = screen.getByTestId('name-input') as HTMLInputElement;
      const emailInput = screen.getByTestId('email-input') as HTMLInputElement;
      const ageInput = screen.getByTestId('age-input') as HTMLInputElement;
      const bioInput = screen.getByTestId('bio-input') as HTMLTextAreaElement;

      // Act - fill all required fields with valid data
      await userEvent.type(nameInput, 'John Doe');
      await userEvent.type(emailInput, 'john.doe@example.com');
      await userEvent.clear(ageInput);
      await userEvent.type(ageInput, '25');
      await userEvent.type(bioInput, 'Software developer');

      await TestBed.inject(ApplicationRef).whenStable();

      // Assert - form should be valid
      const isFormValid = getFormValid();

      expect(isFormValid).toBe(true);

      // Submit button should be enabled
      const submitButton = screen.getByTestId(
        'submit-button',
      ) as HTMLButtonElement;
      expect(submitButton.disabled).toBe(false);

      // FormState.value should contain all the entered data
      const formStateValue = getFormStateValue();

      expect(formStateValue).toEqual({
        name: 'John Doe',
        email: 'john.doe@example.com',
        age: 25,
        bio: 'Software developer',
        preferences: {
          newsletter: false,
          notifications: false,
        },
      });
    });
  });

  describe('Edge Cases and Race Conditions', () => {
    it('should handle burst updates without losing final value', async () => {
      // Arrange
      await render(TestFormComponent);
      const nameInput = screen.getByTestId('name-input') as HTMLInputElement;

      // Act - simulate burst of rapid updates
      for (let index = 0; index < 10; index++) {
        await userEvent.clear(nameInput);
        await userEvent.type(nameInput, `User${index}`);
      }

      await TestBed.inject(ApplicationRef).whenStable();

      // Assert - should have the final value
      const formStateValue = getFormStateValue();

      expect(formStateValue.name).toBe('User9');
    });

    it('should handle form reset correctly', async () => {
      // Arrange
      await render(TestFormComponent);
      const nameInput = screen.getByTestId('name-input') as HTMLInputElement;
      const emailInput = screen.getByTestId('email-input') as HTMLInputElement;

      // Fill form with data
      await userEvent.type(nameInput, 'John Doe');
      await userEvent.type(emailInput, 'john@example.com');
      await TestBed.inject(ApplicationRef).whenStable();

      // Verify data is there
      let formStateValue = getFormStateValue();
      expect(formStateValue.name).toBe('John Doe');
      expect(formStateValue.email).toBe('john@example.com');

      // Act - clear the form
      await userEvent.clear(nameInput);
      await userEvent.clear(emailInput);
      await TestBed.inject(ApplicationRef).whenStable();

      // Assert - form state should reflect cleared values
      formStateValue = getFormStateValue();

      expect(formStateValue.name).toBe('');
      expect(formStateValue.email).toBe('');
    });

    it('should maintain consistency between formState.value and model', async () => {
      // Arrange
      await render(TestFormComponent);
      const nameInput = screen.getByTestId('name-input') as HTMLInputElement;

      // Act
      await userEvent.type(nameInput, 'Consistency Test');
      await TestBed.inject(ApplicationRef).whenStable();

      // Assert - both formState.value and model should have the same value
      const formStateValue = getFormStateValue();
      const modelState = getModelState();

      expect(formStateValue.name).toBe('Consistency Test');
      expect(modelState.name).toBe('Consistency Test');
      expect(formStateValue.name).toBe(modelState.name);
    });

    it('should handle mixed input types correctly', async () => {
      // Arrange
      await render(TestFormComponent);
      const nameInput = screen.getByTestId('name-input') as HTMLInputElement;
      const ageInput = screen.getByTestId('age-input') as HTMLInputElement;
      const newsletterCheckbox = screen.getByTestId(
        'newsletter-checkbox',
      ) as HTMLInputElement;

      // Act - mix different input types
      await userEvent.type(nameInput, 'Mixed Input Test');
      await userEvent.clear(ageInput);
      await userEvent.type(ageInput, '30');
      await userEvent.click(newsletterCheckbox);

      await TestBed.inject(ApplicationRef).whenStable();

      // Assert - all different types should be correctly reflected
      const formStateValue = getFormStateValue();

      expect(formStateValue.name).toBe('Mixed Input Test');
      expect(formStateValue.age).toBe(30);
      expect(formStateValue.preferences.newsletter).toBe(true);
    });
  });

  describe('Real-world Simulation', () => {
    it('should reproduce the exact bug scenario from the bug report', async () => {
      // Arrange - this reproduces the exact scenario from the bug report
      await render(TestFormComponent);
      const nameInput = screen.getByTestId('name-input') as HTMLInputElement;
      const emailInput = screen.getByTestId('email-input') as HTMLInputElement;
      const ageInput = screen.getByTestId('age-input') as HTMLInputElement;
      const bioInput = screen.getByTestId('bio-input') as HTMLTextAreaElement;

      // Act - reproduce the exact sequence from the bug report
      await userEvent.type(nameInput, 'John Doe');
      await userEvent.type(emailInput, 'john.doe@example.com');
      await userEvent.clear(ageInput);
      await userEvent.type(ageInput, '25');
      await userEvent.type(
        bioInput,
        'Software developer with passion for Angular',
      );

      await TestBed.inject(ApplicationRef).whenStable();

      // Assert - this should pass if the bug is fixed
      const formStateValue = getFormStateValue();

      // These assertions should all pass if the linkedSignal fix works correctly
      expect(formStateValue.name).toBe('John Doe'); // Bug: was showing ""
      expect(formStateValue.email).toBe('john.doe@example.com'); // Bug: was showing ""
      expect(formStateValue.age).toBe(25); // Bug: was showing 0
      expect(formStateValue.bio).toBe(
        'Software developer with passion for Angular',
      ); // Bug: was showing ""

      // Form validation should also work correctly
      const isFormValid = getFormValid();
      expect(isFormValid).toBe(true);

      // Submit button should be enabled
      const submitButton = screen.getByTestId(
        'submit-button',
      ) as HTMLButtonElement;
      expect(submitButton.disabled).toBe(false);
    });
  });
});
