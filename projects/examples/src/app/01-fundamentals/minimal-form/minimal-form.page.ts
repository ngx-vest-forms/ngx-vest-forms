import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { ExampleCardsComponent } from '../../ui';
import { FormStateDisplayComponent } from '../../ui/form-state-display/public-api';
import { MINIMAL_FORM_CONTENT } from './minimal-form.content';
import { MinimalForm } from './minimal.form';

@Component({
  selector: 'ngx-minimal-form-page',
  imports: [MinimalForm, ExampleCardsComponent, FormStateDisplayComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ngx-example-cards
      [demonstrated]="demonstratedContent"
      [learning]="learningContent"
    >
      <!-- Clean form in card -->
      <!-- Clean form -->
      <ngx-minimal-form #formComponent />

      <!-- State display for learning -->
      <ngx-form-state-display
        [title]="'Form State'"
        [formState]="formComponent?.formState()"
        class="mt-6"
      />
    </ngx-example-cards>
  `,
})
export class MinimalFormPage {
  protected readonly formComponent =
    viewChild.required<MinimalForm>('formComponent');

  protected readonly demonstratedContent = MINIMAL_FORM_CONTENT.demonstrated;
  protected readonly learningContent = MINIMAL_FORM_CONTENT.learning;
}
