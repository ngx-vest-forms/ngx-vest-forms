import { Component, signal } from '@angular/core';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { enforce, staticSuite, test as vestTest } from 'vest';
import { vestForms } from '../exports';

describe('FormModelDirective', () => {
  @Component({
    template: `
      <form
        scVestForm
        [suite]="suite"
        [(formValue)]="model"
        #vestForm="scVestForm"
      >
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
    imports: [...vestForms],
    standalone: true,
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

  it('should validate field and return errors when invalid', async () => {
    await render(HostComponent);
    const password = screen.getByPlaceholderText('password');
    await userEvent.type(password, 'short');
    await userEvent.tab();
    await waitFor(() => {
      expect(screen.getByTestId('form-valid').textContent).toBe('false');
    });
  });

  it('should return null when validation passes', async () => {
    await render(HostComponent);
    const email = screen.getByPlaceholderText('email');
    const password = screen.getByPlaceholderText('password');
    await userEvent.type(email, 'user@example.com');
    await userEvent.type(password, 'longenough');
    await userEvent.tab();
    // Wait for form to become valid
    await waitFor(
      () => {
        expect(screen.getByTestId('form-valid').textContent).toBe('true');
      },
      { timeout: 1000 }
    );
  });

  it('should determine correct field name from ngModel name attribute (email)', async () => {
    await render(HostComponent);
    const email = screen.getByPlaceholderText('email');
    await userEvent.type(email, 'test@example.com');
    await userEvent.tab();
    expect(email).toBeInTheDocument();
  });

  it('should hydrate initial value with recommended [ngModel] binding', async () => {
    @Component({
      template: `
        <form
          scVestForm
          [suite]="suite"
          [(formValue)]="model"
          #vestForm="scVestForm"
        >
          <input name="email" [ngModel]="model().email" placeholder="email" />
        </form>
      `,
      imports: [...vestForms],
      standalone: true,
    })
    class PrepopulatedHost {
      model = signal<{ email: string }>({ email: 'preset@example.com' });
      suite = staticSuite((data: { email?: string } = {}) => {
        vestTest('email', 'Email required', () => {
          enforce(data.email).isNotEmpty();
        });
      });
    }
    await render(PrepopulatedHost);
    const email = screen.getByPlaceholderText('email') as HTMLInputElement;
    expect(email.value).toBe('preset@example.com');
  });
});
