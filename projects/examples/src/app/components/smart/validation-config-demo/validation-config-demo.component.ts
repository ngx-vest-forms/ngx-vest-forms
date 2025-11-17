import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { createValidationConfig, vestForms } from 'ngx-vest-forms';
import {
  ValidationDemoModel,
  validationDemoShape,
} from '../../../models/validation-demo.model';
import { validationDemoSuite } from '../../../validations/validation-demo.validations';

@Component({
  selector: 'ngx-validation-config-demo',
  imports: [vestForms],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './validation-config-demo.component.html',
  styleUrls: ['./validation-config-demo.component.scss'],
})
export class ValidationConfigDemoComponent {
  protected readonly formValue = signal<ValidationDemoModel>({
    requiresJustification: false,
  });

  protected readonly suite = validationDemoSuite;
  protected readonly shape = validationDemoShape;

  // ✅ Using the fluent builder API to avoid race conditions
  protected readonly validationConfig =
    createValidationConfig<ValidationDemoModel>()
      // Bidirectional: when password changes, revalidate confirmPassword AND vice versa
      .bidirectional('password', 'confirmPassword')
      // Conditional: when checkbox changes, revalidate justification
      .whenChanged('requiresJustification', 'justification')
      // Cascade: when country changes, revalidate state and zipCode
      .whenChanged('country', ['state', 'zipCode'])
      // Date range: both dates affect each other's validation
      .bidirectional('startDate', 'endDate')
      .build();

  protected readonly errors = signal<Record<string, string[]>>({});
  protected readonly isValid = signal(false);

  // Computed for demo purposes
  protected readonly hasPasswordErrors = computed(
    () => this.errors()['password'] || this.errors()['confirmPassword']
  );

  protected readonly hasLocationErrors = computed(
    () =>
      this.errors()['country'] ||
      this.errors()['state'] ||
      this.errors()['zipCode']
  );

  protected readonly hasDateErrors = computed(
    () => this.errors()['startDate'] || this.errors()['endDate']
  );

  protected save(): void {
    if (this.isValid()) {
      // Intentionally no console output or alerts in examples to keep CI and demos quiet
    }
  }
}
