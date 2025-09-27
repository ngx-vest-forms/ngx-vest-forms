import { Component, signal } from '@angular/core';
import { render, screen, fireEvent } from '@testing-library/angular';
import { waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { enforce, staticSuite, test as vestTest, only } from 'vest';
import { vestForms } from '../../exports';

// Test validation suite for the component tests
type TestModel = {
  email?: string;
  username?: string;
};

const testSuite = staticSuite((data: TestModel = {}, field?: string) => {
  if (field) {
    only(field);
  }
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

    // Async validation suite for pending state tests
    const asyncSuite = staticSuite((data: TestModel = {}, field?: string) => {
      if (field) {
        only(field);
      }
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
            <input
              id="firstName"
              name="firstName"
              [ngModel]="model().firstName"
            />
            <label for="lastName">Last Name</label>
            <input id="lastName" name="lastName" [ngModel]="model().lastName" />
          </sc-control-wrapper>
        </form>
      `,
    })
    class MultipleControlsComponent {
      model = signal({ firstName: '', lastName: '' });
    }

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
      expect(errorContainer).toHaveAttribute('aria-live', 'polite');
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
});
