import { Component } from '@angular/core';

@Component({
  selector: 'ngx-intro-item',
  standalone: true,
  template: `
    <li
      class="flex gap-3 leading-relaxed"
    >
      <span
        class="text-teal-600 dark:text-teal-400 font-semibold shrink-0 pt-1"
        aria-hidden="true"
      >
        •
      </span>
      <span class="flex-1">
        <ng-content />
      </span>
    </li>
  `,
})
export class IntroItemComponent {}
