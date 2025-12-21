import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type WizardStepStatus = 'completed' | 'current' | 'upcoming';

export type WizardStepConfig = {
  id: number;
  title: string;
  description?: string;
};

/**
 * Wizard step indicator component
 * Displays a horizontal stepper with step numbers, titles, and connection lines
 *
 * A11y Features:
 * - Uses aria-current="step" for current step
 * - Provides aria-label with full context for screen readers
 * - Uses semantic list structure
 */
@Component({
  selector: 'ngx-wizard-steps',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav
      [attr.aria-label]="
        'Progress: Step ' + currentStep() + ' of ' + steps().length
      "
    >
      <ol role="list" class="flex items-center justify-between">
        @for (
          step of steps();
          track step.id;
          let i = $index;
          let last = $last
        ) {
          <li class="relative" [class.flex-1]="!last">
            <!-- Step connector line -->
            @if (!last) {
              <div
                class="absolute top-4 left-0 mt-0.5 -ml-px h-0.5 w-full"
                [class.bg-blue-600]="getStepStatus(step.id) === 'completed'"
                [class.bg-gray-200]="getStepStatus(step.id) !== 'completed'"
                [class.dark:bg-blue-500]="
                  getStepStatus(step.id) === 'completed'
                "
                [class.dark:bg-gray-700]="
                  getStepStatus(step.id) !== 'completed'
                "
                aria-hidden="true"
              ></div>
            }

            <div class="group relative flex flex-col items-center">
              <!-- Step circle with screen reader text -->
              <span
                class="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium"
                [class.bg-blue-600]="getStepStatus(step.id) === 'completed'"
                [class.text-white]="getStepStatus(step.id) === 'completed'"
                [class.border-2]="getStepStatus(step.id) !== 'completed'"
                [class.border-blue-600]="getStepStatus(step.id) === 'current'"
                [class.bg-white]="getStepStatus(step.id) === 'current'"
                [class.text-blue-600]="getStepStatus(step.id) === 'current'"
                [class.border-gray-300]="getStepStatus(step.id) === 'upcoming'"
                [class.bg-white]="getStepStatus(step.id) === 'upcoming'"
                [class.text-gray-500]="getStepStatus(step.id) === 'upcoming'"
                [class.dark:bg-gray-800]="
                  getStepStatus(step.id) === 'current' ||
                  getStepStatus(step.id) === 'upcoming'
                "
                [class.dark:border-blue-500]="
                  getStepStatus(step.id) === 'current'
                "
                [class.dark:text-blue-400]="
                  getStepStatus(step.id) === 'current'
                "
                [class.dark:border-gray-600]="
                  getStepStatus(step.id) === 'upcoming'
                "
                [class.dark:text-gray-400]="
                  getStepStatus(step.id) === 'upcoming'
                "
                [attr.aria-current]="
                  getStepStatus(step.id) === 'current' ? 'step' : null
                "
                [attr.aria-label]="getStepAriaLabel(step)"
                role="img"
              >
                @if (getStepStatus(step.id) === 'completed') {
                  <svg
                    class="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clip-rule="evenodd"
                    />
                  </svg>
                } @else {
                  <span aria-hidden="true">{{ step.id }}</span>
                }
              </span>

              <!-- Step title -->
              <span
                class="mt-2 text-xs font-medium"
                [class.text-blue-600]="
                  getStepStatus(step.id) === 'current' ||
                  getStepStatus(step.id) === 'completed'
                "
                [class.text-gray-500]="getStepStatus(step.id) === 'upcoming'"
                [class.dark:text-blue-400]="
                  getStepStatus(step.id) === 'current' ||
                  getStepStatus(step.id) === 'completed'
                "
                [class.dark:text-gray-400]="
                  getStepStatus(step.id) === 'upcoming'
                "
                aria-hidden="true"
              >
                {{ step.title }}
              </span>
            </div>
          </li>
        }
      </ol>
    </nav>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class WizardStepsComponent {
  readonly steps = input.required<WizardStepConfig[]>();
  readonly currentStep = input.required<number>();
  readonly completedSteps = input<number[]>([]);

  protected getStepStatus(stepId: number): WizardStepStatus {
    if (this.completedSteps().includes(stepId)) {
      return 'completed';
    }
    if (stepId === this.currentStep()) {
      return 'current';
    }
    return 'upcoming';
  }

  /**
   * Generates descriptive aria-label for screen readers
   * e.g., "Step 1: Account - Completed" or "Step 2: Profile - Current"
   */
  protected getStepAriaLabel(step: WizardStepConfig): string {
    const status = this.getStepStatus(step.id);
    const statusText =
      status === 'completed'
        ? 'Completed'
        : status === 'current'
          ? 'Current step'
          : 'Not started';
    return `Step ${step.id}: ${step.title} - ${statusText}`;
  }
}
