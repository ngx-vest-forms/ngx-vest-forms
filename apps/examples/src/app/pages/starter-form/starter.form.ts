import { Component, signal, viewChild } from '@angular/core';
import {
  createFormFeedbackSignals,
  FormDirective,
  type NgxDeepRequired,
  type NgxSubmitSettledEvent,
  NgxVestForms,
  provideFormContract,
} from 'ngx-vest-forms';
import { type StarterFormModel, starterFormSuite } from './starter.validations';

/** The form contract: lets the directive warn in dev about drifting `name`s. */
const starterFormShape: NgxDeepRequired<StarterFormModel> = {
  name: '',
  email: '',
  subject: '',
  message: '',
};

/**
 * The starter: one component that owns its state, template and submit
 * handler. Copy this file and `starter.validations.ts` into your app.
 * The classes (`input-field`, `btn`, `label-text`, ...) are cosmetic only.
 */
@Component({
  selector: 'ngx-starter-form',
  imports: [NgxVestForms],
  template: `
    @if (submittedValue(); as sent) {
      <p
        role="status"
        class="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300"
      >
        <strong>Message sent.</strong> Thanks {{ sent.name }}, we'll reply to
        {{ sent.email }} shortly.
      </p>
    }

    <form
      ngxVestForm
      [suite]="suite"
      [formValue]="formValue()"
      (formValueChange)="formValue.set($event)"
      (submitSettled)="onSubmit($event)"
      class="space-y-6"
    >
      <ngx-control-wrapper class="form-field" ariaRequired>
        <label for="name" class="label-text label-required">Name</label>
        <input
          class="input-field"
          type="text"
          id="name"
          name="name"
          [ngModel]="formValue().name"
          placeholder="Ada Lovelace"
          autocomplete="name"
        />
      </ngx-control-wrapper>

      <ngx-control-wrapper class="form-field" ariaRequired>
        <label for="email" class="label-text label-required">Email</label>
        <input
          class="input-field"
          type="email"
          id="email"
          name="email"
          [ngModel]="formValue().email"
          placeholder="ada@example.com"
          autocomplete="email"
          inputmode="email"
        />
      </ngx-control-wrapper>

      <ngx-control-wrapper class="form-field" ariaRequired>
        <label for="subject" class="label-text label-required">Subject</label>
        <input
          class="input-field"
          type="text"
          id="subject"
          name="subject"
          [ngModel]="formValue().subject"
          placeholder="How can we help?"
        />
      </ngx-control-wrapper>

      <ngx-control-wrapper class="form-field" ariaRequired>
        <label for="message" class="label-text label-required">Message</label>
        <textarea
          class="input-field"
          id="message"
          name="message"
          rows="4"
          [ngModel]="formValue().message"
          placeholder="Tell us a little about what you need…"
        ></textarea>
      </ngx-control-wrapper>

      <div class="flex justify-end gap-3 pt-2">
        <button type="button" class="btn btn-secondary" (click)="reset()">
          Reset
        </button>
        <button type="submit" class="btn btn-primary">Send message</button>
      </div>
    </form>
  `,
  providers: [provideFormContract(starterFormShape)],
})
export class StarterFormComponent {
  protected readonly suite = starterFormSuite;

  /** The single source of truth for the form. */
  protected readonly formValue = signal<StarterFormModel>({});
  protected readonly submittedValue = signal<StarterFormModel | null>(null);

  private readonly vestForm = viewChild.required(
    FormDirective<StarterFormModel>
  );

  /** Packaged form state; the page reads it for the form-state card. */
  readonly feedback = createFormFeedbackSignals(this.vestForm);

  protected onSubmit(event: NgxSubmitSettledEvent<StarterFormModel>): void {
    if (!event.valid || !event.value) {
      // The directive focuses the first invalid control on submit.
      this.submittedValue.set(null);
      return;
    }
    this.submittedValue.set(event.value);
  }

  protected reset(): void {
    this.submittedValue.set(null);
    this.formValue.set({});
    this.vestForm().resetForm();
  }
}
