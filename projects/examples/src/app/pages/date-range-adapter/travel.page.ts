import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { createValidationConfig } from 'ngx-vest-forms';
import {
  TravelFormModel,
  travelFormShape,
} from '../../models/travel-form.model';
import { Card } from '../../ui/card/card.component';
import { FormPageLayout } from '../../ui/form-page-layout/form-page-layout.component';
import { FormStateCardComponent } from '../../ui/form-state/form-state.component';
import { PageTitle } from '../../ui/page-title/page-title.component';
import { TravelFormApproach, TravelFormBody } from './travel.form';
import { travelValidationSuite } from './travel.validations';

@Component({
  selector: 'ngx-travel-page',
  imports: [
    Card,
    FormPageLayout,
    FormStateCardComponent,
    PageTitle,
    TravelFormBody,
  ],
  templateUrl: './travel.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TravelPageComponent {
  private readonly initialFormValue: TravelFormModel = {};

  protected readonly formValue = signal<TravelFormModel>(this.initialFormValue);

  protected readonly approach = signal<TravelFormApproach>('split-wrappers');

  private readonly formBody = viewChild(TravelFormBody);

  protected readonly suite = travelValidationSuite;
  protected readonly shape = travelFormShape;

  protected readonly validationConfig =
    createValidationConfig<TravelFormModel>()
      .bidirectional('departureDate', 'returnDate')
      .build();

  /** Merged errors from both date fields for the sidebar card. */
  protected readonly formErrors = computed(() => {
    const errors = this.formBody()?.formState()?.errors ?? {};
    return [...new Set(Object.values(errors).flat())];
  });

  protected readonly departureErrors = computed(() => {
    const errors = this.formBody()?.formState()?.errors ?? {};
    return errors['departureDate'] ?? [];
  });

  protected readonly returnErrors = computed(() => {
    const errors = this.formBody()?.formState()?.errors ?? {};
    return errors['returnDate'] ?? [];
  });

  protected readonly departureWarnings = computed(() => {
    const warnings = this.formBody()?.warnings() ?? {};
    return warnings['departureDate'] ?? [];
  });

  protected readonly returnWarnings = computed(() => {
    const warnings = this.formBody()?.warnings() ?? {};
    return warnings['returnDate'] ?? [];
  });

  protected save(): void {
    if (this.formBody()?.formState()?.valid) {
      // Intentionally quiet in examples
    }
  }

  protected selectApproach(next: TravelFormApproach): void {
    if (this.approach() === next) {
      return;
    }

    this.approach.set(next);
    this.reset();
  }

  protected reset(): void {
    this.formBody()?.resetFormState(this.initialFormValue);
    this.formValue.set(this.initialFormValue);
  }
}
