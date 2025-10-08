import { Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { createVestForm, staticSafeSuite } from 'ngx-vest-forms/core';
import { enforce, test } from 'vest';
import { describe, expect, it } from 'vitest';
import { NgxVestFormField } from './form-field.component';

// Test validation suite
const testSuite = staticSafeSuite<{ email: string; name: string }>(
  (data = {}) => {
    test('email', 'Email is required', () => {
      enforce(data.email).isNotEmpty();
    });

    test('email', 'Email format is invalid', () => {
      enforce(data.email)['isEmail']();
    });

    test('name', 'Name is required', () => {
      enforce(data.name).isNotEmpty();
    });
  },
);

describe('NgxVestFormField', () => {
  describe('Layout and Structure', () => {
    it('should render wrapper with projected content', async () => {
      @Component({
        selector: 'ngx-test-wrapper',
        imports: [NgxVestFormField],
        template: `
          <ngx-vest-form-field>
            <label for="test">Test Label</label>
            <input id="test" type="text" />
          </ngx-vest-form-field>
        `,
      })
      // eslint-disable-next-line @typescript-eslint/no-extraneous-class
      class TestWrapperComponent {}

      await render(TestWrapperComponent);

      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should apply consistent spacing via CSS custom properties', async () => {
      @Component({
        selector: 'ngx-test-wrapper',
        imports: [NgxVestFormField],
        template: `
          <ngx-vest-form-field>
            <label for="test">Test</label>
            <input id="test" type="text" />
          </ngx-vest-form-field>
        `,
      })
      // eslint-disable-next-line @typescript-eslint/no-extraneous-class
      class TestWrapperComponent {}

      const { container } = await render(TestWrapperComponent);

      const wrapper = container.querySelector('.ngx-vest-form-field');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('ngx-vest-form-field');
    });

    it('should work without field input (layout only)', async () => {
      @Component({
        selector: 'ngx-test-wrapper',
        imports: [NgxVestFormField],
        template: `
          <ngx-vest-form-field>
            <label for="simple">Simple Field</label>
            <input id="simple" type="text" />
          </ngx-vest-form-field>
        `,
      })
      // eslint-disable-next-line @typescript-eslint/no-extraneous-class
      class TestWrapperComponent {}

      await render(TestWrapperComponent);

      expect(screen.getByLabelText('Simple Field')).toBeInTheDocument();
      // Should not show any error components
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('Error Display Integration', () => {
    it('should display errors when field is provided', async () => {
      @Component({
        selector: 'ngx-test-form',
        imports: [NgxVestFormField],
        template: `
          <ngx-vest-form-field [field]="form.emailField()">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              [value]="form.email() ?? ''"
              (input)="form.setEmail($event)"
            />
          </ngx-vest-form-field>
        `,
      })
      class TestFormComponent {
        form = createVestForm(signal({ email: '', name: '' }), {
          suite: testSuite,
          errorStrategy: 'immediate',
        });
      }

      await render(TestFormComponent);

      // With immediate strategy, errors show right away
      expect(screen.getByRole('alert')).toHaveTextContent('Email is required');
    });

    it('should hide errors when field is valid', async () => {
      @Component({
        selector: 'ngx-test-form',
        imports: [NgxVestFormField],
        template: `
          <ngx-vest-form-field [field]="form.emailField()">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              [value]="form.email() ?? ''"
              (input)="form.setEmail($event)"
            />
          </ngx-vest-form-field>
        `,
      })
      class TestFormComponent {
        form = createVestForm(
          signal({ email: 'test@example.com', name: 'John' }),
          { suite: testSuite },
        );

        constructor() {
          // Run validation to verify the field - should be valid
          this.form.validate();
        }
      }

      await render(TestFormComponent);

      // Valid field should not show errors (uses default 'on-touch' strategy, not touched yet)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should show multiple errors if present', async () => {
      @Component({
        selector: 'ngx-test-form',
        imports: [NgxVestFormField],
        template: `
          <ngx-vest-form-field [field]="form.emailField()">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              [value]="form.email() ?? ''"
              (input)="form.setEmail($event)"
            />
          </ngx-vest-form-field>
        `,
      })
      class TestFormComponent {
        form = createVestForm(signal({ email: 'invalid-email', name: '' }), {
          suite: testSuite,
          errorStrategy: 'immediate',
        });
      }

      await render(TestFormComponent);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Email format is invalid');
    });
  });

  describe('Multiple Form Controls', () => {
    it('should support multiple controls in same form', async () => {
      @Component({
        selector: 'ngx-test-form',
        imports: [NgxVestFormField],
        template: `
          <form>
            <ngx-vest-form-field [field]="form.emailField()">
              <label for="email">Email</label>
              <input
                id="email"
                type="email"
                [value]="form.email() ?? ''"
                (input)="form.setEmail($event)"
              />
            </ngx-vest-form-field>

            <ngx-vest-form-field [field]="form.nameField()">
              <label for="name">Name</label>
              <input
                id="name"
                type="text"
                [value]="form.name() ?? ''"
                (input)="form.setName($event)"
              />
            </ngx-vest-form-field>
          </form>
        `,
      })
      class TestFormComponent {
        form = createVestForm(signal({ email: '', name: '' }), {
          suite: testSuite,
          errorStrategy: 'immediate',
        });
      }

      await render(TestFormComponent);

      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Name')).toBeInTheDocument();

      // Both should show errors with immediate strategy
      const alerts = screen.getAllByRole('alert');
      expect(alerts).toHaveLength(2);
    });
  });

  describe('Different Input Types', () => {
    it('should work with textarea', async () => {
      @Component({
        selector: 'ngx-test-wrapper',
        imports: [NgxVestFormField],
        template: `
          <ngx-vest-form-field>
            <label for="message">Message</label>
            <textarea id="message"></textarea>
          </ngx-vest-form-field>
        `,
      })
      // eslint-disable-next-line @typescript-eslint/no-extraneous-class
      class TestWrapperComponent {}

      await render(TestWrapperComponent);

      expect(screen.getByLabelText('Message')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should work with select', async () => {
      @Component({
        selector: 'ngx-test-wrapper',
        imports: [NgxVestFormField],
        template: `
          <ngx-vest-form-field>
            <label for="country">Country</label>
            <select id="country">
              <option value="">Select...</option>
              <option value="us">United States</option>
              <option value="ca">Canada</option>
            </select>
          </ngx-vest-form-field>
        `,
      })
      // eslint-disable-next-line @typescript-eslint/no-extraneous-class
      class TestWrapperComponent {}

      await render(TestWrapperComponent);

      expect(screen.getByLabelText('Country')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should work with checkbox', async () => {
      @Component({
        selector: 'ngx-test-wrapper',
        imports: [NgxVestFormField],
        template: `
          <ngx-vest-form-field>
            <label for="agree">
              <input id="agree" type="checkbox" />
              I agree to terms
            </label>
          </ngx-vest-form-field>
        `,
      })
      // eslint-disable-next-line @typescript-eslint/no-extraneous-class
      class TestWrapperComponent {}

      await render(TestWrapperComponent);

      expect(screen.getByRole('checkbox')).toBeInTheDocument();
      expect(screen.getByLabelText(/I agree to terms/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should maintain label/input associations', async () => {
      @Component({
        selector: 'ngx-test-wrapper',
        imports: [NgxVestFormField],
        template: `
          <ngx-vest-form-field>
            <label for="accessible">Accessible Field</label>
            <input id="accessible" type="text" />
          </ngx-vest-form-field>
        `,
      })
      // eslint-disable-next-line @typescript-eslint/no-extraneous-class
      class TestWrapperComponent {}

      await render(TestWrapperComponent);

      const input = screen.getByLabelText('Accessible Field');
      expect(input).toHaveAttribute('id', 'accessible');
    });

    it('should use proper ARIA roles for errors (via NgxFormErrorComponent)', async () => {
      @Component({
        selector: 'ngx-test-form',
        imports: [NgxVestFormField],
        template: `
          <ngx-vest-form-field [field]="form.emailField()">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              [value]="form.email() ?? ''"
              (input)="form.setEmail($event)"
            />
          </ngx-vest-form-field>
        `,
      })
      class TestFormComponent {
        form = createVestForm(signal({ email: '', name: '' }), {
          suite: testSuite,
          errorStrategy: 'immediate',
        });
      }

      await render(TestFormComponent);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute('aria-live', 'assertive');
      expect(alert).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined field gracefully', async () => {
      @Component({
        selector: 'ngx-test-wrapper',
        imports: [NgxVestFormField],
        template: `
          <ngx-vest-form-field [field]="undefined">
            <label for="test">Test</label>
            <input id="test" type="text" />
          </ngx-vest-form-field>
        `,
      })
      // eslint-disable-next-line @typescript-eslint/no-extraneous-class
      class TestWrapperComponent {}

      await render(TestWrapperComponent);

      expect(screen.getByLabelText('Test')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should handle empty projected content', async () => {
      @Component({
        selector: 'ngx-test-wrapper',
        imports: [NgxVestFormField],
        template: `<ngx-vest-form-field></ngx-vest-form-field>`,
      })
      // eslint-disable-next-line @typescript-eslint/no-extraneous-class
      class TestWrapperComponent {}

      const { container } = await render(TestWrapperComponent);

      const wrapper = container.querySelector('.ngx-vest-form-field');
      expect(wrapper).toBeInTheDocument();
    });
  });
});
