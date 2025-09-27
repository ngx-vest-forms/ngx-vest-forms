import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';

@Component({
  selector: 'ngx-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]':
      "'block rounded-xl shadow-sm ' + (variant() === 'primary-outline' ? 'border border-indigo-300 dark:border-indigo-500' : variant() === 'educational' ? 'bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20' : '')",
  },
  template: `
    <div
      class="ngx-card__inner flex flex-col gap-4 rounded-xl p-6 dark:bg-gray-800"
    >
      @if (hasHeader()) {
        <header
          class="mb-1 block text-sm font-semibold tracking-wide text-gray-900 uppercase dark:text-gray-100"
          [attr.id]="labelledBy() ?? null"
        >
          <ng-content select="[card-header]"></ng-content>
        </header>
      }
      <ng-content></ng-content>
    </div>
  `,
})
export class CardComponent {
  variant = input<'default' | 'primary-outline' | 'educational'>('default');
  labelledBy = input<string | null>(null);
  describedBy = input<string | null>(null);

  private readonly _hasHeader = signal(false);
  hasHeader = this._hasHeader.asReadonly();

  private readonly elementReference = inject(ElementRef);
  constructor() {
    // Observe projected header presence
    const host = this.elementReference.nativeElement;
    const update = () => {
      const has = !!host.querySelector('[card-header]');
      if (this._hasHeader() !== has) this._hasHeader.set(has);
    };
    const mo = new MutationObserver(update);
    mo.observe(host, { childList: true, subtree: true });
    update();
  }
}
