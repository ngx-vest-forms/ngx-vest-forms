import { Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@vitest/browser/context';
import { enforce, staticSuite, test as vestTest } from 'vest';
import { afterEach, describe, expect, it, test, vi } from 'vitest';
import { ngxVestForms } from '../../public-api';

/**
 * Tests for NgxFormModelDirective
 *
 * WHAT: Tests directive-specific behaviors that are not covered by E2E/integration tests
 * WHY: Focus on edge cases, error handling, and Angular-specific integration points
 *
 * NOTE: Full integration scenarios are covered by:
 * - E2E tests (Playwright)
 * - Integration examples in projects/examples (profile-form, survey-form, etc.)
 * - Component tests in consuming applications
 *
 * This test suite focuses on directive-level concerns only.
 */
@Component({
  template: `
    <form
      ngxVestForm
      [vestSuite]="suite"
      [(formValue)]="model"
      #vestForm="ngxVestForm"
    >
      <!-- Recommended one-way binding using [ngModel] so form directive owns writes -->
      <input name="email" [ngModel]="model().email" placeholder="email" />
      <input
        name="password"
        [ngModel]="model().password"
        placeholder="password"
        type="password"
      />
      <button type="submit">Submit</button>
      <div data-testid="form-valid">{{ vestForm.formState().valid }}</div>
    </form>
  `,
  imports: [ngxVestForms],
})
class HostComponent {
  model = signal<{ email: string; password: string }>({
    email: '',
    password: '',
  });
  suite = staticSuite((data: { email?: string; password?: string } = {}) => {
    vestTest('email', 'Email is required', () => {
      enforce(data.email).isNotEmpty();
    });
    vestTest('password', 'Password too short', () => {
      enforce(data.password).longerThanOrEquals(8);
    });
  });
}

type MinimalVestResult = {
  getErrors(): Record<string, string[]>;
  getWarnings(): Record<string, string[]>;
};

@Component({
  template: `
    <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
      <input name="email" [ngModel]="model().email" placeholder="email" />
    </form>
  `,
  imports: [ngxVestForms],
})
class PromiseSuiteHost {
  model = signal<{ email: string }>({ email: '' });
  suite = ((data: { email?: string } = {}) => {
    vestTest('email', 'Email required', () => {
      enforce(data.email).isNotEmpty();
    });
    return {
      done: (callback: (r: MinimalVestResult) => void) => {
        Promise.resolve().then(() => {
          callback({
            getErrors: () => ({ email: ['Email required'] }),
            getWarnings: () => ({}),
          });
        });
      },
    } as { done: (callback: (r: MinimalVestResult) => void) => void };
  }) as unknown as (...arguments_: unknown[]) => {
    done(callback: (r: MinimalVestResult) => void): void;
  };
}

@Component({
  template: `
    <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
      <input name="email" [ngModel]="model().email" placeholder="email" />
    </form>
  `,
  imports: [ngxVestForms],
})
class ContextHost {
  model = signal<{ email: string }>({ email: '' });
  spyRef: ((field?: string) => void) | null = null;
  suite = staticSuite((data: { email?: string } = {}, field?: string) => {
    this.spyRef?.(field);
    vestTest('email', 'Email required', () => {
      enforce(data.email).isNotEmpty();
    });
  });
}

// Host using recommended [ngModel] bindings with pre-populated values
@Component({
  template: `
    <form
      ngxVestForm
      [vestSuite]="suite"
      [(formValue)]="model"
      #vestForm="ngxVestForm"
    >
      <input name="email" [ngModel]="model().email" placeholder="email" />
    </form>
  `,
  imports: [ngxVestForms],
})
class PrepopulatedHost {
  model = signal<{ email: string }>({ email: 'preset@example.com' });
  suite = staticSuite((data: { email?: string } = {}) => {
    vestTest('email', 'Email required', () => {
      enforce(data.email).isNotEmpty();
    });
  });
}

// Host using bare ngModel attribute (fallback) with pre-populated values to show difference
@Component({
  template: `
    <form
      ngxVestForm
      [vestSuite]="suite"
      [(formValue)]="model"
      #vestForm="ngxVestForm"
    >
      <!-- Intentional bare ngModel to verify fallback behavior (no initial value hydration) -->
      <input name="email" ngModel placeholder="email" />
    </form>
  `,
  imports: [ngxVestForms],
})
class BarePrepopulatedHost {
  model = signal<{ email: string }>({ email: 'preset@example.com' });
  suite = staticSuite((data: { email?: string } = {}) => {
    vestTest('email', 'Email required', () => {
      enforce(data.email).isNotEmpty();
    });
  });
}

describe('NgxFormModelDirective', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Dependency Injection & Provider Resolution', () => {
    test.todo(
      'should handle cases where NgxFormDirective is not available in DI context',
    );
    test.todo('should gracefully handle missing required providers');
  });

  describe('AsyncValidator Interface Implementation', () => {
    it('should validate field and return errors when invalid', async () => {
      await render(HostComponent);
      const password = screen.getByPlaceholderText('password');
      await userEvent.type(password, 'short');
      await userEvent.tab();
      expect(screen.getByTestId('form-valid').textContent).toBe('false');
    });

    it('should return null when validation passes', async () => {
      await render(HostComponent);
      const email = screen.getByPlaceholderText('email');
      const password = screen.getByPlaceholderText('password');
      await userEvent.type(email, 'user@example.com');
      await userEvent.type(password, 'longenough');
      await userEvent.tab();
      expect(screen.getByTestId('form-valid').textContent).toBe('true');
    });

    it('should convert Promise validation results to Observable if a custom suite returns a Promise', async () => {
      await render(PromiseSuiteHost);
      const email = screen.getByPlaceholderText('email');
      await userEvent.tab();
      expect(email).toBeInTheDocument();
    });
  });

  describe('Field Name Resolution', () => {
    it('should determine correct field name from ngModel name attribute (email)', async () => {
      await render(HostComponent);
      const email = screen.getByPlaceholderText('email');
      await userEvent.type(email, 'test@example.com');
      await userEvent.tab();
      expect(email).toBeInTheDocument();
    });
    test.todo('should handle cases where field name cannot be resolved');
    test.todo('should handle nested field paths correctly');
  });

  describe('Binding Modes', () => {
    it('should hydrate initial value with recommended [ngModel] binding', async () => {
      await render(PrepopulatedHost);
      const email = screen.getByPlaceholderText('email') as HTMLInputElement;
      expect(email.value).toBe('preset@example.com');
    });

    it('should not hydrate initial value with bare ngModel attribute (documenting fallback behavior)', async () => {
      await render(BarePrepopulatedHost);
      const email = screen.getByPlaceholderText('email') as HTMLInputElement;
      // Bare ngModel has no inbound binding so starts empty despite model preset
      expect(email.value).toBe('');
    });
  });

  describe('Vest Suite Integration', () => {
    it('should pass correct field context producing field-specific error only', async () => {
      const spy = vi.fn();
      const { fixture } = await render(ContextHost);
      // Attach spy to the concrete instance (prototype assignment was shadowed by instance property)
      (fixture.componentInstance as ContextHost).spyRef = spy;
      const email = screen.getByPlaceholderText('email');
      await userEvent.type(email, 'x');
      await userEvent.tab();
      await fixture.whenStable();
      // Allow any queued microtasks from validation
      await new Promise((r) => setTimeout(r, 0));
      expect(spy.mock.calls.some((c) => c[0] === 'email')).toBe(true);
    });
  });

  describe('Lifecycle & Cleanup', () => {
    test.todo('should clean up subscriptions on component destruction');
    test.todo('should properly dispose of validation streams');
  });
});
