import { Component, computed, signal, viewChild } from '@angular/core';
import type { NgxSubmitSettledEvent } from 'ngx-vest-forms';
import { SignalFormsInteropModel } from '../../models/signal-forms-interop.model';
import { AlertPanel } from '../../ui/alert-panel/alert-panel.component';
import { Card } from '../../ui/card/card.component';
import { ExampleCardsComponent } from '../../ui/example-cards/example-cards.component';
import { FormStateCardComponent } from '../../ui/form-state/form-state.component';
import {
  IntroItemComponent,
  IntroSectionComponent,
} from '../../ui/intro-section';
import { PageTitle } from '../../ui/page-title/page-title.component';
import { signalFormsInteropContent } from './signal-forms-interop.content';
import { SignalFormsInteropFormBody } from './signal-forms-interop.form';
import { signalFormsInteropSuite } from './signal-forms-interop.validations';

/**
 * Signal Forms interop demo: controls written for Angular Signal Forms
 * (`FormValueControl`, `FormCheckboxControl`) used with `[ngModel]` inside an
 * `ngxVestForm`, with no `ControlValueAccessor`. Public API only.
 */
@Component({
  selector: 'ngx-signal-forms-interop-page',
  imports: [
    PageTitle,
    IntroSectionComponent,
    IntroItemComponent,
    Card,
    AlertPanel,
    FormStateCardComponent,
    ExampleCardsComponent,
    SignalFormsInteropFormBody,
  ],
  templateUrl: './signal-forms-interop.page.html',
})
export class SignalFormsInteropPageComponent {
  protected readonly exampleContent = signalFormsInteropContent;
  protected readonly suite = signalFormsInteropSuite;

  protected readonly formValue = signal<SignalFormsInteropModel>({});
  protected readonly submittedValue = signal<SignalFormsInteropModel | null>(
    null
  );

  private readonly formBody = viewChild(SignalFormsInteropFormBody);

  protected readonly feedback = computed(() => this.formBody()?.feedback);

  protected onSubmit(
    event: NgxSubmitSettledEvent<SignalFormsInteropModel>
  ): void {
    // On an invalid submit the directive focuses the first invalid control,
    // which here is the stepper's inner input or the switch button.
    this.submittedValue.set(event.valid ? structuredClone(event.value) : null);
  }

  protected reset(): void {
    this.submittedValue.set(null);
    this.formBody()?.resetFormState({});
    this.formValue.set({});
  }
}
