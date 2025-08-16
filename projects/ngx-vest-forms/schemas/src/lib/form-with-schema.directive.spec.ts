import { JsonPipe } from '@angular/common';
import { ApplicationRef, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@vitest/browser/context';
import { ngxVestFormsCore } from 'ngx-vest-forms/core';
import { NgxVestFormWithSchemaDirective } from 'ngx-vest-forms/schemas';
import { enforce, staticSuite, test as vestTest } from 'vest';
import { describe, expect, it } from 'vitest';

type Model = { email: string; password: string };

// Vest suite for tests
const suite = staticSuite((data: Partial<Model> = {}) => {
  vestTest('email', 'Please provide a valid email', () => {
    enforce(data.email)
      .isNotEmpty()
      .matches(/^[^@]+@[^@]+\.[^@]+$/);
  });
  vestTest('password', 'Passwords must match email', () => {
    enforce(data.password).equals(data.email);
  });
});

@Component({
  // Use the wrapper + FormsModule for a realistic host
  imports: [
    FormsModule,
    ngxVestFormsCore,
    NgxVestFormWithSchemaDirective,
    JsonPipe,
  ],
  template: `
    <form
      ngxVestFormWithSchema
      aria-label="Wrapper form"
      [vestSuite]="vestSuite"
      [formSchema]="schema()"
      [validationConfig]="validationConfig()"
      [validationOptions]="validationOptions"
      [(formValue)]="model"
      #vestForm="ngxVestForm"
    >
      <label for="email">Email</label>
      <input id="email" name="email" type="email" [ngModel]="model().email" />

      <label for="password">Password</label>
      <input
        id="password"
        name="password"
        type="password"
        [ngModel]="model().password"
      />

      <button type="submit">Submit</button>

      <div data-testid="status">{{ vestForm.formState().status }}</div>
      <div data-testid="valid">{{ vestForm.formState().valid }}</div>
      <div data-testid="error-count">{{ vestForm.formState().errorCount }}</div>
      <div data-testid="first-invalid">
        {{ vestForm.formState().firstInvalidField }}
      </div>
      <pre data-testid="errors">{{ vestForm.formState().errors | json }}</pre>
      <pre data-testid="schema">{{ vestForm.formState().schema | json }}</pre>
    </form>
  `,
})
class WrapperHostComponent {
  // Two-way bound model
  model = signal<Model>({ email: '', password: '' });

  // Provide vest suite to wrapper
  vestSuite = suite;

  // Optional schema for submit-time validation – keep null for these tests
  schema = signal<unknown>(null);

  // validation dependencies, configured per test
  validationConfig = signal<Record<string, string[]> | null>(null);

  // reduce debounce for deterministic tests
  validationOptions = { debounceTime: 0 } as const;
}

describe('NgxVestFormWithSchemaDirective (wrapper)', () => {
  it('exposes enriched formState with errorCount and firstInvalidField', async () => {
    const { fixture } = await render(WrapperHostComponent);
    const appReference = fixture.debugElement.injector.get(ApplicationRef);

    const email = screen.getByLabelText('Email');
    const password = screen.getByLabelText('Password');

    // Enter invalid email first to trigger an email error
    await userEvent.type(email, 'invalid');
    await fixture.whenStable();
    await appReference.whenStable();

    // Expect firstInvalidField to be 'email' and errorCount >= 1
    await expect(screen.getByTestId('first-invalid')).toHaveTextContent(
      'email',
    );
    // Errors JSON should contain email message
    await expect
      .element(screen.getByTestId('errors'))
      .toHaveTextContent('Please provide a valid email');

    // Now make email valid and cause password to be invalid (must equal email per suite)
    await userEvent.clear(email);
    await userEvent.type(email, 'a@b.co');
    await userEvent.type(password, 'no-match');
    await fixture.whenStable();
    await appReference.whenStable();

    // After fixing email, first invalid should be password
    await expect(screen.getByTestId('first-invalid')).toHaveTextContent(
      'password',
    );
    await expect
      .element(screen.getByTestId('errors'))
      .toHaveTextContent('Passwords must match email');
  });

  it('revalidates dependent fields when validationConfig specifies dependencies', async () => {
    const { fixture } = await render(WrapperHostComponent);
    const appReference = fixture.debugElement.injector.get(ApplicationRef);

    // Configure: when email changes, revalidate password
    fixture.componentInstance.validationConfig.set({ email: ['password'] });

    // Start with matching values so the form is valid
    const email = screen.getByLabelText('Email');
    const password = screen.getByLabelText('Password');
    await userEvent.clear(email);
    await userEvent.type(email, 'x@y.z');
    await userEvent.clear(password);
    await userEvent.type(password, 'x@y.z');
    await fixture.whenStable();
    await appReference.whenStable();

    // Sanity: should be valid and no password error
    await expect(screen.getByTestId('valid')).toHaveTextContent('true');
    await expect
      .element(screen.getByTestId('errors'))
      .not.toHaveTextContent('Passwords must match email');

    // Change email only – dependency should revalidate password and surface an error
    await userEvent.clear(email);
    await userEvent.type(email, 'changed@example.com');

    // Wait for Angular/validators to process
    await fixture.whenStable();
    await appReference.whenStable();

    // Password should now be invalid because it no longer equals email
    await expect
      .element(screen.getByTestId('errors'))
      .toHaveTextContent('Passwords must match email');
    await expect(screen.getByTestId('valid')).toHaveTextContent('false');
  });

  it('runs schema validation on submit and exposes result via formState().schema', async () => {
    const { fixture } = await render(WrapperHostComponent);
    const appReference = fixture.debugElement.injector.get(ApplicationRef);

    // Provide a runtime-like schema with safeParse that fails
    const failing = {
      safeParse: () => ({
        success: false,
        issues: [
          { path: 'email', message: 'Invalid email' },
          { path: '', message: 'Generic failure' },
        ],
      }),
    } as const;

    fixture.componentInstance.schema.set(failing);
    await fixture.whenStable();
    await appReference.whenStable();

    // Submit
    const submit = screen.getByRole('button', { name: /submit/i });
    await userEvent.click(submit);
    await fixture.whenStable();
    await appReference.whenStable();

    // Assert schema state via JSON
    const parsed = JSON.parse(
      screen.getByTestId('schema').textContent || 'null',
    ) as {
      hasRun?: boolean;
      success?: boolean | null;
      issues?: { path?: string; message: string }[];
      errorMap?: Record<string, string[]>;
    } | null;

    expect(parsed?.hasRun).toBe(true);
    expect(parsed?.success).toBe(false);
    expect(
      parsed?.issues?.some((issue) => issue.message === 'Invalid email'),
    ).toBe(true);
  });
});
