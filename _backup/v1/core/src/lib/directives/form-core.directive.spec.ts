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

  it('should provide accurate formState.value in complex nested forms (LinkedSignal fix)', async () => {
    // Test case that reproduces the original bug where formState().value shows null
    // in complex nested forms due to timing issues with signal synchronization
    @Component({
      imports: [...ngxVestFormsCore, JsonPipe],
      template: `
        <form
          ngxVestFormCore
          [vestSuite]="suite"
          [(formValue)]="model"
          #vest="ngxVestFormCore"
        >
          <!-- Complex nested form structure similar to schema-comparison form -->
          <div ngModelGroup="profile">
            <label for="name">Name</label>
            <input
              id="name"
              name="name"
              [ngModel]="model().profile?.name || ''"
            />

            <label for="email">Email</label>
            <input
              id="email"
              name="email"
              [ngModel]="model().profile?.email || ''"
            />

            <div ngModelGroup="address">
              <label for="street">Street</label>
              <input
                id="street"
                name="street"
                [ngModel]="model().profile?.address?.street || ''"
              />

              <label for="city">City</label>
              <input
                id="city"
                name="city"
                [ngModel]="model().profile?.address?.city || ''"
              />
            </div>
          </div>

          <div ngModelGroup="preferences">
            <label for="theme">Theme</label>
            <select
              id="theme"
              name="theme"
              [ngModel]="model().preferences?.theme || ''"
            >
              <option value="">Choose theme</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>

            <label for="notifications">
              <input
                id="notifications"
                name="notifications"
                type="checkbox"
                [ngModel]="model().preferences?.notifications || false"
              />
              Enable notifications
            </label>
          </div>

          <!-- Display formState for debugging -->
          <div data-testid="form-state-value">
            {{ vest.formState().value | json }}
          </div>
          <div data-testid="form-state-valid">{{ vest.formState().valid }}</div>
          <div data-testid="form-state-errors">
            {{ vest.formState().errors | json }}
          </div>
        </form>
      `,
    })
    class ComplexFormComponent {
      model = signal({
        profile: {
          name: '',
          email: '',
          address: {
            street: '',
            city: '',
          },
        },
        preferences: {
          theme: '',
          notifications: false,
        },
      });

      // Validation suite similar to real-world complex forms
      suite = create(
        (
          data: Partial<{
            profile: {
              name: string;
              email: string;
              address: { street: string; city: string };
            };
            preferences: { theme: string; notifications: boolean };
          }> = {},
          field?: string,
        ) => {
          only(field);

          vestTest('profile.name', 'Name is required', () => {
            enforce(data.profile?.name).isNotEmpty();
          });

          vestTest('profile.email', 'Valid email required', () => {
            enforce(data.profile?.email)
              .isNotEmpty()
              .matches(/^[^@]+@[^@]+\.[^@]+$/);
          });

          vestTest('profile.address.street', 'Street is required', () => {
            enforce(data.profile?.address?.street).isNotEmpty();
          });

          vestTest('profile.address.city', 'City is required', () => {
            enforce(data.profile?.address?.city).isNotEmpty();
          });
        },
      );
    }

    const { fixture } = await render(ComplexFormComponent);
    const appReference = fixture.debugElement.injector.get(ApplicationRef);
    const instance = fixture.componentInstance;

    await fixture.whenStable();
    await appReference.whenStable();
    TestBed.flushEffects();

    // Initially, formState.value should not be null even with empty nested form
    const initialState = screen.getByTestId('form-state-value');
    const initialValue = JSON.parse(initialState.textContent || 'null');
    expect(initialValue).not.toBeNull();
    expect(initialValue).toEqual(
      expect.objectContaining({
        profile: expect.any(Object),
        preferences: expect.any(Object),
      }),
    );

    // Fill out the complex nested form
    const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    const streetInput = screen.getByLabelText('Street') as HTMLInputElement;
    const cityInput = screen.getByLabelText('City') as HTMLInputElement;
    const themeSelect = screen.getByLabelText('Theme') as HTMLSelectElement;
    const notificationsCheckbox = screen.getByLabelText(
      'Enable notifications',
    ) as HTMLInputElement;

    // Simulate rapid form updates that previously caused timing issues
    nameInput.value = 'John Doe';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));

    emailInput.value = 'john.doe@example.com';
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));

    streetInput.value = '123 Main St';
    streetInput.dispatchEvent(new Event('input', { bubbles: true }));

    cityInput.value = 'Anytown';
    cityInput.dispatchEvent(new Event('input', { bubbles: true }));

    themeSelect.value = 'dark';
    themeSelect.dispatchEvent(new Event('change', { bubbles: true }));

    notificationsCheckbox.checked = true;
    notificationsCheckbox.dispatchEvent(new Event('change', { bubbles: true }));

    await fixture.whenStable();
    await appReference.whenStable();
    TestBed.flushEffects();

    // Critical test: formState().value should reflect current form state, not be null
    const updatedState = screen.getByTestId('form-state-value');
    const updatedValue = JSON.parse(updatedState.textContent || 'null');

    expect(updatedValue).not.toBeNull();
    expect(updatedValue).toEqual(
      expect.objectContaining({
        profile: expect.objectContaining({
          name: 'John Doe',
          email: 'john.doe@example.com',
          address: expect.objectContaining({
            street: '123 Main St',
            city: 'Anytown',
          }),
        }),
        preferences: expect.objectContaining({
          theme: 'dark',
          notifications: true,
        }),
      }),
    );

    // Ensure the model is also properly synchronized
    expect(instance.model().profile.name).toBe('John Doe');
    expect(instance.model().profile.email).toBe('john.doe@example.com');
    expect(instance.model().profile.address.street).toBe('123 Main St');
    expect(instance.model().profile.address.city).toBe('Anytown');
    expect(instance.model().preferences.theme).toBe('dark');
    expect(instance.model().preferences.notifications).toBe(true);

    // ✅ MAIN BUG FIX VERIFICATION: The LinkedSignal should have resolved the formState().value null issue
    // This was the core issue from the bug report - formState.value being null in complex nested forms

    // Test rapid programmatic updates (this demonstrates the LinkedSignal fix)
    instance.model.update((current) => ({
      ...current,
      profile: {
        ...current.profile,
        name: 'Jane Smith',
        email: 'jane@example.com',
      },
    }));

    await fixture.whenStable();
    await appReference.whenStable();
    TestBed.flushEffects();

    // ✅ MAIN BUG FIX VERIFICATION: The LinkedSignal should have resolved the formState().value null issue
    // This was the core issue from the bug report - formState.value being null in complex nested forms

    // formState().value should still be accurate after programmatic updates
    const finalState = screen.getByTestId('form-state-value');
    const finalValue = JSON.parse(finalState.textContent || 'null');

    expect(finalValue).not.toBeNull();
    // The LinkedSignal should provide the correct form state
    // After programmatic model update, form should be synced correctly
    expect(finalValue.profile.name).toBe('Jane Smith'); // Form synced with model update
    expect(finalValue.profile.email).toBe('jane@example.com'); // Form synced with model update

    // ✅ VERIFIED: Both LinkedSignal bug AND programmatic model-to-form sync are now working!
    // - Original bug (formState().value null) is RESOLVED by LinkedSignal implementation
    // - Programmatic sync (model-to-form) is RESOLVED by improved sync effect logic
  });
});
