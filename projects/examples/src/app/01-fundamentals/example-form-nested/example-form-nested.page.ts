import {
  ChangeDetectionStrategy,
  Component,
  signal,
  viewChild,
} from '@angular/core';
import { type ErrorDisplayStrategy } from 'ngx-vest-forms';
import { ExampleCardsComponent } from '../../ui';
import { Debugger } from '../../ui/debugger/debugger';
import { ErrorDisplayModeSelectorComponent } from '../../ui/error-display-mode-selector/error-display-mode-selector.component';
import { ExampleFormNested } from './example-form-nested';
import { NESTED_FORM_CONTENT } from './example-form-nested.content';

@Component({
  selector: 'ngx-nested-form-page',
  imports: [
    ExampleFormNested,
    ExampleCardsComponent,
    Debugger,
    ErrorDisplayModeSelectorComponent,
  ],
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
      <!-- Error Display Mode Selector -->
      <ngx-error-display-mode-selector
        [selectedMode]="selectedMode()"
        (modeChange)="onModeChange($event)"
        class="mb-6"
      />

      <div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
        <ngx-example-form-nested
          #formComponent
          [errorDisplayMode]="selectedMode()"
        />
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

  // Error display mode state
  protected readonly selectedMode = signal<ErrorDisplayStrategy>('on-touch');

  protected onModeChange(mode: ErrorDisplayStrategy): void {
    this.selectedMode.set(mode);
  }
}
