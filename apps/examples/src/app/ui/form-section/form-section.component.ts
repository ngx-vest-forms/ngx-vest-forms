import { Component, input } from '@angular/core';

type FormSectionTone =
  | 'blue'
  | 'teal'
  | 'green'
  | 'purple'
  | 'orange'
  | 'neutral';

@Component({
  selector: 'ngx-form-section',
  template: `
    <section
      class="rounded-lg border p-6"
      [class.border-blue-100]="tone() === 'blue'"
      [class.bg-blue-50/30]="tone() === 'blue'"
      [class.dark:border-blue-900/30]="tone() === 'blue'"
      [class.dark:bg-blue-900/10]="tone() === 'blue'"
      [class.border-teal-100]="tone() === 'teal'"
      [class.bg-teal-50/30]="tone() === 'teal'"
      [class.dark:border-teal-900/30]="tone() === 'teal'"
      [class.dark:bg-teal-900/10]="tone() === 'teal'"
      [class.border-green-100]="tone() === 'green'"
      [class.bg-green-50/30]="tone() === 'green'"
      [class.dark:border-green-900/30]="tone() === 'green'"
      [class.dark:bg-green-900/10]="tone() === 'green'"
      [class.border-purple-100]="tone() === 'purple'"
      [class.bg-purple-50/30]="tone() === 'purple'"
      [class.dark:border-purple-900/30]="tone() === 'purple'"
      [class.dark:bg-purple-900/10]="tone() === 'purple'"
      [class.border-orange-100]="tone() === 'orange'"
      [class.bg-orange-50/30]="tone() === 'orange'"
      [class.dark:border-orange-900/30]="tone() === 'orange'"
      [class.dark:bg-orange-900/10]="tone() === 'orange'"
      [class.border-gray-200]="tone() === 'neutral'"
      [class.bg-white]="tone() === 'neutral'"
      [class.dark:border-gray-700]="tone() === 'neutral'"
      [class.dark:bg-gray-800]="tone() === 'neutral'"
    >
      <h3
        class="mb-3 text-sm font-semibold"
        [class.text-blue-600]="tone() === 'blue'"
        [class.dark:text-blue-400]="tone() === 'blue'"
        [class.text-teal-700]="tone() === 'teal'"
        [class.dark:text-teal-300]="tone() === 'teal'"
        [class.text-green-700]="tone() === 'green'"
        [class.dark:text-green-400]="tone() === 'green'"
        [class.text-purple-600]="tone() === 'purple'"
        [class.dark:text-purple-400]="tone() === 'purple'"
        [class.text-orange-700]="tone() === 'orange'"
        [class.dark:text-orange-400]="tone() === 'orange'"
        [class.text-gray-700]="tone() === 'neutral'"
        [class.dark:text-gray-200]="tone() === 'neutral'"
      >
        {{ title() }}
      </h3>

      @if (description()) {
        <p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
          {{ description() }}
        </p>
      }

      <ng-content></ng-content>
    </section>
  `,
  host: { style: 'display: block;' },
})
export class FormSectionComponent {
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly tone = input<FormSectionTone>('neutral');
}
