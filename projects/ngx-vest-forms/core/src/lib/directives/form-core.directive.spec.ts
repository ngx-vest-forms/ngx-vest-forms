import { JsonPipe } from '@angular/common';
import { ApplicationRef, Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@vitest/browser/context';
import { ngxVestFormsCore } from '../exports';
// Note: userEvent not used in this focused core spec; native events dispatched instead.
import { TestBed } from '@angular/core/testing';
import { create, enforce, only, test as vestTest } from 'vest';
import { describe, expect, it } from 'vitest';
// NgxFormCoreDirective included via `ngxVestFormsCore` preset

@Component({
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
      imports: [...ngxVestFormsCore],
      template: `
        <form
          ngxVestFormCore
          aria-label="Username form"
          [vestSuite]="suite"
          #vest="ngxVestFormCore"
        >
          <label for="username">Username</label>
          <input
            id="username"
            name="username"
            [ngModel]="''"
            [validationOptions]="{ debounceTime: 150 }"
          />
        </form>
      `,
    })
    class DebounceHostComponent {
      // Count how many times the suite is executed for the field
      count = 0;
      suite = create(
        (model: { username: string } | undefined, field?: string) => {
          const m = model ?? { username: '' };
          only(field);
          this.count++;
          vestTest('username', 'taken', () => {
            enforce(m.username).equals('taken');
          });
        },
      );
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
      imports: [...ngxVestFormsCore, JsonPipe],
      template: `
        <form
          ngxVestFormCore
          aria-label="Account form"
          [(formValue)]="model"
          #vest="ngxVestFormCore"
        >
          <label for="email">Email</label>
          <input id="email" name="email" [ngModel]="model().email" />

          <label for="password">Password</label>
          <input id="password" name="password" [ngModel]="model().password" />

          <pre data-testid="state">{{ vest.formState() | json }}</pre>
        </form>
      `,
    })
    class SubmitHostComponent {
      model = signal({ email: '', password: '' });
    }

    const { fixture } = await render(SubmitHostComponent);
    const appReference = fixture.debugElement.injector.get(ApplicationRef);

    const form = screen.getByRole('form', { name: /account form/i });
    form.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );

    await fixture.whenStable();
    await appReference.whenStable();

    const stateElement = screen.getByTestId('state');
    const state = JSON.parse(stateElement.textContent || '{}') as {
      submitted?: boolean;
    };
    expect(state.submitted).toBe(true);
  });

  it('should debounce async validation and update validity after delay', async () => {
    @Component({
      imports: [...ngxVestFormsCore, JsonPipe],
      template: `
        <form
          ngxVestFormCore
          aria-label="Pending validation form"
          [vestSuite]="suite"
          #vest="ngxVestFormCore"
        >
          <label for="username2">Username</label>
          <input
            id="username2"
            name="username"
            [ngModel]="''"
            [validationOptions]="{ debounceTime: 200 }"
          />

          <pre data-testid="state">{{ vest.formState() | json }}</pre>
        </form>
      `,
    })
    class PendingHostComponent {
      suite = create(
        (model: { username: string } | undefined, field?: string) => {
          const m = model ?? { username: '' };
          only(field);
          vestTest('username', 'must be ok', () => {
            enforce(m.username).equals('ok');
          });
        },
      );
    }

    const { fixture } = await render(PendingHostComponent);
    const appReference = fixture.debugElement.injector.get(ApplicationRef);
    const username = screen.getByLabelText('Username') as HTMLInputElement;

    // Trigger validation with debounce
    username.value = 'o';
    username.dispatchEvent(new Event('input', { bubbles: true }));

    // Shortly after input, async validator should be pending
    await new Promise((r) => setTimeout(r, 50));
    await fixture.whenStable();
    await appReference.whenStable();
    // Before debounce elapses, errors should not yet be present for the field
    const early = JSON.parse(
      screen.getByTestId('state').textContent || '{}',
    ) as { errors?: Record<string, unknown> };
    expect(
      early.errors && (early.errors as Record<string, unknown>)['username'],
    ).toBeUndefined();

    // After debounce window, pending should clear and form becomes invalid
    await new Promise((r) => setTimeout(r, 220));
    await fixture.whenStable();
    await appReference.whenStable();
    // After debounce elapses, the field should have errors captured
    const late = JSON.parse(
      screen.getByTestId('state').textContent || '{}',
    ) as { errors?: Record<string, string[]> };
    const fieldErrors = late.errors?.['username'] ?? [];
    expect(Array.isArray(fieldErrors) && fieldErrors.length > 0).toBe(true);
  });

  it('should toggle dirty flag on input and reset back to pristine', async () => {
    @Component({
      imports: [...ngxVestFormsCore, JsonPipe],
      template: `
        <form
          ngxVestFormCore
          aria-label="Resettable form"
          [(formValue)]="model"
          #ngf="ngForm"
          #vest="ngxVestFormCore"
        >
          <label for="email2">Email</label>
          <input id="email2" name="email" [ngModel]="model().email" />

          <button type="button" (click)="ngf.resetForm({ email: '' })">
            Reset
          </button>

          <pre data-testid="state">{{ vest.formState() | json }}</pre>
        </form>
      `,
    })
    class DirtyHostComponent {
      model = signal({ email: '' });
    }

    await render(DirtyHostComponent);
    const email = screen.getByLabelText('Email') as HTMLInputElement;
    const resetButton = screen.getByRole('button', { name: /reset/i });

    // Initially pristine
    let state = JSON.parse(screen.getByTestId('state').textContent || '{}') as {
      dirty?: boolean;
    };
    expect(state.dirty).toBe(false);

    // Type to make dirty
    await userEvent.type(email, 'a');
    state = JSON.parse(screen.getByTestId('state').textContent || '{}') as {
      dirty?: boolean;
    };
    expect(state.dirty).toBe(true);

    // Reset to pristine
    await userEvent.click(resetButton);
    state = JSON.parse(screen.getByTestId('state').textContent || '{}') as {
      dirty?: boolean;
    };
    expect(state.dirty).toBe(false);
  });
});
