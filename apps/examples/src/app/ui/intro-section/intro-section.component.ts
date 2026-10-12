import { Component, input } from '@angular/core';

@Component({
  selector: 'ngx-intro-section',
  template: `
    <section class="border-b border-gray-200 py-6 md:py-8 dark:border-gray-700">
      <h2
        class="mb-4 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl dark:text-white"
      >
        {{ title() }}
      </h2>
      <ul
        class="max-w-3xl space-y-2.5 text-sm leading-relaxed text-gray-700 md:text-base dark:text-gray-200"
      >
        <ng-content />
      </ul>
    </section>
  `,
  host: { class: 'block' },
})
export class IntroSectionComponent {
  readonly title = input<string>('Why start here');
}
