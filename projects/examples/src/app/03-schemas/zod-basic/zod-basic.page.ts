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
import { ZOD_BASIC_CONTENT } from './zod-basic.content';
import { ZodBasicFormComponent } from './zod-basic.form';
import { userRegistrationSchema } from './zod-basic.validations';

/**
 * Zod Basic Schema Integration Page
 *
 * Demonstrates two-layer validation with Zod and Vest.js:
 * - **Layer 1 (Zod)**: Type safety and structure validation
 * - **Layer 2 (Vest)**: Business logic and async validation
 *
 * This pattern provides:
 * - Runtime type safety with TypeScript inference
 * - Ecosystem compatibility (tRPC, TanStack, Hono)
 * - Framework portability (reuse schemas across React, Vue, etc.)
 * - Flexible business validation with Vest.js
 */
@Component({
  selector: 'ngx-zod-basic-page',
  imports: [
    ZodBasicFormComponent,
    ExampleCardsComponent,
    Debugger,
    ErrorDisplayModeSelectorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mb-8">
      <p class="page-subtitle">
        Two-layer validation with Zod schema and Vest.js business logic
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
        <ngx-zod-basic-form #formComp [errorDisplayMode]="selectedMode()" />
        @if (formComponent()?.debugFormState(); as debugForm) {
          <ngx-debugger [form]="debugForm" [schema]="userRegistrationSchema" />
        }
      </div>
    </ngx-example-cards>
  `,
})
export class ZodBasicPage {
  protected readonly formComponent =
    viewChild<ZodBasicFormComponent>('formComp');

  protected readonly selectedMode = signal<ErrorDisplayStrategy>('on-touch');

  protected readonly demonstratedContent = ZOD_BASIC_CONTENT.demonstrated;
  protected readonly learningContent = ZOD_BASIC_CONTENT.learning;

  protected readonly userRegistrationSchema = userRegistrationSchema;

  protected onModeChange(mode: ErrorDisplayStrategy): void {
    this.selectedMode.set(mode);
  }
}
