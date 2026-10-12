import {
  Component,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { StarterFormModel } from '../../models/starter-form.model';
import { AlertPanel } from '../../ui/alert-panel/alert-panel.component';
import { Card } from '../../ui/card/card.component';
import { ExampleCardsComponent } from '../../ui/example-cards/example-cards.component';
import { FormStateCardComponent } from '../../ui/form-state/form-state.component';
import { IntroItemComponent, IntroSectionComponent } from '../../ui/intro-section';
import { PageTitle } from '../../ui/page-title/page-title.component';
import { starterContent } from './starter.content';
import { StarterFormBody } from './starter.form';
import { starterFormSuite } from './starter.validations';

/**
 * Canonical starter contact form — the default "start here" demo.
 *
 * The page owns state, examples, and outcomes while the focused form markup
 * lives beside it in `starter.form.html` so developers can inspect the form
 * wiring without scanning page chrome. Uses the ngx-vest-forms public API only.
 */
@Component({
  selector: 'ngx-starter-page',
  imports: [
    PageTitle,
    IntroSectionComponent,
    IntroItemComponent,
    Card,
    AlertPanel,
    FormStateCardComponent,
    ExampleCardsComponent,
    StarterFormBody,
  ],
  templateUrl: './starter.page.html',
})
export class StarterPageComponent {
  protected readonly exampleContent = starterContent;
  protected readonly suite = starterFormSuite;

  /** The form value is the single source of truth, owned by the page. */
  protected readonly formValue = signal<StarterFormModel>({});
  protected readonly submittedValue = signal<StarterFormModel | null>(null);

  private readonly formBody = viewChild(StarterFormBody);

  protected readonly feedback = computed(() => this.formBody()?.feedback);

  protected onSubmit(): void {
    if (!this.feedback()?.formState()?.valid) {
      // The directive focuses the first invalid control on submit by default
      // (`focusFirstInvalidOnSubmit`), so no manual focus handling is needed.
      this.submittedValue.set(null);
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
