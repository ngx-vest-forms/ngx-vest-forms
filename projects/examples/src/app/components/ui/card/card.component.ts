import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'ngx-card',

  imports: [CommonModule],
  template: `
    <div class="card">
      @if (title()) {
        <div class="mb-4 border-b border-gray-200 pb-4 dark:border-gray-700">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">
            {{ title() }}
          </h3>
          @if (subtitle()) {
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ subtitle() }}
            </p>
          }
        </div>
      }
      <ng-content></ng-content>
    </div>
  `,
})
export class CardComponent {
  readonly title = input<string>();
  readonly subtitle = input<string>();
}
