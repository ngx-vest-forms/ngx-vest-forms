import { Component, input } from '@angular/core';

@Component({
  selector: 'ngx-page-title',
  template: `
    <header class="mb-5">
      <h1 class="text-4xl font-bold text-balance text-gray-950 dark:text-gray-50 tracking-tight">
        {{ title() }}
      </h1>
      @if (subtitle()) {
        <p class="mt-2 max-w-[65ch] text-wrap-pretty text-gray-700 dark:text-gray-200">{{ subtitle() }}</p>
      }
    </header>
  `,
  host: { class: 'block' },
})
export class PageTitle {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}
