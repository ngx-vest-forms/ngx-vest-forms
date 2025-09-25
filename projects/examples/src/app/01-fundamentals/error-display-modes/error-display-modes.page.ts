import {
  ChangeDetectionStrategy,
  Component,
  computed,
  isDevMode,
  signal,
  viewChild,
} from '@angular/core';
import { NgxErrorDisplayMode, createEmptyFormState } from 'ngx-vest-forms/core';
import { ExampleCardsComponent } from '../../ui';
import { ErrorDisplayModeSelectorComponent } from '../../ui/error-display-mode-selector/error-display-mode-selector.component';
import { FormStateDisplayComponent } from '../../ui/form-state-display/public-api';
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
    FormStateDisplayComponent,
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
        <ngx-error-display-modes-form
          #formComp
          [errorDisplayMode]="selectedMode()"
        />

        <!-- Developer form state panel -->
        <ngx-form-state-display
          [title]="'Live Form State (parent read)'"
          [formState]="childFormState()"
        />
      </ngx-example-cards>
    </div>
  `,
})
export class ErrorDisplayModesPageComponent {
  protected readonly formComp = viewChild(ErrorDisplayModesFormComponent);
  protected readonly childFormState = computed(() => {
    const state = this.formComp()?.formState();
    return state || createEmptyFormState();
  });
  protected readonly selectedMode =
    signal<NgxErrorDisplayMode>('on-blur-or-submit');

  protected readonly demonstratedContent =
    ERROR_DISPLAY_MODES_CONTENT.demonstrated;
  protected readonly learningContent = ERROR_DISPLAY_MODES_CONTENT.learning;

  protected onModeChange(mode: NgxErrorDisplayMode): void {
    this.selectedMode.set(mode);
    if (isDevMode()) {
      console.log('🎛️ Error display mode changed to:', mode);
    }
  }
}
