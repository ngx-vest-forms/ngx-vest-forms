import {
  ChangeDetectionStrategy,
  Component,
  isDevMode,
  signal,
} from '@angular/core';
import { NgxErrorDisplayMode } from 'ngx-vest-forms/core';
import { CardComponent } from '../../ui/card/card.component';
import { ErrorDisplayModeSelectorComponent } from '../../ui/error-display-mode-selector/error-display-mode-selector.component';
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
    CardComponent,
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

      <!-- What You'll See Demonstrated -->
      <ngx-card
        variant="primary-outline"
        labelledBy="demonstratedFeaturesHeading"
        class="mb-6 text-left"
      >
        <div card-header>
          <h2
            id="demonstratedFeaturesHeading"
            class="mb-4 text-lg font-semibold"
          >
            🎛️ What You'll See Demonstrated
          </h2>
        </div>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <h3 class="mb-2 font-medium text-gray-900 dark:text-gray-100">
              Error Display Modes
            </h3>
            <ul class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>
                •
                <code class="text-indigo-600 dark:text-indigo-400"
                  >immediate</code
                >
                - Instant validation feedback
              </li>
              <li>
                •
                <code class="text-indigo-600 dark:text-indigo-400"
                  >on-blur</code
                >
                - Validation after field exit
              </li>
              <li>
                •
                <code class="text-indigo-600 dark:text-indigo-400"
                  >on-blur-or-submit</code
                >
                - Balanced approach
              </li>
              <li>
                •
                <code class="text-indigo-600 dark:text-indigo-400"
                  >on-submit</code
                >
                - Submit-only validation
              </li>
            </ul>
          </div>
          <div>
            <h3 class="mb-2 font-medium text-gray-900 dark:text-gray-100">
              Interactive Features
            </h3>
            <ul class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>• Real-time mode switching</li>
              <li>• User experience comparison testing</li>
              <li>• WCAG 2.2 Level AA compliance</li>
              <li>
                • Dynamic
                <code class="text-indigo-600 dark:text-indigo-400"
                  >NgxFormErrorDisplayDirective</code
                >
              </li>
            </ul>
          </div>
        </div>
      </ngx-card>

      <!-- Error Display Mode Selector -->
      <ngx-error-display-mode-selector
        [selectedMode]="selectedMode()"
        (modeChange)="onModeChange($event)"
      />

      <!-- Interactive Demo Form -->
      <main>
        <ngx-card variant="primary-outline">
          <ngx-error-display-modes-form [errorDisplayMode]="selectedMode()" />
        </ngx-card>
      </main>

      <!-- Implementation Notes -->
      <ngx-card variant="educational" class="mt-8">
        <div card-header>🎯 Implementation Notes</div>

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <h3
              class="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              Why This Example Matters
            </h3>
            <ul class="space-y-1 text-xs text-gray-700 dark:text-gray-300">
              <li>• Understand UX impact of validation timing</li>
              <li>• Compare user experience across different modes</li>
              <li>• Learn when to use each error display strategy</li>
              <li>• Master dynamic directive configuration</li>
            </ul>
          </div>

          <div>
            <h3
              class="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              Key Learning Outcomes
            </h3>
            <ul class="space-y-1 text-xs text-gray-700 dark:text-gray-300">
              <li>• Balanced "on-blur-or-submit" is usually best</li>
              <li>• "immediate" can feel aggressive to users</li>
              <li>• "on-submit" may surprise users with many errors</li>
              <li>• Mode switching helps with user testing</li>
            </ul>
          </div>
        </div>

        <div
          class="mt-4 border-t border-indigo-200 pt-4 dark:border-indigo-700"
        >
          <div class="text-xs text-gray-600 dark:text-gray-400">
            📖 <strong>Learning complete!</strong>
            You've mastered the fundamentals. Check out the
            <a
              href="#"
              class="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              ngx-vest-forms documentation
            </a>
            for advanced patterns and real-world examples.
          </div>
        </div>
      </ngx-card>
    </div>
  `,
})
export class ErrorDisplayModesPageComponent {
  protected readonly selectedMode =
    signal<NgxErrorDisplayMode>('on-blur-or-submit');

  protected onModeChange(mode: NgxErrorDisplayMode): void {
    this.selectedMode.set(mode);
    if (isDevMode()) {
      console.log('🎛️ Error display mode changed to:', mode);
    }
  }
}
