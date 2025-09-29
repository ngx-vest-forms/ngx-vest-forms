import {
  ChangeDetectionStrategy,
  Component,
  isDevMode,
  signal,
} from '@angular/core';
import { type ErrorDisplayStrategy } from 'ngx-vest-forms/core';
import { ExampleCardsComponent } from '../../ui';
import { ErrorDisplayModeSelectorComponent } from '../../ui/error-display-mode-selector/error-display-mode-selector.component';
import { ERROR_DISPLAY_MODES_CONTENT } from './error-display-modes.content';
import { ErrorDisplayModesFormComponent } from './error-display-modes.form';

/**
 * Error Display Modes Page Wrapper
 *
 * Provides educational context and houses the interactive demo form.
 * This page demonstrates how different error display modes affect user experience.
 */
@Component({
  selector: 'ngx-error-display-modes-page',
  imports: [
    ExampleCardsComponent,
    ErrorDisplayModeSelectorComponent,
    ErrorDisplayModesFormComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <!-- Header Section -->
      <header class="mb-8 text-center">
        <p class="page-subtitle">
          Explore how different error display timing affects user experience
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

        <!-- Interactive Demo Form -->
        <ngx-error-display-modes-form [errorDisplayMode]="selectedMode()" />
      </ngx-example-cards>
    </div>
  `,
})
export class ErrorDisplayModesPageComponent {
  protected readonly selectedMode = signal<ErrorDisplayStrategy>('on-touch');

  protected readonly demonstratedContent =
    ERROR_DISPLAY_MODES_CONTENT.demonstrated;
  protected readonly learningContent = ERROR_DISPLAY_MODES_CONTENT.learning;

  protected onModeChange(mode: ErrorDisplayStrategy): void {
    this.selectedMode.set(mode);
    if (isDevMode()) {
      console.log('🎛️ Error display mode changed to:', mode);
    }
  }
}
