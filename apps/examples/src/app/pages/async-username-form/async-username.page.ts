import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  createEmptyFormState,
} from 'ngx-vest-forms';
import {
  AsyncUsernameModel,
} from '../../models/async-username.model';
import { AlertPanel } from '../../ui/alert-panel/alert-panel.component';
import { Card } from '../../ui/card/card.component';
import { ExampleCardsComponent } from '../../ui/example-cards/example-cards.component';
import { FormPageLayout } from '../../ui/form-page-layout/form-page-layout.component';
import { FormStateCardComponent } from '../../ui/form-state/form-state.component';
import { PageTitle } from '../../ui/page-title/page-title.component';
import { asyncUsernameContent } from './async-username.content';
import { AsyncUsernameFormBody } from './async-username.form';
import { createAsyncUsernameSuite } from './async-username.validations';
import { UsernameAvailabilityService } from './username-availability.service';

/**
 * Async Username Availability — a self-contained demo that validates a
 * username against a mock remote endpoint.
 *
 * It mirrors the canonical starter wiring (page-owned state + focused form
 * markup in `async-username.form.html`) and layers the async validation
 * pattern from the purchase demo on top: cheap synchronous rules gate an
 * `omitWhen`-wrapped, `memo`-keyed async test that aborts in-flight requests
 * when the username changes. Pending and submission state are kept separate
 * so the UI stays calm while the network call is in flight.
 */
@Component({
  selector: 'ngx-async-username-page',
  imports: [
    PageTitle,
    Card,
    AlertPanel,
    FormPageLayout,
    FormStateCardComponent,
    ExampleCardsComponent,
    AsyncUsernameFormBody,
  ],
  templateUrl: './async-username.page.html',
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

  private readonly formBody = viewChild(AsyncUsernameFormBody);

  protected readonly feedback = computed(() => this.formBody()?.feedback);

  protected onSubmit(): void {
    if (!this.feedback()?.formState()?.valid) {
      this.submittedValue.set(null);
      this.formBody()?.focusFirstInvalidControl();
      return;
    }
    this.submittedValue.set(structuredClone(this.formValue()));
  }

  protected reset(): void {
    this.submittedValue.set(null);
    this.formBody()?.resetFormState({});
    this.formValue.set({});
  }
}
