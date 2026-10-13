import { Component, computed, input } from '@angular/core';

type AlertTone = 'error' | 'warning' | 'info' | 'success';

/**
 * Live-region behavior of the panel.
 *
 * Matches the library's documented contract (see the control-wrapper
 * template docs): field-level and informational feedback is `polite`;
 * `assertive` (`role="alert"`) is reserved for submission-blocking
 * form-level errors. Use `off` for always-visible inspector panels whose
 * content duplicates what field wrappers already announce.
 */
type AlertLive = 'polite' | 'assertive' | 'off';

@Component({
  selector: 'ngx-alert-panel',
  template: `
    <section
      class="rounded-lg border p-4"
      [class.border-red-200]="tone() === 'error'"
      [class.bg-red-50]="tone() === 'error'"
      [class.text-red-700]="tone() === 'error'"
      [class.dark:border-red-800]="tone() === 'error'"
      [class.dark:bg-red-900/30]="tone() === 'error'"
      [class.dark:text-red-300]="tone() === 'error'"
      [class.border-yellow-200]="tone() === 'warning'"
      [class.bg-yellow-50]="tone() === 'warning'"
      [class.text-yellow-700]="tone() === 'warning'"
      [class.dark:border-yellow-800]="tone() === 'warning'"
      [class.dark:bg-yellow-900/30]="tone() === 'warning'"
      [class.dark:text-yellow-300]="tone() === 'warning'"
      [class.border-blue-200]="tone() === 'info'"
      [class.bg-blue-50]="tone() === 'info'"
      [class.text-blue-700]="tone() === 'info'"
      [class.dark:border-blue-900/40]="tone() === 'info'"
      [class.dark:bg-blue-900/20]="tone() === 'info'"
      [class.dark:text-blue-200]="tone() === 'info'"
      [class.border-green-200]="tone() === 'success'"
      [class.bg-green-50]="tone() === 'success'"
      [class.text-green-700]="tone() === 'success'"
      [class.dark:border-green-800]="tone() === 'success'"
      [class.dark:bg-green-900/30]="tone() === 'success'"
      [class.dark:text-green-300]="tone() === 'success'"
      [attr.role]="role()"
      [attr.aria-live]="ariaLive()"
      [attr.aria-atomic]="live() === 'off' ? null : true"
      [attr.aria-label]="title() || null"
    >
      @if (title()) {
        <h2 class="mb-2 text-sm font-semibold">{{ title() }}</h2>
      }
      <div class="text-sm">
        <ng-content></ng-content>
      </div>
    </section>
  `,
  host: {
    style: 'display: block;',
  },
})
export class AlertPanel {
  readonly tone = input<AlertTone>('info');
  readonly title = input<string>();

  /**
   * Live-region politeness. Defaults to `polite` (`role="status"`).
   * Set to `assertive` only for genuine submission-blocking alerts, or
   * `off` to render with no live semantics at all.
   */
  readonly live = input<AlertLive>('polite');

  protected readonly role = computed(() => {
    switch (this.live()) {
      case 'assertive':
        return 'alert';
      case 'polite':
        return 'status';
      default:
        return null;
    }
  });

  protected readonly ariaLive = computed(() =>
    this.live() === 'off' ? null : this.live()
  );
}
