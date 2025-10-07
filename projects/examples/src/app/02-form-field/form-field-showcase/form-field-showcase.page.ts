import {
  ChangeDetectionStrategy,
  Component,
  signal,
  viewChild,
} from '@angular/core';
import { type ErrorDisplayStrategy } from 'ngx-vest-forms';
import { ExampleCardsComponent } from '../../ui';
import { asDebuggerForm, Debugger } from '../../ui/debugger/debugger';
import { ErrorDisplayModeSelectorComponent } from '../../ui/error-display-mode-selector/error-display-mode-selector.component';
import { FORM_FIELD_SHOWCASE_CONTENT } from './form-field-showcase.content';
import { FormFieldShowcase } from './form-field-showcase.form';

/**
 * Form Field Showcase Page
 *
 * Demonstrates the NgxVestFormField wrapper component which provides:
 * - **Automatic Error Display**: No need to manually add `<ngx-form-error>`
 * - **Consistent Layout**: Standardized spacing via CSS custom properties
 * - **Multiple Field Types**: Works with all form controls
 * - **Clean Markup**: Reduced boilerplate compared to manual error handling
 *
 * This page showcases the difference between manual error display
 * (see fundamentals/basic-validation) and automatic error display via wrapper.
 */
@Component({
  selector: 'ngx-form-field-showcase-page',
  imports: [
    FormFieldShowcase,
    ExampleCardsComponent,
    Debugger,
    ErrorDisplayModeSelectorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mb-8">
      <p class="page-subtitle">
        Automatic error display and consistent layout with NgxVestFormField
        wrapper
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

      <!-- Side-by-side layout for form and debugger -->
      <div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
        <ngx-form-field-showcase
          #formComponent
          [errorDisplayMode]="selectedMode()"
        />
        @if (formComponent) {
          <ngx-debugger [form]="asDebuggerForm(formComponent.form)" />
        }
      </div>
    </ngx-example-cards>
  `,
})
export class FormFieldShowcasePage {
  protected readonly formComponent =
    viewChild.required<FormFieldShowcase>('formComponent');

  protected readonly selectedMode = signal<ErrorDisplayStrategy>('on-touch');

  protected readonly demonstratedContent =
    FORM_FIELD_SHOWCASE_CONTENT.demonstrated;
  protected readonly learningContent = FORM_FIELD_SHOWCASE_CONTENT.learning;

  protected readonly asDebuggerForm = asDebuggerForm;

  protected onModeChange(mode: ErrorDisplayStrategy): void {
    this.selectedMode.set(mode);
  }
}
