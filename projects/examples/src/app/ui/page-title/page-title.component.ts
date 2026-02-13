import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ngx-page-title',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mb-6">
      <h1 class="text-3xl font-bold text-gray-950 dark:text-gray-50">
        {{ title() }}
      </h1>
      @if (subtitle()) {
        <p class="mt-2 text-gray-700 dark:text-gray-200">{{ subtitle() }}</p>
      }
    </header>
  `,
})
export class PageTitle {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}
