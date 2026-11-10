import {
  Component,
  type ElementRef,
  forwardRef,
  input,
  signal,
  viewChildren,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * A non-native star-rating control built on Angular's
 * {@link ControlValueAccessor}. Registered through `NG_VALUE_ACCESSOR` so it
 * plugs into `[ngModel]` and ngx-vest-forms exactly like a native `<input>`:
 * it participates in validation, touched tracking and submission.
 *
 * Accessibility: rendered as a `radiogroup` of `radio` buttons, fully keyboard
 * operable (Arrow/Home/End), with `focus-visible` styling. `onTouched` fires on
 * focus leaving the control, so ngx-vest-forms marks the field touched and
 * shows errors on time, not while the user arrows between stars. Name the
 * group with `ariaLabelledby`, the id of the visible label; without it the
 * group falls back to a generic name.
 */
@Component({
  selector: 'ngx-star-rating',
  template: `
    <div
      role="radiogroup"
      [attr.aria-labelledby]="ariaLabelledby() || null"
      [attr.aria-label]="ariaLabelledby() ? null : 'Rating, 1 to 5 stars'"
      class="flex items-center gap-1"
      (focusout)="onFocusOut($event)"
    >
      @let shown = hovered() ?? value() ?? 0;
      @for (star of stars; track star) {
        @let filled = star <= shown;
        <button
          type="button"
          #option
          role="radio"
          [attr.aria-label]="star + (star === 1 ? ' star' : ' stars')"
          [attr.aria-checked]="value() === star"
          [attr.tabindex]="rovingIndex(star)"
          [disabled]="disabled()"
          (click)="select(star)"
          (keydown)="onKeydown($event, star)"
          class="focus-visible:ring-primary-500 rounded p-1 text-2xl leading-none transition-colors focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
          [class.text-primary-500]="filled"
          [class.text-gray-300]="!filled"
          [class.dark:text-gray-600]="!filled"
          (mouseenter)="!disabled() && hovered.set(star)"
          (mouseleave)="hovered.set(null)"
        >
          <span aria-hidden="true">{{ filled ? '★' : '☆' }}</span>
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
  host: { style: 'display: block;' },
})
export class StarRatingComponent implements ControlValueAccessor {
  /** Id of the element that labels the group, normally the field's label. */
  readonly ariaLabelledby = input<string>();

  protected readonly stars = [1, 2, 3, 4, 5] as const;

  protected readonly value = signal<number | null>(null);
  protected readonly hovered = signal<number | null>(null);
  protected readonly disabled = signal(false);

  private readonly options =
    viewChildren<ElementRef<HTMLButtonElement>>('option');

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

  /**
   * Focus moves between stars as the user arrows. Only mark the control touched
   * once focus leaves it. `relatedTarget` is null when focus leaves the
   * document, which also counts as leaving.
   */
  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget instanceof Node) {
      if (event.currentTarget.contains(next)) return;
    }
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
    this.options()[next - 1]?.nativeElement.focus();
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
