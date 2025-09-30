import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { ExampleCardsComponent } from '../../ui';
import { Debugger } from '../../ui/debugger/debugger';
import { ExampleFormArray } from './example-form-array';
import { FORM_ARRAY_CONTENT } from './example-form-array.content';

@Component({
  selector: 'ngx-form-array-page',
  imports: [ExampleFormArray, ExampleCardsComponent, Debugger],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mb-8">
      <p class="page-subtitle">
        Learn how to manage dynamic collections with array operations (add,
        remove, move, insert)
      </p>
    </header>

    <ngx-example-cards
      [demonstrated]="demonstratedContent"
      [learning]="learningContent"
    >
      <div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
        <ngx-example-form-array #formComponent />
        @if (formComponent?.debugForm; as debugForm) {
          <ngx-debugger [form]="debugForm" />
        }
      </div>
    </ngx-example-cards>
  `,
})
export class FormArrayPage {
  protected readonly formComponent =
    viewChild.required<ExampleFormArray>('formComponent');

  protected readonly demonstratedContent = FORM_ARRAY_CONTENT.demonstrated;
  protected readonly learningContent = FORM_ARRAY_CONTENT.learning;
}
