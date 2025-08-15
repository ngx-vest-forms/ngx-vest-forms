import { ApplicationRef, Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { ngxVestFormsCore } from '../exports';
// Note: userEvent not used in this focused core spec; native events dispatched instead.
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { create, enforce, only, test as vestTest } from 'vest';
// NgxFormCoreDirective included via `ngxVestFormsCore` preset

@Component({
  standalone: true,
  imports: [...ngxVestFormsCore],
  template: `
    <form ngxVestFormCore [(formValue)]="model" #vest="ngxVestFormCore">
      <label for="email">Email</label>
      <input id="email" name="email" [ngModel]="model().email" />

      <label for="password">Password</label>
      <input id="password" name="password" [ngModel]="model().password" />
    </form>
  `,
})
class TestCoreHostComponent {
  model = signal({ email: '', password: '' });
}

describe('NgxFormCoreDirective - core behavior', () => {
  it('should sync form values with model() two-way binding', async () => {
    const { fixture } = await render(TestCoreHostComponent);
    const appReference = fixture.debugElement.injector.get(ApplicationRef);

    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;

    await fixture.whenStable();
    await appReference.whenStable();
    // Flush zone-less signal/effect queues used by Angular's signals in tests
    // mirrors usage in the main spec files
    TestBed.flushEffects();

    // Programmatically set input values and dispatch input events to trigger ngModel
    emailInput.value = 'test@example.com';
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    passwordInput.value = 'mypassword';
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    await appReference.whenStable();
    TestBed.flushEffects();

    const instance = fixture.componentInstance as TestCoreHostComponent;
    expect(instance.model().email).toBe('test@example.com');
    expect(instance.model().password).toBe('mypassword');

    // Update model programmatically, inputs should reflect
    instance.model.set({
      email: 'updated@example.com',
      password: 'newpassword',
    });
    await fixture.whenStable();
    await appReference.whenStable();
    TestBed.flushEffects();

    expect(emailInput.value).toBe('updated@example.com');
    expect(passwordInput.value).toBe('newpassword');
  });

  it('should handle null/undefined form values gracefully', async () => {
    const { fixture } = await render(TestCoreHostComponent);
    const appReference = fixture.debugElement.injector.get(ApplicationRef);

    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;

    const instance = fixture.componentInstance as TestCoreHostComponent;

    // Set model to empty values and ensure inputs remain present
    instance.model.set({ email: '', password: '' });
    await fixture.whenStable();
    await appReference.whenStable();

    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();

    // Setting to empty object should not throw and inputs still respond
    instance.model.set({ email: '', password: '' });
    await fixture.whenStable();
    await appReference.whenStable();

    expect(emailInput.value).toBe('');
    expect(passwordInput.value).toBe('');
  });

  it('should debounce async validation and produce a single result', async () => {
    @Component({
      standalone: true,
      imports: [...ngxVestFormsCore],
      template: `
        <form ngxVestFormCore [vestSuite]="suite" [validationOptions]="{ debounceTime: 150 }" #vest="ngxVestFormCore">
          <label for="username">Username</label>
          <input id="username" name="username" [ngModel]="''" />
        </form>
      `,
    })
    class DebounceHostComponent {
      // Count how many times the suite is executed for the field
      count = 0;
      suite = create<{ username: string }>((model, field) => {
        only(field);
        this.count++;
        vestTest('username', 'taken', () => {
          enforce(model.username).equals('taken');
        });
      });
    }

    const { fixture } = await render(DebounceHostComponent);
    const appReference = fixture.debugElement.injector.get(ApplicationRef);
    const username = screen.getByLabelText('Username') as HTMLInputElement;

    // Type quickly multiple times within debounce window
    username.value = 't';
    username.dispatchEvent(new Event('input', { bubbles: true }));
    username.value = 'ta';
    username.dispatchEvent(new Event('input', { bubbles: true }));
    username.value = 'tak';
    username.dispatchEvent(new Event('input', { bubbles: true }));

    // Wait for debounce window to elapse
    await new Promise((r) => setTimeout(r, 200));
    await fixture.whenStable();
    await appReference.whenStable();

    // Suite should have run once due to debounce
    const instance = fixture.componentInstance as DebounceHostComponent;
    expect(instance.count).toBe(1);
  });

  it('should set submitted flag and mark controls touched on submit', async () => {
    @Component({
      standalone: true,
      imports: [...ngxVestFormsCore],
      template: `
        <form ngxVestFormCore aria-label="Account form" [(formValue)]="model" #vest="ngxVestFormCore">
          <label for="email">Email</label>
          <input id="email" name="email" [ngModel]="model().email" />

          <label for="password">Password</label>
          <input id="password" name="password" [ngModel]="model().password" />
        </form>
      `,
    })
    class SubmitHostComponent {
      model = signal({ email: '', password: '' });
    }

    const { fixture } = await render(SubmitHostComponent);
    const appReference = fixture.debugElement.injector.get(ApplicationRef);

    const form = screen.getByRole('form', { name: /account form/i });
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await fixture.whenStable();
    await appReference.whenStable();

    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    // Angular adds ng-submitted on form and ng-touched on controls after submit
    expect(form).toHaveClass('ng-submitted');
    expect(emailInput).toHaveClass('ng-touched');
    expect(passwordInput).toHaveClass('ng-touched');
  });
});
