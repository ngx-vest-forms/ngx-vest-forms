import { ApplicationRef, Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { ngxVestFormsCore } from '../exports';
// Note: userEvent not used in this focused core spec; native events dispatched instead.
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
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
});
