import { Component } from '@angular/core';

@Component({
  selector: 'ngx-intro-item',
  standalone: true,
  template: `
    <li
      class="flex gap-3 leading-relaxed"
    >
      <span
        class="text-teal-500 dark:text-teal-400 font-bold shrink-0 pt-0.5 text-lg"
        aria-hidden="true"
      >
        {{ bullet() }}
      </span>
      <span class="flex-1">
        <ng-content />
      </span>
    </li>
  `,
})
export class IntroItemComponent {
  protected readonly bullet = (): string => '▸';
}
