import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { createValidationConfig } from 'ngx-vest-forms';
import {
  ValidationDemoModel,
  validationDemoShape,
} from '../../models/validation-demo.model';
import { Card } from '../../ui/card/card.component';
import { FormPageLayout } from '../../ui/form-page-layout/form-page-layout.component';
import { FormStateCardComponent } from '../../ui/form-state/form-state.component';
import { PageTitle } from '../../ui/page-title/page-title.component';
import { ValidationConfigDemoFormBody } from './validation-config-demo.form';
import { validationDemoSuite } from './validation-demo.validations';

@Component({
  selector: 'ngx-validation-config-demo-page',
  imports: [
    Card,
    FormPageLayout,
    FormStateCardComponent,
    PageTitle,
    ValidationConfigDemoFormBody,
  ],
  templateUrl: './validation-config-demo.page.html',
  styleUrls: ['./validation-config-demo.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ValidationConfigDemoPageComponent {
  private readonly initialFormValue: ValidationDemoModel = {
    requiresJustification: false,
  };

  protected readonly formValue = signal<ValidationDemoModel>(
    this.initialFormValue
  );

  private readonly formBody = viewChild(ValidationConfigDemoFormBody);

  protected readonly suite = validationDemoSuite;
  protected readonly shape = validationDemoShape;

  protected readonly validationConfig =
    createValidationConfig<ValidationDemoModel>()
      .bidirectional('password', 'confirmPassword')
      .bidirectional('quantity', 'quantityJustification')
      .whenChanged('requiresJustification', 'justification')
      .whenChanged('country', ['state', 'zipCode'])
      .bidirectional('startDate', 'endDate')
      .build();

  protected readonly formInfo = computed(() =>
    this.#getMessagesByFields(this.formBody()?.formState()?.errors ?? {}, [
      'startDate',
      'endDate',
    ])
  );

  protected readonly formErrors = computed(() =>
    this.#getMessagesExcludingFields(
      this.formBody()?.formState()?.errors ?? {},
      ['startDate', 'endDate']
    )
  );

  protected save(): void {
    if (this.formBody()?.formState()?.valid) {
      // Intentionally no console output or alerts in examples to keep CI and demos quiet
    }
  }

  protected reset(): void {
    this.formBody()?.resetFormState(this.initialFormValue);
    this.formValue.set(this.initialFormValue);
  }

  #getMessagesByFields(
    messagesByField: Record<string, string[]>,
    fields: readonly string[]
  ): string[] {
    return [
      ...new Set(fields.flatMap((field) => messagesByField[field] ?? [])),
    ];
  }

  #getMessagesExcludingFields(
    messagesByField: Record<string, string[]>,
    excludedFields: readonly string[]
  ): string[] {
    const excluded = new Set(excludedFields);
    return [
      ...new Set(
        Object.entries(messagesByField)
          .filter(([field]) => !excluded.has(field))
          .flatMap(([, messages]) => messages)
      ),
    ];
  }
}
