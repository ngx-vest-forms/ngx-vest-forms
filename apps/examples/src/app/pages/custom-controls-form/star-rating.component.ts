import {
  Component,
  forwardRef,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let nextId = 0;

/**
 * A non-native star-rating control built on Angular's
 * {@link ControlValueAccessor}. Registered through `NG_VALUE_ACCESSOR` so it
 * plugs into `[ngModel]` and ngx-vest-forms exactly like a native `<input>`:
 * it participates in validation, touched tracking and submission.
 *
 * Accessibility: rendered as a `radiogroup` of `radio` buttons, fully keyboard
 * operable (Arrow/Home/End), with `focus-visible` styling. `onTouched` fires on
 * blur so ngx-vest-forms marks the field touched and shows errors on time.
 */
@Component({
  selector: 'ngx-star-rating',
  template: `
    <div
      role="radiogroup"
      [attr.aria-label]="'Rating, 1 to 5 stars'"
      class="flex items-center gap-1"
      (focusout)="onBlur()"
    >
      @for (star of stars; track star) {
        <button
          type="button"
          role="radio"
          [id]="groupId + '-' + star"
          [attr.aria-label]="star + (star === 1 ? ' star' : ' stars')"
          [attr.aria-checked]="value() === star"
          [attr.tabindex]="rovingIndex(star)"
          [disabled]="disabled()"
          (click)="select(star)"
          (keydown)="onKeydown($event, star)"
          class="focus-visible:ring-primary-500 rounded p-1 text-2xl leading-none transition-colors focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
          [class.text-primary-500]="star <= (hovered() ?? value() ?? 0)"
          [class.text-gray-300]="star > (hovered() ?? value() ?? 0)"
          [class.dark:text-gray-600]="star > (hovered() ?? value() ?? 0)"
          (mouseenter)="!disabled() && hovered.set(star)"
          (mouseleave)="hovered.set(null)"
        >
          <span aria-hidden="true">{{
            star <= (hovered() ?? value() ?? 0) ? '★' : '☆'
          }}</span>
        </button>
      }

      <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">
        {{ value() ? value() + ' / 5' : 'No rating' }}
      </span>
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => StarRatingComponent),
      multi: true,
    },
  ],
})
export class StarRatingComponent implements ControlValueAccessor {
  protected readonly groupId = `ngx-star-rating-${nextId++}`;
  protected readonly stars = [1, 2, 3, 4, 5] as const;

  protected readonly value = signal<number | null>(null);
  protected readonly hovered = signal<number | null>(null);
  protected readonly disabled = signal(false);

  private onChange: (value: number | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  /** Active descendant gets tabindex 0, the rest -1 (roving tabindex). */
  protected rovingIndex(star: number): number {
    const current = this.value() ?? 1;
    return star === current ? 0 : -1;
  }

  protected select(star: number): void {
    if (this.disabled()) return;
    this.value.set(star);
    this.onChange(star);
  }

  protected onBlur(): void {
    this.onTouched();
  }

  protected onKeydown(event: KeyboardEvent, star: number): void {
    if (this.disabled()) return;
    const next = (() => {
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          return Math.min(5, star + 1);
        case 'ArrowLeft':
        case 'ArrowDown':
          return Math.max(1, star - 1);
        case 'Home':
          return 1;
        case 'End':
          return 5;
        default:
          return null;
      }
    })();
    if (next === null) return;
    event.preventDefault();
    // Boundary keys (e.g. ArrowLeft on the first star) resolve to the current
    // value — only emit when it actually changes so we don't mark the control
    // dirty on a no-op.
    if (next !== star) {
      this.select(next);
    }
    // Direct id lookup keeps the demo dependency-free; this app is CSR-only so
    // `document` access is safe (a viewChildren()-based query would be the
    // SSR-safe alternative).
    const el = document.getElementById(`${this.groupId}-${next}`);
    el?.focus();
  }

  // ── ControlValueAccessor ──────────────────────────────────────────
  writeValue(value: number | null): void {
    this.value.set(typeof value === 'number' ? value : null);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
