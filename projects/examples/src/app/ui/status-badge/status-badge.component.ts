import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

@Component({
  selector: 'ngx-status-badge',
  template: `
    <span
      class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      [class.bg-gray-100]="pending()"
      [class.text-gray-700]="pending()"
      [class.dark:bg-gray-700]="pending()"
      [class.dark:text-gray-200]="pending()"
      [class.bg-slate-100]="!pending() && pristine()"
      [class.text-slate-700]="!pending() && pristine()"
      [class.dark:bg-slate-700]="!pending() && pristine()"
      [class.dark:text-slate-200]="!pending() && pristine()"
      [class.bg-green-100]="!pending() && !pristine() && valid()"
      [class.text-green-800]="!pending() && !pristine() && valid()"
      [class.dark:bg-green-900]="!pending() && !pristine() && valid()"
      [class.dark:text-green-300]="!pending() && !pristine() && valid()"
      [class.bg-red-100]="!pending() && !pristine() && !valid()"
      [class.text-red-800]="!pending() && !pristine() && !valid()"
      [class.dark:bg-red-900]="!pending() && !pristine() && !valid()"
      [class.dark:text-red-300]="!pending() && !pristine() && !valid()"
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadge {
  readonly valid = input.required<boolean>();
  readonly pending = input(false);
  readonly pristine = input(false);
  readonly validLabel = input('Valid');
  readonly invalidLabel = input('Invalid');
  readonly pendingLabel = input('Pending');
  readonly pristineLabel = input('Pristine');

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
