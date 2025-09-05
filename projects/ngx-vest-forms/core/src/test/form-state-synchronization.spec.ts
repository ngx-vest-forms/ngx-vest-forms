import { JsonPipe } from '@angular/common';
import { ApplicationRef, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@vitest/browser/context';
import { describe, expect, it } from 'vitest';
import { NgxFormCoreDirective } from '../lib/directives/form-core.directive';

type TestModel = {
  name: string;
  email: string;
  age: number;
};

@Component({
  selector: 'ngx-test-sync-form',
  template: `
    <form ngxVestFormCore [(formValue)]="model" #form="ngxVestFormCore">
      <input name="name" [(ngModel)]="model.name" data-testid="name-input" />
      <input name="email" [(ngModel)]="model.email" data-testid="email-input" />
      <input
        name="age"
        type="number"
        [(ngModel)]="model.age"
        data-testid="age-input"
      />
      <!-- Expose form state for testing -->
      <div data-testid="form-state-value">
        {{ form.formState().value | json }}
      </div>
      <div data-testid="form-state-name">
        {{ form.formState().value?.name || 'empty' }}
      </div>
    </form>
  `,
  imports: [FormsModule, NgxFormCoreDirective, JsonPipe],
})
class TestSyncFormComponent {
  model: TestModel = {
    name: '',
    email: '',
    age: 0,
  };
}

describe('NgxFormCoreDirective - Form State Synchronization', () => {
  describe('Form Value Synchronization', () => {
    it('should immediately reflect control value in formState after input change', async () => {
      // Arrange
      await render(TestSyncFormComponent);
      const nameInput = screen.getByTestId('name-input');

      // Act - Type into input
      await userEvent.type(nameInput, 'John Doe');

      // Wait for Angular to process changes
      await TestBed.inject(ApplicationRef).whenStable();

      // Assert - formState should immediately reflect the change
      const formStateName = screen.getByTestId('form-state-name');
      expect(formStateName).toHaveTextContent('John Doe');
    });

    it('should handle rapid sequential updates without losing synchronization', async () => {
      // Arrange
      await render(TestSyncFormComponent);
      const nameInput = screen.getByTestId('name-input');

      // Act - Rapid updates
      for (let index = 0; index < 10; index++) {
        await userEvent.clear(nameInput);
        await userEvent.type(nameInput, `User${index}`);
      }

      await TestBed.inject(ApplicationRef).whenStable();

      // Assert - Should have the final value
      const formStateName = screen.getByTestId('form-state-name');
      expect(formStateName).toHaveTextContent('User9');
    });

    it('should synchronize multiple fields simultaneously', async () => {
      // Arrange
      await render(TestSyncFormComponent);
      const nameInput = screen.getByTestId('name-input');
      const emailInput = screen.getByTestId('email-input');
      const ageInput = screen.getByTestId('age-input');

      // Act - Update multiple fields
      await userEvent.type(nameInput, 'John Doe');
      await userEvent.type(emailInput, 'john@example.com');
      await userEvent.clear(ageInput);
      await userEvent.type(ageInput, '25');

      await TestBed.inject(ApplicationRef).whenStable();

      // Assert - All fields should be synchronized
      const formStateValue = screen.getByTestId('form-state-value');
      const formStateJson = formStateValue.textContent;
      expect(formStateJson).toContain('"name": "John Doe"');
      expect(formStateJson).toContain('"email": "john@example.com"');
      expect(formStateJson).toContain('"age": 25');
    });

    it('should handle empty/null states correctly', async () => {
      // Arrange
      await render(TestSyncFormComponent);

      await TestBed.inject(ApplicationRef).whenStable();

      // Assert - Initial empty state should be handled correctly
      const formStateValue = screen.getByTestId('form-state-value');
      const formStateJson = formStateValue.textContent;
      expect(formStateJson).toContain('"name": ""');
      expect(formStateJson).toContain('"email": ""');
      expect(formStateJson).toContain('"age": 0');
    });

    it('should not have stale values in computed formState', async () => {
      // This is the specific bug we're trying to fix
      // Arrange
      await render(TestSyncFormComponent);
      const nameInput = screen.getByTestId('name-input');

      // Act - Update input and immediately read formState
      await userEvent.type(nameInput, 'Fresh Value');

      await TestBed.inject(ApplicationRef).whenStable();

      // Assert - formState should not contain stale values
      const formStateName = screen.getByTestId('form-state-name');
      expect(formStateName).toHaveTextContent('Fresh Value');

      // Verify in JSON output as well
      const formStateValue = screen.getByTestId('form-state-value');
      expect(formStateValue.textContent).toContain('"name": "Fresh Value"');
    });
  });

  describe('Timing and Edge Cases', () => {
    it('should handle burst form updates deterministically', async () => {
      // Arrange
      await render(TestSyncFormComponent);
      const nameInput = screen.getByTestId('name-input');

      // Act - Simulate rapid user typing
      for (let index = 0; index < 20; index++) {
        await userEvent.clear(nameInput);
        await userEvent.type(nameInput, `Rapid${index}`);
      }

      await TestBed.inject(ApplicationRef).whenStable();

      // Assert - Should have the final value, no intermediate states
      const formStateName = screen.getByTestId('form-state-name');
      expect(formStateName).toHaveTextContent('Rapid19');
    });

    it('should maintain synchronization across microtasks', async () => {
      // Arrange
      await render(TestSyncFormComponent);
      const nameInput = screen.getByTestId('name-input');

      // Act - Update and check in different microtasks
      await userEvent.type(nameInput, 'Microtask Test');

      await TestBed.inject(ApplicationRef).whenStable();

      // Schedule check in next microtask
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert - Should still be synchronized
      const formStateName = screen.getByTestId('form-state-name');
      expect(formStateName).toHaveTextContent('Microtask Test');
    });
  });
});
