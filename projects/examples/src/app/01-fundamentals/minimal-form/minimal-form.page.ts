import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { CardComponent } from '../../ui/card/card.component';
import { FormStateDisplayComponent } from '../../ui/form-state-display/public-api';
import { MinimalForm } from './minimal.form';

@Component({
  selector: 'ngx-minimal-form-page',
  imports: [MinimalForm, CardComponent, FormStateDisplayComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Content without page wrapper -->
    <div>
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
            ⚡ What You'll See Demonstrated
          </h2>
        </div>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <h3 class="mb-2 font-medium text-gray-900 dark:text-gray-100">
              Core ngx-vest-forms Pattern
            </h3>
            <ul class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>
                •
                <code class="text-indigo-600 dark:text-indigo-400"
                  >signal()</code
                >
                for reactive model
              </li>
              <li>
                •
                <code class="text-indigo-600 dark:text-indigo-400"
                  >staticSuite</code
                >
                validation
              </li>
              <li>
                •
                <code class="text-indigo-600 dark:text-indigo-400"
                  >[ngModel]</code
                >
                one-way binding
              </li>
              <li>
                •
                <code class="text-indigo-600 dark:text-indigo-400"
                  >[(formValue)]</code
                >
                two-way sync
              </li>
            </ul>
          </div>
          <div>
            <h3 class="mb-2 font-medium text-gray-900 dark:text-gray-100">
              Simple Validation Rules
            </h3>
            <ul class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>• Name required (minimum 2 characters)</li>
              <li>• Email format validation</li>
              <li>• On-blur error display timing</li>
              <li>• Automatic form state management</li>
            </ul>
          </div>
        </div>
      </ngx-card>

      <!-- Clean form in ngx-card replicating rounded white shadow container -->
      <ngx-card variant="primary-outline">
        <ngx-minimal-form #formComponent />
      </ngx-card>

      <!-- State display for learning -->
      <ngx-form-state-display
        [title]="'Form State'"
        [formState]="formComponent?.formState()"
      />

      <!-- Implementation Notes -->
      <ngx-card variant="educational" class="mt-8">
        <div card-header>🎯 Learning Journey & Next Steps</div>

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <h3
              class="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              Why Start Here
            </h3>
            <ul class="space-y-1 text-xs text-gray-700 dark:text-gray-300">
              <li>• Simplest possible ngx-vest-forms setup</li>
              <li>• Foundation pattern for all other forms</li>
              <li>• Perfect entry point for new developers</li>
              <li>• Clean, accessible form structure</li>
            </ul>
          </div>

          <div>
            <h3
              class="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              Key Learning Outcomes
            </h3>
            <ul class="space-y-1 text-xs text-gray-700 dark:text-gray-300">
              <li>• Master the three-part pattern (model-suite-template)</li>
              <li>• Understand signal-based reactive forms</li>
              <li>• Learn proper one-way vs two-way binding</li>
              <li>• Experience validation feedback timing</li>
            </ul>
          </div>
        </div>

        <div
          class="mt-4 border-t border-indigo-200 pt-4 dark:border-indigo-700"
        >
          <div class="text-xs text-gray-600 dark:text-gray-400">
            📖 <strong>Next step:</strong> Try the
            <a
              href="/fundamentals/basic-validation"
              class="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
              >Basic Validation</a
            >
            example to learn manual error handling.
          </div>
        </div>
      </ngx-card>
    </div>
  `,
})
export class MinimalFormPage {
  protected readonly formComponent =
    viewChild.required<MinimalForm>('formComponent');
}
