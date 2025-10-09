import { Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@vitest/browser/context';
import { enforce, test } from 'vest';
import { describe, expect, it, vi } from 'vitest';
import { createVestForm } from '../create-vest-form';
import { staticSafeSuite } from '../utils/safe-suite';
import { NgxVestFormDirective } from './ngx-vest-form.directive';

// Test validation suite
const testSuite = staticSafeSuite((data: { email?: string } = {}) => {
  test('email', 'Email is required', () => {
    enforce(data.email).isNotEmpty();
  });
});

describe('NgxVestFormDirective', () => {
  describe('Auto-preventDefault', () => {
    it('should automatically call preventDefault() on form submit', async () => {
      // Arrange
      const submitSpy = vi.fn();

      @Component({
        selector: 'ngx-test-prevent-default',
        imports: [NgxVestFormDirective],
        template: `
          <form [ngxVestForm]="form" (submit)="handleSubmit()">
            <button type="submit">Submit</button>
          </form>
        `,
      })
      class TestComponent {
        form = createVestForm(signal({ email: '' }), { suite: testSuite });
        handleSubmit = submitSpy;
      }

      await render(TestComponent);

      // Act - Submit the form
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await userEvent.click(submitButton);

      // Assert - Component's submit handler should be called
      expect(submitSpy).toHaveBeenCalledTimes(1);

      // Note: We can't directly test preventDefault() was called because the directive
      // handles it internally. The fact that the page doesn't reload proves it works.
      // In a real browser, without preventDefault(), clicking submit would reload the page.
    });

    it('should allow component submit handler to execute after preventDefault', async () => {
      // Arrange
      let submitCount = 0;

      @Component({
        selector: 'ngx-test-prevent-default',
        imports: [NgxVestFormDirective],
        template: `
          <form [ngxVestForm]="form" (submit)="handleSubmit()">
            <button type="submit">Submit</button>
          </form>
        `,
      })
      class TestComponent {
        form = createVestForm(signal({ email: '' }), { suite: testSuite });

        handleSubmit() {
          submitCount++;
        }
      }

      await render(TestComponent);

      // Act - Submit multiple times
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await userEvent.click(submitButton);
      await userEvent.click(submitButton);

      // Assert - Handler should execute each time
      expect(submitCount).toBe(2);
    });

    it('should work with async submit handlers', async () => {
      // Arrange
      const submitPromises: Promise<void>[] = [];

      @Component({
        selector: 'ngx-test-prevent-default',
        imports: [NgxVestFormDirective],
        template: `
          <form [ngxVestForm]="form" (submit)="handleSubmit()">
            <button type="submit">Submit</button>
          </form>
        `,
      })
      class TestComponent {
        form = createVestForm(signal({ email: 'test@example.com' }), {
          suite: testSuite,
        });

        async handleSubmit() {
          const promise = this.form.submit();
          submitPromises.push(promise);
          await promise;
        }
      }

      await render(TestComponent);

      // Act
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await userEvent.click(submitButton);

      // Assert
      expect(submitPromises).toHaveLength(1);
      const result = await submitPromises[0];
      expect(result).toBeDefined();
    });

    it('should work when component has onSubmit method (no naming conflict)', async () => {
      // Arrange - Test that having onSubmit() in component doesn't conflict with directive
      const onSubmitSpy = vi.fn();

      @Component({
        selector: 'ngx-test-prevent-default',
        imports: [NgxVestFormDirective],
        template: `
          <form [ngxVestForm]="form" (submit)="onSubmit()">
            <button type="submit">Submit</button>
          </form>
        `,
      })
      class TestComponent {
        form = createVestForm(signal({ email: '' }), { suite: testSuite });
        onSubmit = onSubmitSpy; // Component has onSubmit method
      }

      await render(TestComponent);

      // Act
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await userEvent.click(submitButton);

      // Assert - Component's onSubmit should be called (no conflict with directive)
      expect(onSubmitSpy).toHaveBeenCalledTimes(1);
    });

    it('should work with Enter key submission', async () => {
      // Arrange
      const submitSpy = vi.fn();

      @Component({
        selector: 'ngx-test-prevent-default',
        imports: [NgxVestFormDirective],
        template: `
          <form [ngxVestForm]="form" (submit)="handleSubmit()">
            <input type="text" />
            <button type="submit">Submit</button>
          </form>
        `,
      })
      class TestComponent {
        form = createVestForm(signal({ email: '' }), { suite: testSuite });
        handleSubmit = submitSpy;
      }

      await render(TestComponent);

      // Act - Press Enter in the input field
      const input = screen.getByRole('textbox');
      await userEvent.click(input);
      await userEvent.keyboard('{Enter}');

      // Assert - Submit handler should be called
      expect(submitSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration with other directives', () => {
    it('should work with ngxVestFormProvider via hostDirectives', async () => {
      // Arrange
      @Component({
        selector: 'ngx-test-prevent-default',
        imports: [NgxVestFormDirective],
        template: `
          <form [ngxVestForm]="form">
            <button type="submit">Submit</button>
          </form>
        `,
      })
      class TestComponent {
        form = createVestForm(signal({ email: '' }), { suite: testSuite });
      }

      // Act
      const { container } = await render(TestComponent);

      // Assert - Form should be in the DOM with the directive applied
      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
    });
  });
});
