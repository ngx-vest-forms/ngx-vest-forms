import { Component } from '@angular/core';

@Component({
  selector: 'ngx-intro-item',
  template: `
    <span
      class="shrink-0 pt-0.5 text-lg font-bold text-teal-500 dark:text-teal-400"
      aria-hidden="true"
    >
      {{ bullet }}
    </span>
    <span class="flex-1">
      <ng-content />
    </span>
  `,
  host: {
    class: 'flex gap-3 leading-relaxed',
    role: 'listitem',
  },
})
export class IntroItemComponent {
  protected readonly bullet = '▸';
}
