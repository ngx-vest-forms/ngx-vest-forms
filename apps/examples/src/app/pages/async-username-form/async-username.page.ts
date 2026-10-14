import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { AsyncUsernameModel } from '../../models/async-username.model';
import { createSubmitWhenSettled } from '../../shared/submit-when-settled';
import { AlertPanel } from '../../ui/alert-panel/alert-panel.component';
import { Card } from '../../ui/card/card.component';
import { ExampleCardsComponent } from '../../ui/example-cards/example-cards.component';
import { FormStateCardComponent } from '../../ui/form-state/form-state.component';
import {
  IntroItemComponent,
  IntroSectionComponent,
} from '../../ui/intro-section';
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
    IntroSectionComponent,
    IntroItemComponent,
    Card,
    AlertPanel,
    FormStateCardComponent,
    ExampleCardsComponent,
    AsyncUsernameFormBody,
  ],
  templateUrl: './async-username.page.html',
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

  /** Waits for the availability check to settle before deciding. */
  readonly #submitWhenSettled = createSubmitWhenSettled(
    () => this.feedback()?.pending() ?? false
  );

  protected onSubmit(): void {
    // The availability check may still be in flight when the user submits.
    // A PENDING form is not an invalid form, so decide only once validation
    // has settled; the submission is never dropped silently. Focus handling
    // stays with the directive (`focusFirstInvalidOnSubmit` defaults to true).
    this.#submitWhenSettled(() => {
      if (!this.feedback()?.formState()?.valid) {
        this.submittedValue.set(null);
        return;
      }
      this.submittedValue.set(structuredClone(this.formValue()));
    });
  }

  protected reset(): void {
    this.submittedValue.set(null);
    this.formBody()?.resetFormState({});
    this.formValue.set({});
  }
}
