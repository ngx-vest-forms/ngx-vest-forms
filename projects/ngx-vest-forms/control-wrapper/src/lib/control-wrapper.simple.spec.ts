import { Component } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@vitest/browser/context';
import { ngxVestForms } from 'ngx-vest-forms/core';
import { enforce, only, staticSuite, test, warn } from 'vest';
import { describe, expect, it } from 'vitest';
import { NgxControlWrapper } from './control-wrapper.component';

// Test validation suite
const testSuite = staticSuite(
  (data: { email?: string } = {}, field?: string) => {
    only(field);

    test('email', 'Email is required', () => {
      enforce(data.email).isNotEmpty();
    });

    test('email', 'Email format looks unusual', () => {
      warn(); // Warning only
      enforce(data.email).matches(/^[^@]+@[^@]+\.[^@]+$/);
    });
  },
);

describe('NgxControlWrapper - Simplified Integration', () => {
  describe('Basic Functionality', () => {
    it('should render and integrate with forms correctly', async () => {
      @Component({
        imports: [NgxControlWrapper, ngxVestForms],
        template: `
          <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
            <ngx-control-wrapper data-testid="wrapper" showWarnings>
              <label for="email">Email</label>
              <input
                id="email"
                name="email"
                [ngModel]="model.email"
                type="email"
              />
            </ngx-control-wrapper>
          </form>
        `,
      })
      class TestComponent {
        model = { email: '' };
        suite = testSuite;
      }

      const { fixture } = await render(TestComponent);
      const input = screen.getByRole('textbox', { name: /email/i });
      const wrapper = screen.getByTestId('wrapper');

      // Basic rendering works
      expect(wrapper).toBeInTheDocument();
      expect(input).toBeInTheDocument();

      // Basic interaction works
      await userEvent.click(input);
      await userEvent.type(input, 'test');
      await fixture.whenStable();

      expect(input).toHaveValue('test');
    });

    it('should show validation messages appropriately', async () => {
      @Component({
        imports: [NgxControlWrapper, ngxVestForms],
        template: `
          <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
            <ngx-control-wrapper showWarnings>
              <label for="email">Email</label>
              <input
                id="email"
                name="email"
                [ngModel]="model.email"
                type="email"
              />
            </ngx-control-wrapper>
          </form>
        `,
      })
      class TestComponent {
        model = { email: '' };
        suite = testSuite;
      }

      const { fixture } = await render(TestComponent);
      const input = screen.getByRole('textbox', { name: /email/i });

      // Trigger validation
      await userEvent.click(input);
      await userEvent.type(input, 'invalid');
      await fixture.whenStable();

      // Should show warnings
      await expect
        .poll(() => screen.queryByText(/Email format looks unusual/), {
          timeout: 1000,
        })
        .not.toBeNull();

      // Trigger errors
      await userEvent.clear(input);
      await userEvent.tab();
      await fixture.whenStable();

      // Should show errors
      await expect
        .poll(() => screen.queryByText(/Email is required/), { timeout: 1000 })
        .not.toBeNull();
    });
  });

  describe('CSS Integration Support', () => {
    it('should provide data attributes for CSS targeting', async () => {
      @Component({
        imports: [NgxControlWrapper, ngxVestForms],
        template: `
          <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
            <ngx-control-wrapper showWarnings="on-change">
              <label for="email">Email</label>
              <input
                id="email"
                name="email"
                [ngModel]="model.email"
                type="email"
              />
            </ngx-control-wrapper>
          </form>
        `,
      })
      class TestComponent {
        model = { email: '' };
        suite = testSuite;
      }

      await render(TestComponent);
      const wrapper = document.querySelector(
        'ngx-control-wrapper',
      ) as HTMLElement;

      // Should provide CSS targeting hooks
      expect(wrapper).toHaveAttribute('data-warning-mode', 'on-change');
    });
  });
});
