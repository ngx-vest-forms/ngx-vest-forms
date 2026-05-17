import {
  ChangeDetectionStrategy,
  Component,
  signal,
  viewChild,
} from '@angular/core';
import {
  createFormFeedbackSignals,
  FormDirective,
  NgxVestForms,
  provideFormContract,
} from 'ngx-vest-forms';
import {
  StarterFormModel,
  starterFormShape,
} from '../../models/starter-form.model';
import { AlertPanel } from '../../ui/alert-panel/alert-panel.component';
import { Card } from '../../ui/card/card.component';
import { ExampleCardsComponent } from '../../ui/example-cards/example-cards.component';
import { FormPageLayout } from '../../ui/form-page-layout/form-page-layout.component';
import { FormStateCardComponent } from '../../ui/form-state/form-state.component';
import { PageTitle } from '../../ui/page-title/page-title.component';
import { starterContent } from './starter.content';
import { starterFormSuite } from './starter.validations';

/**
 * Canonical starter contact form — the default "start here" demo.
 *
 * Intentionally one self-contained component so it reads as a trustworthy
 * baseline a developer can copy: a single `ngxVestForm`, a plain Vest suite,
 * a form contract, and the standard control-wrapper markup. Uses the
 * ngx-vest-forms public API only.
 */
@Component({
  selector: 'ngx-starter-page',
  imports: [
    NgxVestForms,
    PageTitle,
    Card,
    AlertPanel,
    FormPageLayout,
    FormStateCardComponent,
    ExampleCardsComponent,
  ],
  templateUrl: './starter.page.html',
  providers: [provideFormContract(starterFormShape)],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StarterPageComponent {
  protected readonly exampleContent = starterContent;
  protected readonly suite = starterFormSuite;

  /** The form value is the single source of truth, owned by the page. */
  protected readonly formValue = signal<StarterFormModel>({});
  protected readonly submittedValue = signal<StarterFormModel | null>(null);

  private readonly vestForm =
    viewChild<FormDirective<StarterFormModel>>('vestForm');
  private readonly feedback = createFormFeedbackSignals(this.vestForm);

  protected readonly formState = this.feedback.formState;
  protected readonly warnings = this.feedback.warnings;
  protected readonly validatedFields = this.feedback.validatedFields;
  protected readonly pending = this.feedback.pending;

  protected onSubmit(): void {
    if (!this.formState()?.valid) {
      this.submittedValue.set(null);
      return;
    }
    this.submittedValue.set(structuredClone(this.formValue()));
  }

  protected reset(): void {
    this.submittedValue.set(null);
    this.vestForm()?.resetForm({});
    this.formValue.set({});
  }
}
