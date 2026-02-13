import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

@Component({
  selector: 'ngx-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      [class.bg-gray-100]="pending()"
      [class.text-gray-700]="pending()"
      [class.dark:bg-gray-700]="pending()"
      [class.dark:text-gray-200]="pending()"
      [class.bg-green-100]="!pending() && valid()"
      [class.text-green-800]="!pending() && valid()"
      [class.dark:bg-green-900]="!pending() && valid()"
      [class.dark:text-green-300]="!pending() && valid()"
      [class.bg-red-100]="!pending() && !valid()"
      [class.text-red-800]="!pending() && !valid()"
      [class.dark:bg-red-900]="!pending() && !valid()"
      [class.dark:text-red-300]="!pending() && !valid()"
      [attr.aria-label]="ariaLabel()"
    >
      @if (pending()) {
        {{ pendingLabel() }}
      } @else {
        {{ valid() ? validLabel() : invalidLabel() }}
      }
    </span>
  `,
})
export class StatusBadge {
  readonly valid = input.required<boolean>();
  readonly pending = input(false);
  readonly validLabel = input('Valid');
  readonly invalidLabel = input('Invalid');
  readonly pendingLabel = input('Pending');

  protected readonly ariaLabel = computed(() => {
    if (this.pending()) {
      return this.pendingLabel();
    }
    return this.valid() ? this.validLabel() : this.invalidLabel();
  });
}
