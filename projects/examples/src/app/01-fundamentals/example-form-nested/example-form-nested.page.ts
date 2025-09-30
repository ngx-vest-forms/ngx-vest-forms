import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { ExampleCardsComponent } from '../../ui';
import { Debugger } from '../../ui/debugger/debugger';
import { ExampleFormNested } from './example-form-nested';
import { NESTED_FORM_CONTENT } from './example-form-nested.content';

@Component({
  selector: 'ngx-nested-form-page',
  imports: [ExampleFormNested, ExampleCardsComponent, Debugger],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mb-8">
      <p class="page-subtitle">
        Learn how to handle multi-section forms with nested objects and
        path-based validation
      </p>
    </header>

    <ngx-example-cards
      [demonstrated]="demonstratedContent"
      [learning]="learningContent"
    >
      <div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
        <ngx-example-form-nested #formComponent />
        @if (formComponent?.debugForm; as debugForm) {
          <ngx-debugger [form]="debugForm" />
        }
      </div>
    </ngx-example-cards>
  `,
})
export class NestedFormPage {
  protected readonly formComponent =
    viewChild.required<ExampleFormNested>('formComponent');

  protected readonly demonstratedContent = NESTED_FORM_CONTENT.demonstrated;
  protected readonly learningContent = NESTED_FORM_CONTENT.learning;
}
