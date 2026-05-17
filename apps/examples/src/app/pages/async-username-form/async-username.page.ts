import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
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
  AsyncUsernameModel,
  asyncUsernameShape,
} from '../../models/async-username.model';
import { AlertPanel } from '../../ui/alert-panel/alert-panel.component';
import { Card } from '../../ui/card/card.component';
import { ExampleCardsComponent } from '../../ui/example-cards/example-cards.component';
import { FormPageLayout } from '../../ui/form-page-layout/form-page-layout.component';
import { FormStateCardComponent } from '../../ui/form-state/form-state.component';
import { PageTitle } from '../../ui/page-title/page-title.component';
import { asyncUsernameContent } from './async-username.content';
import { createAsyncUsernameSuite } from './async-username.validations';
import { UsernameAvailabilityService } from './username-availability.service';

/**
 * Async Username Availability — a self-contained demo that validates a
 * username against a mock remote endpoint.
 *
 * It mirrors the canonical starter wiring (one `ngxVestForm`, a form
 * contract, packaged feedback signals) and layers the async validation
 * pattern from the purchase demo on top: cheap synchronous rules gate an
 * `omitWhen`-wrapped, `memo`-keyed async test that aborts in-flight requests
 * when the username changes. Pending and submission state are kept separate
 * so the UI stays calm while the network call is in flight.
 */
@Component({
  selector: 'ngx-async-username-page',
  imports: [
    NgxVestForms,
    PageTitle,
    Card,
    AlertPanel,
    FormPageLayout,
    FormStateCardComponent,
    ExampleCardsComponent,
  ],
  templateUrl: './async-username.page.html',
  providers: [provideFormContract(asyncUsernameShape)],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsyncUsernamePageComponent {
  protected readonly exampleContent = asyncUsernameContent;

  /** Suite is built in the component so the async service can be injected. */
  protected readonly suite = createAsyncUsernameSuite(
    inject(UsernameAvailabilityService)
  );

  /** The form value is the single source of truth, owned by the page. */
  protected readonly formValue = signal<AsyncUsernameModel>({});
  protected readonly submittedValue = signal<AsyncUsernameModel | null>(null);

  private readonly vestForm =
    viewChild<FormDirective<AsyncUsernameModel>>('vestForm');
  private readonly feedback = createFormFeedbackSignals(this.vestForm);

  protected readonly formState = this.feedback.formState;
  protected readonly warnings = this.feedback.warnings;
  protected readonly validatedFields = this.feedback.validatedFields;
  protected readonly pending = this.feedback.pending;

  /** Errors currently attached to the username field. */
  private readonly usernameErrors = computed(
    () => this.formState()?.errors['username'] ?? []
  );

  /**
   * Show the calm success hint only once the username has been validated,
   * has no errors, and no async check is in flight.
   */
  protected readonly usernameResolved = computed(() => {
    const validated = this.validatedFields() ?? [];
    return (
      !this.pending() &&
      validated.includes('username') &&
      this.usernameErrors().length === 0 &&
      !!this.formValue().username
    );
  });

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
