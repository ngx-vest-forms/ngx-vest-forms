import { Component, input, ContentChild, TemplateRef } from '@angular/core';

@Component({
  selector: 'ngx-intro-section',
  standalone: true,
  template: `
    <section
      class="py-12 md:py-14 border-b border-gray-200 dark:border-gray-700"
    >
      <h2 class="text-xl md:text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        {{ title() }}
      </h2>
      <ul
        class="space-y-3 text-base text-gray-700 dark:text-gray-200 max-w-3xl"
      >
        <ng-content />
      </ul>
    </section>
  `,
})
export class IntroSectionComponent {
  readonly title = input<string>('Why start here');
}
