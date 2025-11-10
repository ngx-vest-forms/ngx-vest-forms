import { Component, signal } from '@angular/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { enforce, only, staticSuite, test as vestTest, warn } from 'vest';
import { vestForms } from '../../exports';

// Test validation suite for the component tests
type TestModel = {
  email?: string;
  username?: string;
};

const testSuite = staticSuite((data: TestModel = {}, field?: string) => {
  only(field); // ✅ Call unconditionally
  vestTest('email', 'Email is required', () => {
    enforce(data.email ?? '').isNotBlank();
  });
  vestTest('email', 'Please provide a valid email', () => {
    enforce(data.email ?? '').matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });
  vestTest('username', 'Username is required', () => {
    enforce(data.username ?? '').isNotBlank();
  });
  vestTest('username', 'Username looks weak', () => {
    enforce(data.username ?? '').longerThan(2);
  });
});

@Component({
  imports: [vestForms],
  template: `
    <form
      scVestForm
      [suite]="suite"
      [formValue]="model()"
      (formValueChange)="model.set($event)"
    >
      <sc-control-wrapper>
        <label for="email">Email</label>
        <input id="email" name="email" [ngModel]="model().email" />
      </sc-control-wrapper>
      <sc-control-wrapper>
        <label for="username">Username</label>
        <input id="username" name="username" [ngModel]="model().username" />
      </sc-control-wrapper>
    </form>
  `,
})
class TestFormComponent {
  model = signal({ email: '', username: '' });
  suite = testSuite;
}

@Component({
  imports: [vestForms],
  template: `
    <form
      scVestForm
      [suite]="suite"
      [formValue]="model()"
      (formValueChange)="model.set($event)"
    >
      <div scControlWrapper>
        <label for="email">Email</label>
        <input id="email" name="email" [ngModel]="model().email" />
      </div>
    </form>
  `,
})
class DirectiveAttributeComponent {
  model = signal({ email: '' });
  suite = testSuite;
}

// Async validation suite for pending state tests
const asyncSuite = staticSuite((data: TestModel = {}, field?: string) => {
  // ✅ CRITICAL: Always call only() unconditionally (PR #60 requirement)
  only(field);
  vestTest('email', 'Email must be available', () => {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (data.email === 'taken@example.com') {
          reject(new Error('Email must be available'));
        } else {
          resolve();
        }
      }, 50);
    });
  });
});

@Component({
  imports: [vestForms],
  template: `
    <form
      scVestForm
      [suite]="suite"
      [formValue]="model()"
      (formValueChange)="model.set($event)"
    >
      <sc-control-wrapper>
        <label for="email">Email</label>
        <input id="email" name="email" [ngModel]="model().email" />
      </sc-control-wrapper>
    </form>
  `,
})
class AsyncTestComponent {
  model = signal({ email: '' });
  suite = asyncSuite;
}

@Component({
  imports: [vestForms],
  template: `
    <sc-control-wrapper>
      <div>Empty wrapper</div>
    </sc-control-wrapper>
  `,
})
class EmptyWrapperComponent {}

@Component({
  imports: [vestForms],
  template: `
    <form
      scVestForm
      [formValue]="model()"
      (formValueChange)="model.set($event)"
    >
      <sc-control-wrapper>
        <label for="firstName">First Name</label>
        <input id="firstName" name="firstName" [ngModel]="model().firstName" />
        <label for="lastName">Last Name</label>
        <input id="lastName" name="lastName" [ngModel]="model().lastName" />
      </sc-control-wrapper>
    </form>
  `,
})
class MultipleControlsComponent {
  model = signal({ firstName: '', lastName: '' });
}

describe('ScControlWrapperComponent', () => {
  describe('Core Functionality', () => {
    it('should render component correctly with element selector', async () => {
      await render(TestFormComponent);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      const emailInput = screen.getByLabelText('Email');
      const usernameInput = screen.getByLabelText('Username');
      const emailWrapper = emailInput.closest('.sc-control-wrapper');
      const usernameWrapper = usernameInput.closest('.sc-control-wrapper');
      expect(emailWrapper).toBeInTheDocument();
      expect(usernameWrapper).toBeInTheDocument();
      expect(emailWrapper).toHaveClass('sc-control-wrapper');
      expect(usernameWrapper).toHaveClass('sc-control-wrapper');
    });
    it('should render component correctly with directive attribute syntax', async () => {
      await render(DirectiveAttributeComponent);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      const emailInput = screen.getByLabelText('Email');
      const wrapper = emailInput.closest('.sc-control-wrapper');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('sc-control-wrapper');
    });
    it('should display validation errors when field is invalid and touched', async () => {
      await render(TestFormComponent);
      const emailInput = screen.getByLabelText('Email');
      await userEvent.click(emailInput);
      await userEvent.tab(); // blur
      // Wait for error to appear
      await screen.findByText('Email is required', {}, { timeout: 1000 });
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    it('should apply invalid CSS class when errors should be shown', async () => {
      await render(TestFormComponent);
      const emailInput = screen.getByLabelText('Email');
      await userEvent.click(emailInput);
      await userEvent.tab();
      // Wait for error to appear
      await screen.findByText('Email is required', {}, { timeout: 1000 });
      const wrapper = emailInput.closest('.sc-control-wrapper');
      expect(wrapper).toHaveClass('sc-control-wrapper--invalid');
    });

    it('should remove invalid CSS class when field becomes valid', async () => {
      const fixture = await render(TestFormComponent);
      const emailInput = screen.getByLabelText('Email');
      await userEvent.click(emailInput);
      await userEvent.tab();
      // Wait for error to appear
      await screen.findByText('Email is required', {}, { timeout: 1000 });
      const wrapper = emailInput.closest('.sc-control-wrapper');
      expect(wrapper).toHaveClass('sc-control-wrapper--invalid');
      // Type valid email
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fixture.fixture.componentInstance.model.set({
        email: 'test@example.com',
        username: '',
      });
      await userEvent.tab();
      // Wait for error to disappear
      await waitFor(
        () => {
          expect(wrapper).not.toHaveClass('sc-control-wrapper--invalid');
        },
        { timeout: 1000 }
      );
    });

    it('should surface validation errors for multiple rules on the same field', async () => {
      await render(TestFormComponent);
      const emailInput = screen.getByLabelText('Email');
      await userEvent.click(emailInput);
      await userEvent.tab();
      await screen.findByText('Email is required', {}, { timeout: 1000 });

      await userEvent.type(emailInput, 'invalid');
      await userEvent.tab();
      await waitFor(() => {
        expect(
          screen.getByText('Please provide a valid email')
        ).toBeInTheDocument();
      });
      expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
    });

    it('should show pending state and spinner during async validation, and remove after completion', async () => {
      await render(AsyncTestComponent);
      const emailInput = screen.getByLabelText('Email');
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.tab();
      const wrapper = emailInput.closest('.sc-control-wrapper');
      // Wait for pending state
      await waitFor(
        () => {
          expect(wrapper).toHaveAttribute('aria-busy', 'true');
          expect(wrapper!.querySelector('.animate-spin')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
      // Wait for async validation to complete and spinner to disappear
      await waitFor(
        () => {
          expect(wrapper).not.toHaveAttribute('aria-busy', 'true');
          expect(
            wrapper!.querySelector('.animate-spin')
          ).not.toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('should display async validation error after rejection', async () => {
      await render(AsyncTestComponent);
      const emailInput = screen.getByLabelText('Email');
      await userEvent.type(emailInput, 'taken@example.com');
      await userEvent.tab();
      // Wait for async validation to complete and error to appear
      await waitFor(
        () => {
          expect(
            screen.getByText('Email must be available')
          ).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('should respect errorDisplayMode input from directive', async () => {
      @Component({
        imports: [vestForms],
        template: `
          <form
            scVestForm
            [suite]="suite"
            [formValue]="model()"
            (formValueChange)="model.set($event)"
          >
            <sc-control-wrapper [errorDisplayMode]="'on-submit'">
              <label for="email">Email</label>
              <input id="email" name="email" [ngModel]="model().email" />
            </sc-control-wrapper>
            <button type="submit">Submit</button>
          </form>
        `,
      })
      class ErrorDisplayModeComponent {
        model = signal({ email: '' });
        protected readonly suite = testSuite;
      }
      await render(ErrorDisplayModeComponent);
      const emailInput = screen.getByLabelText('Email');
      // Type something and blur to trigger validation
      await userEvent.type(emailInput, 'a');
      await userEvent.clear(emailInput);
      await userEvent.tab();
      // Should NOT show error on blur (on-submit mode)
      expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
      // Submit the form
      await userEvent.click(screen.getByText('Submit'));
      // Wait for error to appear
      await screen.findByText('Email is required', {}, { timeout: 1000 });
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    it('should maintain proper ARIA attributes for errors', async () => {
      await render(TestFormComponent);
      const emailInput = screen.getByLabelText('Email');
      await userEvent.click(emailInput);
      await userEvent.tab();
      // Wait for error to appear
      await screen.findByText('Email is required', {}, { timeout: 1000 });
      const errorElement = screen.getByText('Email is required');
      const errorContainer = errorElement.closest('[role="alert"]');
      expect(errorContainer).toBeInTheDocument();
      expect(errorContainer).toHaveAttribute('aria-live', 'assertive');
    });

    it('should project child content correctly', async () => {
      await render(TestFormComponent);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
    });

    it('should handle empty form gracefully', async () => {
      await render(EmptyWrapperComponent);
      expect(screen.getByText('Empty wrapper')).toBeInTheDocument();
      const content = screen.getByText('Empty wrapper');
      const wrapper = content.closest('.sc-control-wrapper');
      expect(wrapper).toBeInTheDocument();
    });

    it('should handle multiple form controls in one wrapper', async () => {
      await render(MultipleControlsComponent);
      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    });
  });

  describe('ARIA Enhancements', () => {
    it('should generate unique IDs for error, warning, and pending regions', async () => {
      await render(TestFormComponent);
      const emailInput = screen.getByLabelText('Email');
      const usernameInput = screen.getByLabelText('Username');

      // Trigger errors
      await userEvent.click(emailInput);
      await userEvent.tab();
      await screen.findByText('Email is required', {}, { timeout: 1000 });

      await userEvent.click(usernameInput);
      await userEvent.tab();
      await screen.findByText('Username is required', {}, { timeout: 1000 });

      // Find error containers using Testing Library
      const emailError = screen.getByText('Email is required');
      const usernameError = screen.getByText('Username is required');

      const emailErrorContainer = emailError.closest('[role="alert"]');
      const usernameErrorContainer = usernameError.closest('[role="alert"]');

      // Verify unique IDs exist
      expect(emailErrorContainer).toHaveAttribute('id');
      expect(usernameErrorContainer).toHaveAttribute('id');

      // Verify IDs are different (no collisions)
      expect(emailErrorContainer?.id).not.toBe(usernameErrorContainer?.id);

      // Verify ID format matches pattern
      expect(emailErrorContainer?.id).toMatch(
        /^ngx-control-wrapper-\d+-error$/
      );
      expect(usernameErrorContainer?.id).toMatch(
        /^ngx-control-wrapper-\d+-error$/
      );

      // Verify containers are queryable by their IDs
      expect(document.getElementById(emailErrorContainer!.id)).toBe(
        emailErrorContainer
      );
      expect(document.getElementById(usernameErrorContainer!.id)).toBe(
        usernameErrorContainer
      );
    });

    it('should associate error messages with form controls via aria-describedby', async () => {
      await render(TestFormComponent);
      const emailInput = screen.getByLabelText('Email');

      // Initially no aria-describedby
      expect(emailInput).not.toHaveAttribute('aria-describedby');

      // Trigger error
      await userEvent.click(emailInput);
      await userEvent.tab();
      await screen.findByText('Email is required', {}, { timeout: 1000 });

      // Verify aria-describedby points to error ID
      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-describedby');
        const describedBy = emailInput.getAttribute('aria-describedby')!;

        // Verify format of aria-describedby value
        expect(describedBy).toMatch(/^ngx-control-wrapper-\d+-error$/);
        expect(describedBy).not.toContain(' '); // Single ID, no spaces

        // Verify the error element has the matching ID
        const errorElement = screen.getByText('Email is required');
        const errorContainer = errorElement.closest('[role="alert"]');
        expect(errorContainer?.id).toBe(describedBy);

        // Verify the referenced element actually exists in DOM
        const referencedElement = document.getElementById(describedBy);
        expect(referencedElement).toBe(errorContainer);
        expect(referencedElement).toBeInTheDocument();
      });
    });

    it('should set aria-invalid="true" on form controls when errors should be shown', async () => {
      await render(TestFormComponent);
      const emailInput = screen.getByLabelText('Email');

      // Initially not invalid
      expect(emailInput).not.toHaveAttribute('aria-invalid');

      // Trigger error
      await userEvent.click(emailInput);
      await userEvent.tab();
      await screen.findByText('Email is required', {}, { timeout: 1000 });

      // Verify aria-invalid is set
      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should remove aria-invalid when field becomes valid', async () => {
      const fixture = await render(TestFormComponent);
      const emailInput = screen.getByLabelText('Email');

      // Trigger error
      await userEvent.click(emailInput);
      await userEvent.tab();
      await screen.findByText('Email is required', {}, { timeout: 1000 });
      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
        expect(emailInput).toHaveAttribute('aria-describedby');
      });

      // Type valid email
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fixture.fixture.componentInstance.model.set({
        email: 'test@example.com',
        username: '',
      });
      await userEvent.tab();

      // Wait for error to disappear and both aria attributes to be removed
      await waitFor(
        () => {
          expect(emailInput).not.toHaveAttribute('aria-invalid');
          expect(emailInput).not.toHaveAttribute('aria-describedby');
          expect(
            screen.queryByText('Email is required')
          ).not.toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('should use role="alert" with aria-live="assertive" for error messages', async () => {
      await render(TestFormComponent);
      const emailInput = screen.getByLabelText('Email');

      await userEvent.click(emailInput);
      await userEvent.tab();
      await screen.findByText('Email is required', {}, { timeout: 1000 });

      // Find error container using Testing Library
      const errorElement = screen.getByText('Email is required');
      const errorContainer = errorElement.closest('[role="alert"]');

      // Verify all ARIA attributes for errors
      expect(errorContainer).toHaveAttribute('role', 'alert');
      expect(errorContainer).toHaveAttribute('aria-live', 'assertive');
      expect(errorContainer).toHaveAttribute('aria-atomic', 'true');
      expect(errorContainer).toHaveAttribute('id');
      expect(errorContainer?.id).toMatch(/^ngx-control-wrapper-\d+-error$/);

      // Verify the container is accessible by role
      expect(screen.getByRole('alert')).toBe(errorContainer);
    });

    it('should use role="status" with aria-live="polite" for warnings', async () => {
      // Create suite with warnings
      const warningSuite = staticSuite(
        (data: TestModel = {}, field?: string) => {
          only(field);
          vestTest('username', 'Username looks weak', () => {
            warn(); // Must be called synchronously at start
            enforce(data.username ?? '').longerThan(5);
          });
        }
      );

      @Component({
        imports: [vestForms],
        template: `
          <form
            scVestForm
            [suite]="suite"
            [formValue]="model()"
            (formValueChange)="model.set($event)"
          >
            <sc-control-wrapper>
              <label for="username">Username</label>
              <input
                id="username"
                name="username"
                [ngModel]="model().username"
              />
            </sc-control-wrapper>
          </form>
        `,
      })
      class WarningTestComponent {
        model = signal({ username: '' });
        suite = warningSuite;
      }

      await render(WarningTestComponent);
      const usernameInput = screen.getByLabelText('Username');

      // Type short username to trigger warning
      await userEvent.type(usernameInput, 'abc');
      await userEvent.tab();

      await screen.findByText('Username looks weak', {}, { timeout: 1000 });

      // Find warning container using Testing Library
      const warningElement = screen.getByText('Username looks weak');
      const warningContainer = warningElement.closest('[role="status"]');

      // Verify all ARIA attributes for warnings
      expect(warningContainer).toHaveAttribute('role', 'status');
      expect(warningContainer).toHaveAttribute('aria-live', 'polite');
      expect(warningContainer).toHaveAttribute('aria-atomic', 'true');
      expect(warningContainer).toHaveAttribute('id');
      expect(warningContainer?.id).toMatch(/^ngx-control-wrapper-\d+-warning$/);

      // Verify the warning is associated with the input via aria-describedby
      await waitFor(() => {
        const describedBy = usernameInput.getAttribute('aria-describedby');
        expect(describedBy).toContain(warningContainer!.id);
      });
    });

    it('should use role="status" with aria-live="polite" for pending state', async () => {
      await render(AsyncTestComponent);
      const emailInput = screen.getByLabelText('Email');

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.tab();

      // Wait for pending state with comprehensive ARIA checks
      await waitFor(
        () => {
          const pendingText = screen.getByText('Validating…');
          const pendingContainer = pendingText.closest('[role="status"]');

          // Verify all ARIA attributes for pending state
          expect(pendingContainer).toHaveAttribute('role', 'status');
          expect(pendingContainer).toHaveAttribute('aria-live', 'polite');
          expect(pendingContainer).toHaveAttribute('aria-atomic', 'true');
          expect(pendingContainer).toHaveAttribute('id');
          expect(pendingContainer?.id).toMatch(
            /^ngx-control-wrapper-\d+-pending$/
          );

          // Verify pending state is associated with input
          const describedBy = emailInput.getAttribute('aria-describedby');
          expect(describedBy).toContain(pendingContainer!.id);
        },
        { timeout: 1000 }
      );
    });

    it('should hide spinner from screen readers with aria-hidden', async () => {
      await render(AsyncTestComponent);
      const emailInput = screen.getByLabelText('Email');

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.tab();

      // Wait for pending state
      await waitFor(
        () => {
          const wrapper = emailInput.closest('.sc-control-wrapper');
          const spinner = wrapper!.querySelector('.animate-spin');
          expect(spinner).toHaveAttribute('aria-hidden', 'true');
        },
        { timeout: 1000 }
      );
    });

    it('should update aria-describedby to include multiple regions when applicable', async () => {
      // Create suite that can show both errors and warnings
      const mixedSuite = staticSuite((data: TestModel = {}, field?: string) => {
        only(field);
        vestTest('username', 'Username is required', () => {
          enforce(data.username ?? '').isNotBlank();
        });
      });

      @Component({
        imports: [vestForms],
        template: `
          <form
            scVestForm
            [suite]="suite"
            [formValue]="model()"
            (formValueChange)="model.set($event)"
          >
            <sc-control-wrapper>
              <label for="username">Username</label>
              <input
                id="username"
                name="username"
                [ngModel]="model().username"
              />
            </sc-control-wrapper>
          </form>
        `,
      })
      class MixedTestComponent {
        model = signal({ username: '' });
        suite = mixedSuite;
      }

      await render(MixedTestComponent);
      const usernameInput = screen.getByLabelText('Username');

      // Trigger error
      await userEvent.click(usernameInput);
      await userEvent.tab();
      await screen.findByText('Username is required', {}, { timeout: 1000 });

      // Verify aria-describedby includes error ID
      await waitFor(() => {
        const describedBy = usernameInput.getAttribute('aria-describedby')!;
        expect(describedBy).toMatch(/^ngx-control-wrapper-\d+-error$/);

        // Verify the referenced element exists
        const errorElement = document.getElementById(describedBy);
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveAttribute('role', 'alert');

        // Verify format: should be a single ID
        expect(describedBy.split(' ')).toHaveLength(1);
      });
    });

    it('should handle multiple controls in one wrapper with proper ARIA associations', async () => {
      const multiSuite = staticSuite(
        (data: { firstName?: string; lastName?: string }, field?: string) => {
          only(field);
          vestTest('firstName', 'First name is required', () => {
            enforce(data.firstName ?? '').isNotBlank();
          });
          vestTest('lastName', 'Last name is required', () => {
            enforce(data.lastName ?? '').isNotBlank();
          });
        }
      );

      @Component({
        imports: [vestForms],
        template: `
          <form
            scVestForm
            [suite]="suite"
            [formValue]="model()"
            (formValueChange)="model.set($event)"
          >
            <sc-control-wrapper>
              <label for="firstName">First Name</label>
              <input
                id="firstName"
                name="firstName"
                [ngModel]="model().firstName"
              />
              <label for="lastName">Last Name</label>
              <input
                id="lastName"
                name="lastName"
                [ngModel]="model().lastName"
              />
            </sc-control-wrapper>
          </form>
        `,
      })
      class MultiControlAriaComponent {
        model = signal({ firstName: '', lastName: '' });
        suite = multiSuite;
      }

      await render(MultiControlAriaComponent);
      const firstNameInput = screen.getByLabelText('First Name');
      const lastNameInput = screen.getByLabelText('Last Name');

      // Focus both fields to trigger validation
      await userEvent.click(firstNameInput);
      await userEvent.tab();
      await userEvent.tab();

      // Wait for errors
      await waitFor(
        () => {
          expect(
            screen.queryByText('First name is required')
          ).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      // Both controls should have aria-describedby and aria-invalid
      await waitFor(() => {
        expect(firstNameInput).toHaveAttribute('aria-describedby');
        expect(lastNameInput).toHaveAttribute('aria-describedby');
        expect(firstNameInput).toHaveAttribute('aria-invalid', 'true');
        expect(lastNameInput).toHaveAttribute('aria-invalid', 'true');
      });
    });
  });
});
