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
  CustomControlsModel,
  customControlsContract,
} from '../../models/custom-controls.model';
import { AlertPanel } from '../../ui/alert-panel/alert-panel.component';
import { Card } from '../../ui/card/card.component';
import { ExampleCardsComponent } from '../../ui/example-cards/example-cards.component';
import { FormPageLayout } from '../../ui/form-page-layout/form-page-layout.component';
import { FormStateCardComponent } from '../../ui/form-state/form-state.component';
import { PageTitle } from '../../ui/page-title/page-title.component';
import { customControlsContent } from './custom-controls.content';
import { customControlsSuite } from './custom-controls.validations';
import { SegmentedControlComponent } from './segmented-control.component';
import { StarRatingComponent } from './star-rating.component';
import { TagInputComponent } from './tag-input.component';

/**
 * Custom Controls demo — proves a non-native `ControlValueAccessor` control
 * is indistinguishable from a native input to ngx-vest-forms. Self-contained
 * like the starter page: one `ngxVestForm`, a plain Vest suite, a form
 * contract, and the standard control-wrapper markup. Public API only.
 */
@Component({
  selector: 'ngx-custom-controls-page',
  imports: [
    NgxVestForms,
    PageTitle,
    Card,
    AlertPanel,
    FormPageLayout,
    FormStateCardComponent,
    ExampleCardsComponent,
    StarRatingComponent,
    SegmentedControlComponent,
    TagInputComponent,
  ],
  templateUrl: './custom-controls.page.html',
  providers: [provideFormContract(customControlsContract)],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomControlsPageComponent {
  protected readonly exampleContent = customControlsContent;
  protected readonly suite = customControlsSuite;

  /** The form value is the single source of truth, owned by the page. */
  protected readonly formValue = signal<CustomControlsModel>({});
  protected readonly submittedValue = signal<CustomControlsModel | null>(null);

  private readonly vestForm =
    viewChild<FormDirective<CustomControlsModel>>('vestForm');
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
