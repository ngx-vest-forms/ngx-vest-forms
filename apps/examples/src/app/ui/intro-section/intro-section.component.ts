import { Component, input } from '@angular/core';

@Component({
  selector: 'ngx-intro-section',
  standalone: true,
  template: `
    <section
      class="py-6 md:py-8 border-b border-gray-200 dark:border-gray-700"
    >
      <h2 class="text-2xl md:text-3xl font-bold mb-4 text-gray-900 dark:text-white tracking-tight">
        {{ title() }}
      </h2>
      <ul
        class="space-y-2.5 text-sm md:text-base text-gray-700 dark:text-gray-200 max-w-3xl leading-relaxed"
      >
        <ng-content />
      </ul>
    </section>
  `,
})
export class IntroSectionComponent {
  readonly title = input<string>('Why start here');
}
