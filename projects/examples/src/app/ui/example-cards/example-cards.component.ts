import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CardComponent } from '../card/card.component';

type DemonstratedCardConfig = {
  icon: string;
  title: string;
  sections: readonly {
    title: string;
    items: readonly string[];
  }[];
};

type LearningCardConfig = {
  title: string;
  sections: readonly {
    title: string;
    items: readonly string[];
  }[];
  nextStep: {
    text: string;
    link: string;
    linkText: string;
  };
};

/**
 * Reusable Educational Cards for Form Examples
 *
 * Provides consistent educational content structure across all form examples.
 * Used for both "What You'll See Demonstrated" and "Learning Journey" cards.
 */
@Component({
  selector: 'ngx-example-cards',
  imports: [CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- What You'll See Demonstrated Card -->
    <ngx-card
      variant="primary-outline"
      [labelledBy]="demonstratedHeadingId"
      class="mb-6 text-left"
    >
      <div card-header>
        <h2 [id]="demonstratedHeadingId" class="mb-4 text-lg font-semibold">
          {{ demonstrated().icon }} {{ demonstrated().title }}
        </h2>
      </div>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        @for (section of demonstrated().sections; track section.title) {
          <div>
            <h3 class="mb-2 font-medium text-gray-900 dark:text-gray-100">
              {{ section.title }}
            </h3>
            <ul class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              @for (item of section.items; track item) {
                <li [innerHTML]="item"></li>
              }
            </ul>
          </div>
        }
      </div>
    </ngx-card>

    <!-- Form Content Slot -->
    <ng-content></ng-content>

    <!-- Learning Journey Card -->
    <ngx-card variant="educational" class="mt-8">
      <div card-header>🎯 {{ learning().title }}</div>

      <div class="grid gap-4 md:grid-cols-2">
        @for (section of learning().sections; track section.title) {
          <div>
            <h3
              class="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              {{ section.title }}
            </h3>
            <ul class="space-y-1 text-xs text-gray-700 dark:text-gray-300">
              @for (item of section.items; track item) {
                <li>{{ item }}</li>
              }
            </ul>
          </div>
        }
      </div>

      <div class="mt-4 border-t border-indigo-200 pt-4 dark:border-indigo-700">
        <div class="text-xs text-gray-600 dark:text-gray-400">
          {{ learning().nextStep.text }}
          <a
            [href]="learning().nextStep.link"
            class="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {{ learning().nextStep.linkText }}
          </a>
        </div>
      </div>
    </ngx-card>
  `,
})
export class ExampleCardsComponent {
  demonstrated = input.required<DemonstratedCardConfig>();
  learning = input.required<LearningCardConfig>();

  protected readonly demonstratedHeadingId = `demonstrated-${Math.random()
    .toString(36)
    .slice(2, 15)}`;
}
