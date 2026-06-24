import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ExampleContent } from '../../shared/example-content';
import { Card } from '../card/card.component';

/**
 * Renders a demo's `<demo>.content.ts` ({@link ExampleContent}) into two
 * side-by-side cards — "What this demonstrates" and "What you'll learn" — so
 * every demo documents itself with the same structure and a developer can
 * judge relevance in seconds without reading the source.
 *
 * This is the only genuinely new shared UI component in the shell upgrade; it
 * composes the existing `ngx-card`.
 */
@Component({
  selector: 'ngx-example-cards',
  imports: [Card, RouterLink],
  template: `
    <div class="grid gap-6 md:grid-cols-2">
      <ngx-card>
        <div class="flex items-start gap-3">
          <span
            class="bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 flex size-10 shrink-0 items-center justify-center rounded-lg text-xl"
            aria-hidden="true"
            >{{ content().demonstrates.icon }}</span
          >
          <div class="min-w-0">
            <h2 class="text-base font-semibold text-gray-900 dark:text-white">
              {{ content().demonstrates.title }}
            </h2>
            <ul
              class="mt-4 space-y-1.5 text-sm text-gray-600 dark:text-gray-300 ml-[-3.25rem]"
            >
              @for (point of content().demonstrates.points; track point) {
                <li class="flex min-w-0 gap-2">
                  <span
                    class="shrink-0 text-primary-600 dark:text-primary-400"
                    aria-hidden="true"
                    >▸</span
                  >
                  <span>{{ point }}</span>
                </li>
              }
            </ul>
          </div>
        </div>
      </ngx-card>

      <ngx-card>
        <div class="flex items-start gap-3">
          <span
            class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-xl text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
            aria-hidden="true"
            >🎓</span
          >
          <div class="min-w-0">
            <h2 class="text-base font-semibold text-gray-900 dark:text-white">
              {{ content().learn.title }}
            </h2>
            <div class="mt-3 space-y-4">
              @for (section of content().learn.sections; track section.title) {
                <div>
                  <h3
                    class="text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    {{ section.title }}
                  </h3>
                  <ul
                    class="mt-2.5 space-y-1.5 text-sm text-gray-600 dark:text-gray-300 ml-[-3.25rem]"
                  >
                    @for (point of section.points; track point) {
                      <li class="flex min-w-0 gap-2">
                        <span
                          class="shrink-0 text-amber-600 dark:text-amber-400"
                          aria-hidden="true"
                          >▸</span
                        >
                        <span>{{ point }}</span>
                      </li>
                    }
                  </ul>
                </div>
              }
            </div>
            @if (content().learn.nextStep; as nextStep) {
              <a
                [routerLink]="['/', nextStep.route]"
                class="text-primary-700 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 mt-4 inline-flex items-center gap-1 text-sm font-medium"
              >
                {{ nextStep.label }}
                <span aria-hidden="true">→</span>
              </a>
            }
          </div>
        </div>
      </ngx-card>
    </div>
  `,
  host: { class: 'block' },
})
export class ExampleCardsComponent {
  /** The page's typed content metadata, authored in `<demo>.content.ts`. */
  readonly content = input.required<ExampleContent>();
}
