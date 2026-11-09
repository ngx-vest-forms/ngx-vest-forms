import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'ngx-status-badge',
  template: `
    <span
      class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      [class]="colourClasses()"
      [attr.aria-label]="ariaLabel()"
    >
      @if (pending()) {
        {{ pendingLabel() }}
      } @else if (pristine()) {
        {{ pristineLabel() }}
      } @else {
        {{ valid() ? validLabel() : invalidLabel() }}
      }
    </span>
  `,
})
export class StatusBadge {
  readonly valid = input.required<boolean>();
  readonly pending = input(false);
  readonly pristine = input(false);
  readonly validLabel = input('Valid');
  readonly invalidLabel = input('Invalid');
  readonly pendingLabel = input('Pending');
  readonly pristineLabel = input('Pristine');

  /**
   * One binding for the colour classes. Separate `[class.x]` bindings for
   * states that share a class (pending and pristine are both gray) would
   * fight over the same class, and the last one written would win.
   */
  protected readonly colourClasses = computed(() => {
    if (this.pending() || this.pristine()) {
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200';
    }
    return this.valid()
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  });

  protected readonly ariaLabel = computed(() => {
    if (this.pending()) {
      return this.pendingLabel();
    }
    if (this.pristine()) {
      return this.pristineLabel();
    }
    return this.valid() ? this.validLabel() : this.invalidLabel();
  });
}
