import { JsonPipe } from '@angular/common';
import { ApplicationRef, Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@vitest/browser/context';
import { ngxVestFormsCore } from 'ngx-vest-forms/core';
import { describe, expect, it } from 'vitest';
import { NgxSchemaValidationDirective } from './schema-validation.directive';

@Component({
  imports: [ngxVestFormsCore, NgxSchemaValidationDirective, JsonPipe],
  template: `
    <form
      ngxVestFormCore
      aria-label="Schema form"
      [formSchema]="schema()"
      #ngx="ngxSchemaValidation"
    >
      <label for="email">Email</label>
      <input id="email" name="email" [ngModel]="''" />

      <button type="submit">Submit</button>

      <pre data-testid="schema">{{ ngx.schema() | json }}</pre>
    </form>
  `,
})
class HostComponent {
  schema = signal<unknown>(null);
}

describe('NgxSchemaValidationDirective', () => {
  it('reports schema issues on submit (failure case)', async () => {
    const { fixture } = await render(HostComponent);
    const appReference = fixture.debugElement.injector.get(ApplicationRef);

    // Provide a schema-like object with safeParse that fails
    const failing = {
      safeParse: () => ({
        success: false,
        issues: [
          { path: ['email'], message: 'Invalid email' },
          { path: [], message: 'Generic failure' },
        ],
      }),
    } as const;

    fixture.componentInstance.schema.set(failing);
    await fixture.whenStable();
    await appReference.whenStable();

    // Submit form
    const submit = screen.getByRole('button', { name: /submit/i });
    await userEvent.click(submit);
    await fixture.whenStable();
    await appReference.whenStable();

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
    expect(parsed?.issues?.length).toBe(2);
    expect(parsed?.errorMap?.['email']?.[0]).toBe('Invalid email');
    expect(parsed?.errorMap?.['_root']?.[0]).toBe('Generic failure');
  });

  it('reports success with no issues on submit', async () => {
    const { fixture } = await render(HostComponent);
    const appReference = fixture.debugElement.injector.get(ApplicationRef);

    // Provide a schema-like object with safeParse that succeeds
    const succeeding = {
      safeParse: () => ({ success: true, data: {} }),
    } as const;

    fixture.componentInstance.schema.set(succeeding);
    await fixture.whenStable();
    await appReference.whenStable();

    // Submit form
    const submit = screen.getByRole('button', { name: /submit/i });
    await userEvent.click(submit);
    await fixture.whenStable();
    await appReference.whenStable();

    const parsed = JSON.parse(
      screen.getByTestId('schema').textContent || 'null',
    ) as {
      hasRun?: boolean;
      success?: boolean | null;
      issues?: { path?: string; message: string }[];
      errorMap?: Record<string, string[]>;
    } | null;

    expect(parsed?.hasRun).toBe(true);
    expect(parsed?.success).toBe(true);
    expect(parsed?.issues?.length).toBe(0);
  });
});
