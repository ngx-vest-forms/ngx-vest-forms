import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { ExampleCardsComponent } from '../../ui';
import { Debugger } from '../../ui/debugger/debugger';
import { MINIMAL_FORM_CONTENT } from './minimal-form.content';
import { MinimalForm } from './minimal.form';

@Component({
  selector: 'ngx-minimal-form-page',
  imports: [MinimalForm, ExampleCardsComponent, Debugger],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mb-8">
      <p class="page-subtitle">
        Your first ngx-vest-forms implementation - the foundation for all other
        examples
      </p>
    </header>

    <ngx-example-cards
      [demonstrated]="demonstratedContent"
      [learning]="learningContent"
    >
      <!-- Side-by-side layout for form and debugger -->
      <div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
        <ngx-minimal-form #formComponent />
        @if (formComponent?.debugFormState(); as debugForm) {
          <ngx-debugger [form]="debugForm" />
        }
      </div>
    </ngx-example-cards>
  `,
})
export class MinimalFormPage {
  protected readonly formComponent =
    viewChild.required<MinimalForm>('formComponent');

  protected readonly demonstratedContent = MINIMAL_FORM_CONTENT.demonstrated;
  protected readonly learningContent = MINIMAL_FORM_CONTENT.learning;
}
