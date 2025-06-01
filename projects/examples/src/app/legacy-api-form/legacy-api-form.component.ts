// Legacy API Example: Demonstrates deprecated v1 API usage for ngx-vest-forms
// - Uses [formValue] and (formValueChange) instead of [(formValue)]
// - Uses deprecated signals (isValid, errors, etc.)
// - Manually displays errors (no <sc-control-wrapper>)
// - For demonstration and migration guidance only

import { Component, signal } from '@angular/core';
import { vestForms } from 'ngx-vest-forms';
import { enforce, only, staticSuite, test } from 'vest';

type LegacyFormModel = { username: string; password: string };
const defaultValue: LegacyFormModel = { username: '', password: '' };

const legacySuite = staticSuite(
  (data: LegacyFormModel = defaultValue, field?: string) => {
    only(field);
    test('username', 'Username is required', () => {
      enforce(data.username).isNotEmpty();
    });
    test('password', 'Password is required', () => {
      enforce(data.password).isNotEmpty();
    });
  },
);

@Component({
  selector: 'sc-legacy-api-form',
  standalone: true,
  imports: [vestForms],
  templateUrl: './legacy-api-form.component.html',
  styleUrl: './legacy-api-form.component.scss',
})
export class LegacyApiFormComponent {
  // Uses signal for compatibility, but binds with [formValue]/(formValueChange)
  protected readonly formValue = signal<LegacyFormModel | null>({
    ...defaultValue,
  });
  protected readonly suite = legacySuite;

  onSubmit(): void {
    alert('Submitted!');
  }
}
