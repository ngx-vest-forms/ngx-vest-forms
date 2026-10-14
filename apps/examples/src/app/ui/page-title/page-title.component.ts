import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/**
 * Page header for a demo. The title and subtitle come from the demo's route
 * (`title` and `data.subtitle`, both set from `routes.metadata.ts`), so the
 * copy lives in one place.
 */
@Component({
  selector: 'ngx-page-title',
  template: `
    <header class="mb-5">
      <h1
        class="text-4xl font-bold tracking-tight text-balance text-gray-950 dark:text-gray-50"
      >
        {{ title }}
      </h1>
      @if (subtitle) {
        <p
          class="mt-2 max-w-[65ch] text-pretty text-gray-700 dark:text-gray-200"
        >
          {{ subtitle }}
        </p>
      }
    </header>
  `,
  host: { style: 'display: block;' },
})
export class PageTitle {
  readonly #route = inject(ActivatedRoute).snapshot;
  protected readonly title = this.#route.title ?? '';
  protected readonly subtitle = this.#route.data['subtitle'] as
    string | undefined;
}
