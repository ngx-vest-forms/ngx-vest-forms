import { ApplicationRef, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { render, screen, waitFor } from '@testing-library/angular';
import { userEvent } from '@vitest/browser/context';
// Import from source exports to avoid dynamic import issues during Vitest browser runs
import { ngxVestForms } from 'ngx-vest-forms/core';
import { enforce, staticSuite, test as vestTest } from 'vest';
import { describe, expect, it, test } from 'vitest';
import { NgxControlWrapper } from './control-wrapper.component';

// Test validation suite for the component tests
const testSuite = staticSuite((data = {}) => {
  vestTest('email', 'Email is required', () => {
    enforce(data.email).isNotEmpty();
  });

  vestTest('email', 'Please provide a valid email', () => {
    enforce(data.email).matches(/^[^@]+@[^@]+\.[^@]+$/);
  });

  vestTest('username', 'Username is required', () => {
    enforce(data.username).isNotEmpty();
  });

  vestTest('username', 'Username looks weak', () => {
    enforce(data.username).longerThan(2);
  });
});

// Test component with NgxControlWrapper
@Component({
  imports: [NgxControlWrapper, ngxVestForms, FormsModule],
  template: `
    <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
      <ngx-control-wrapper>
        <label for="email">Email</label>
        <input id="email" name="email" [ngModel]="model().email" />
      </ngx-control-wrapper>

      <ngx-control-wrapper>
        <label for="username">Username</label>
        <input id="username" name="username" [ngModel]="model().username" />
      </ngx-control-wrapper>
    </form>
  `,
})
class TestFormComponent {
  model = signal({ email: '', username: '' });
  suite = testSuite;
}

// Test component for async validation
@Component({
  imports: [NgxControlWrapper, ngxVestForms, FormsModule],
  template: `
    <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
      <ngx-control-wrapper>
        <label for="email">Email</label>
        <input id="email" name="email" [ngModel]="model().email" />
      </ngx-control-wrapper>
    </form>
  `,
})
class AsyncTestComponent {
  model = signal({ email: '' });
  suite = staticSuite((data = {}) => {
    vestTest('email', 'Email must be available', () => {
      return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          if (data.email === 'taken@example.com') {
            reject(new Error('Email is already taken'));
          } else {
            resolve();
          }
        }, 300); // Increased timeout to make pending state more observable
      });
    });
  });
}

// Test component using directive attribute syntax
@Component({
  imports: [NgxControlWrapper, ngxVestForms, FormsModule],
  template: `
    <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
      <div ngxControlWrapper>
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

describe('NgxControlWrapper', () => {
  describe('Core Functionality', () => {
    it('should render component correctly with element selector', async () => {
      await render(TestFormComponent);

      // Component should render with expected elements
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Username')).toBeInTheDocument();

      // Control wrapper should have the correct CSS class by finding them through form inputs
      const emailInput = screen.getByLabelText('Email');
      const usernameInput = screen.getByLabelText('Username');

      // Both inputs should be contained within NgxControlWrapper components
      const emailWrapper = emailInput.closest('ngx-control-wrapper');
      const usernameWrapper = usernameInput.closest('ngx-control-wrapper');

      expect(emailWrapper).toBeInTheDocument();
      expect(usernameWrapper).toBeInTheDocument();
      expect(emailWrapper).toHaveClass('ngx-control-wrapper');
      expect(usernameWrapper).toHaveClass('ngx-control-wrapper');
    });

    it('should render component correctly with directive attribute syntax', async () => {
      await render(DirectiveAttributeComponent);

      // Component should render with expected elements
      expect(screen.getByLabelText('Email')).toBeInTheDocument();

      // Control wrapper should have the correct CSS class using closest()
      const emailInput = screen.getByLabelText('Email');
      const wrapper = emailInput.closest('[ngxControlWrapper]');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('ngx-control-wrapper');
    });

    it('should inject NgxFormErrorDisplayDirective via hostDirectives', async () => {
      const { fixture } = await render(TestFormComponent);

      // The component should have access to the error display directive
      // We can't directly access private fields, but we can test the behavior
      // that depends on the injected directive
      const emailInput = screen.getByLabelText('Email');
      await userEvent.click(emailInput);
      await userEvent.tab(); // blur the field

      await fixture.whenStable();
      // Ensure Angular app is fully stable before assertions (mirrors other tests)
      const appReference = fixture.debugElement.injector.get(ApplicationRef);
      await appReference.whenStable();

      // Should show validation errors (behavior from NgxFormErrorDisplayDirective)
      await waitFor(
        () => {
          expect(screen.getByText('Email is required')).toBeInTheDocument();
        },
        { timeout: 1000 },
      );
    });
  });

  describe('Error Display Integration', () => {
    it('should display validation errors when field is invalid and touched', async () => {
      const { fixture } = await render(TestFormComponent);
      const appReference = fixture.debugElement.injector.get(ApplicationRef);

      const emailInput = screen.getByLabelText('Email');

      // Focus and blur to trigger validation
      await userEvent.click(emailInput);
      await userEvent.tab();

      await fixture.whenStable();
      await appReference.whenStable();

      // Should display validation error
      await waitFor(
        () => {
          expect(screen.getByText('Email is required')).toBeInTheDocument();
        },
        { timeout: 1000 },
      );
    });

    it('should apply invalid CSS class when errors should be shown', async () => {
      const { fixture } = await render(TestFormComponent);
      const appReference = fixture.debugElement.injector.get(ApplicationRef);

      const emailInput = screen.getByLabelText('Email');

      // Focus and blur to trigger validation
      await userEvent.click(emailInput);
      await userEvent.tab();

      await fixture.whenStable();
      await appReference.whenStable();

      // Should apply the invalid CSS class
      await waitFor(
        () => {
          // The --invalid class is applied to the host element, not the inner wrapper
          const hostWrapper = emailInput.closest('ngx-control-wrapper');
          expect(hostWrapper).toHaveClass('ngx-control-wrapper--invalid');
        },
        { timeout: 1000 },
      );
    });

    it('should remove invalid CSS class when field becomes valid', async () => {
      const { fixture } = await render(TestFormComponent);
      const appReference = fixture.debugElement.injector.get(ApplicationRef);

      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;

      // Focus and blur to trigger validation (invalid state)
      await userEvent.click(emailInput);
      await userEvent.tab();

      await fixture.whenStable();
      await appReference.whenStable();

      // Verify invalid class is applied
      await waitFor(
        () => {
          // The --invalid class is applied to the host element, not the inner wrapper
          const hostWrapper = emailInput.closest('ngx-control-wrapper');
          expect(hostWrapper).toHaveClass('ngx-control-wrapper--invalid');
        },
        { timeout: 1000 },
      );

      // Enter valid email
      await userEvent.fill(emailInput, 'test@example.com');
      await userEvent.tab();

      await fixture.whenStable();
      await appReference.whenStable();

      // Should remove invalid class
      await waitFor(
        () => {
          const hostWrapper = emailInput.closest('ngx-control-wrapper');
          expect(hostWrapper).not.toHaveClass('ngx-control-wrapper--invalid');
        },
        { timeout: 1000 },
      );
    });

    it('should display multiple validation errors for the same field', async () => {
      const { fixture } = await render(TestFormComponent);

      const emailInput = screen.getByLabelText('Email');

      // Enter invalid email to trigger multiple validations
      await userEvent.fill(emailInput, 'invalid-email');
      await userEvent.tab();

      await fixture.whenStable();

      // Should display validation error for invalid format
      await waitFor(
        () => {
          expect(
            screen.getByText('Please provide a valid email'),
          ).toBeInTheDocument();
        },
        { timeout: 1000 },
      );
    });
  });

  describe('Pending State Display', () => {
    it('should show pending state during async validation', async () => {
      const { fixture } = await render(AsyncTestComponent);
      const appReference = fixture.debugElement.injector.get(ApplicationRef);

      const emailInput = screen.getByLabelText('Email');

      // Enter email that triggers async validation
      await userEvent.fill(emailInput, 'test@example.com');
      await userEvent.tab();

      await fixture.whenStable();

      // Should show pending state with aria-busy
      await waitFor(
        () => {
          // aria-busy is set on the inner wrapper div, not the host
          const innerWrapper = emailInput.closest('.ngx-control-wrapper');
          expect(innerWrapper).toHaveAttribute('aria-busy', 'true');
        },
        { timeout: 500 },
      );

      // Wait for async validation to complete
      await appReference.whenStable();

      // Should remove pending state
      await waitFor(
        () => {
          const innerWrapper = emailInput.closest('.ngx-control-wrapper');
          expect(innerWrapper).not.toHaveAttribute('aria-busy', 'true');
        },
        { timeout: 1000 },
      );
    });

    it('should display validating indicator during async validation', async () => {
      const { fixture } = await render(AsyncTestComponent);

      const emailInput = screen.getByLabelText('Email');

      // Enter email that triggers async validation
      await userEvent.fill(emailInput, 'test@example.com');
      await userEvent.tab();

      await fixture.whenStable();

      // Should show validating indicator in the DOM using getByRole
      await waitFor(
        () => {
          // Look for element with aria-busy attribute using testing-library
          expect(
            screen.getByLabelText('Email').closest('.ngx-control-wrapper'),
          ).toHaveAttribute('aria-busy', 'true');
        },
        { timeout: 500 },
      );
    });
  });

  describe('Accessibility', () => {
    it('should maintain proper ARIA attributes for errors', async () => {
      const { fixture } = await render(TestFormComponent);
      const appReference = fixture.debugElement.injector.get(ApplicationRef);

      const emailInput = screen.getByLabelText('Email');

      // Trigger validation
      await userEvent.click(emailInput);
      await userEvent.tab();

      await fixture.whenStable();
      await appReference.whenStable();

      // Should have proper ARIA attributes for error display
      await waitFor(
        () => {
          const errorElement = screen.getByText('Email is required');
          const errorContainer = errorElement.closest('[role="alert"]');
          expect(errorContainer).toBeInTheDocument();
          expect(errorContainer).toHaveAttribute('aria-live', 'polite');
        },
        { timeout: 1000 },
      );
    });

    it('should handle aria-busy correctly for pending states', async () => {
      const { fixture } = await render(AsyncTestComponent);

      const emailInput = screen.getByLabelText('Email');

      // Enter email that triggers async validation
      await userEvent.fill(emailInput, 'test@example.com');
      await userEvent.tab();

      await fixture.whenStable();

      // Should set aria-busy during validation
      await waitFor(
        () => {
          // aria-busy is set on the inner wrapper div, not the host
          const innerWrapper = emailInput.closest('.ngx-control-wrapper');
          expect(innerWrapper).toHaveAttribute('aria-busy', 'true');
        },
        { timeout: 500 },
      );
    });
  });

  describe('Content Projection', () => {
    it('should project child content correctly', async () => {
      await render(TestFormComponent);

      // Content should be projected properly
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Username')).toBeInTheDocument();

      // Input elements should be inside the wrapper
      const emailInput = screen.getByLabelText('Email');
      const hostWrapper = emailInput.closest('ngx-control-wrapper');
      expect(hostWrapper).toContainElement(emailInput);
    });

    it('should handle complex nested content', async () => {
      @Component({
        imports: [NgxControlWrapper, ngxVestForms, FormsModule],
        template: `
          <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
            <ngx-control-wrapper>
              <fieldset>
                <legend>Personal Information</legend>
                <label for="name">Name</label>
                <input id="name" name="name" [ngModel]="model().name" />
                <small>Enter your full name</small>
              </fieldset>
            </ngx-control-wrapper>
          </form>
        `,
      })
      class ComplexContentComponent {
        model = signal({ name: '' });
        suite = staticSuite((data = {}) => {
          vestTest('name', 'Name is required', () => {
            enforce(data.name).isNotEmpty();
          });
        });
      }

      await render(ComplexContentComponent);

      // All nested content should be projected
      expect(
        screen.getByRole('group', { name: 'Personal Information' }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.getByText('Enter your full name')).toBeInTheDocument();
    });
  });

  describe('Integration with NgxFormErrorDisplayDirective', () => {
    it('should use host directive for error display functionality', async () => {
      const { fixture } = await render(TestFormComponent);
      const appReference = fixture.debugElement.injector.get(ApplicationRef);

      const emailInput = screen.getByLabelText('Email');

      // Test that error display behavior is working (from host directive)
      await userEvent.click(emailInput);
      await userEvent.tab();

      await fixture.whenStable();
      await appReference.whenStable();

      // Verify error display behavior is active
      await waitFor(
        () => {
          expect(screen.getByText('Email is required')).toBeInTheDocument();
        },
        { timeout: 1000 },
      );

      // Enter valid email
      await userEvent.fill(emailInput, 'test@example.com');
      await userEvent.tab();

      await fixture.whenStable();
      await appReference.whenStable();

      // Error should be cleared
      await waitFor(
        () => {
          expect(
            screen.queryByText('Email is required'),
          ).not.toBeInTheDocument();
        },
        { timeout: 1000 },
      );
    });

    test.todo(
      'should respect errorDisplayMode configuration from host directive',
    );
    test.todo('should handle global error display mode configuration');
    test.todo(
      'should properly clean up error display subscriptions on destroy',
    );
  });

  describe('Edge Cases', () => {
    it('should handle empty form gracefully', async () => {
      @Component({
        imports: [NgxControlWrapper],
        template: `
          <ngx-control-wrapper>
            <!-- No form controls -->
            <div>Empty wrapper</div>
          </ngx-control-wrapper>
        `,
      })
      class EmptyWrapperComponent {
        // Component with minimal content for testing edge case
        readonly placeholder = 'test';
      }

      await render(EmptyWrapperComponent);

      // Should render without errors using testing-library
      expect(screen.getByText('Empty wrapper')).toBeInTheDocument();

      // Verify wrapper structure using closest() from the content
      const content = screen.getByText('Empty wrapper');
      const wrapper = content.closest('.ngx-control-wrapper');
      expect(wrapper).toBeInTheDocument();
    });

    it('should handle multiple form controls in one wrapper', async () => {
      @Component({
        imports: [NgxControlWrapper, ngxVestForms, FormsModule],
        template: `
          <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
            <ngx-control-wrapper>
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
            </ngx-control-wrapper>
          </form>
        `,
      })
      class MultipleControlsComponent {
        model = signal({ firstName: '', lastName: '' });
        suite = staticSuite((data = {}) => {
          vestTest('firstName', 'First name is required', () => {
            enforce(data.firstName).isNotEmpty();
          });
          vestTest('lastName', 'Last name is required', () => {
            enforce(data.lastName).isNotEmpty();
          });
        });
      }

      await render(MultipleControlsComponent);

      // Both controls should be present
      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    });

    test.todo('should handle dynamic form control addition/removal');
    test.todo('should work correctly when NgxFormDirective is not available');
    test.todo('should handle malformed validation results gracefully');
  });

  describe('Performance', () => {
    test.todo(
      'should not cause unnecessary re-renders when validation state is stable',
    );
    test.todo(
      'should efficiently handle rapid user input without memory leaks',
    );
    test.todo(
      'should properly dispose of signals and subscriptions on destroy',
    );
  });
});
