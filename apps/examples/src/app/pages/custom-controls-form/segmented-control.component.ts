import {
  Component,
  forwardRef,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

type Segment = {
  readonly value: string;
  readonly label: string;
};

let nextId = 0;

/**
 * A segmented single-select control built on {@link ControlValueAccessor}.
 * Registered through `NG_VALUE_ACCESSOR`, so `[ngModel]` and ngx-vest-forms
 * treat it like a native radio group: validation, touched state and
 * submission all work unchanged.
 *
 * Accessibility: `radiogroup`/`radio` semantics, Arrow/Home/End keyboard
 * navigation, `focus-visible` rings, and `onTouched` fired on blur.
 */
@Component({
  selector: 'ngx-segmented-control',
  template: `
    <div
      role="radiogroup"
      aria-label="Experience level"
      class="inline-flex rounded-lg border border-gray-300 bg-gray-50 p-1 dark:border-gray-600 dark:bg-gray-800"
      (focusout)="onBlur()"
    >
      @for (segment of segments; track segment.value) {
        <button
          type="button"
          role="radio"
          [id]="groupId + '-' + segment.value"
          [attr.aria-checked]="value() === segment.value"
          [attr.tabindex]="rovingIndex(segment.value)"
          [disabled]="disabled()"
          (click)="select(segment.value)"
          (keydown)="onKeydown($event, segment.value)"
          class="focus-visible:ring-primary-500 rounded-md px-4 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
          [class.bg-primary-600]="value() === segment.value"
          [class.text-white]="value() === segment.value"
          [class.text-gray-600]="value() !== segment.value"
          [class.dark:text-gray-300]="value() !== segment.value"
          [class.hover:bg-gray-200]="value() !== segment.value && !disabled()"
          [class.dark:hover:bg-gray-700]="
            value() !== segment.value && !disabled()
          "
        >
          {{ segment.label }}
        </button>
      }
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SegmentedControlComponent),
      multi: true,
    },
  ],
  host: { style: 'display: block;' },
})
export class SegmentedControlComponent implements ControlValueAccessor {
  protected readonly groupId = `ngx-segmented-${nextId++}`;
  protected readonly segments: readonly Segment[] = [
    { value: 'junior', label: 'Junior' },
    { value: 'mid', label: 'Mid' },
    { value: 'senior', label: 'Senior' },
  ];

  protected readonly value = signal<string | null>(null);
  protected readonly disabled = signal(false);

  private onChange: (value: string | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  protected rovingIndex(segmentValue: string): number {
    const current = this.value() ?? this.segments[0]?.value;
    return segmentValue === current ? 0 : -1;
  }

  protected select(segmentValue: string): void {
    if (this.disabled()) return;
    this.value.set(segmentValue);
    this.onChange(segmentValue);
  }

  protected onBlur(): void {
    this.onTouched();
  }

  protected onKeydown(event: KeyboardEvent, segmentValue: string): void {
    if (this.disabled()) return;
    const index = this.segments.findIndex((s) => s.value === segmentValue);
    const nextIndex = (() => {
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          return Math.min(this.segments.length - 1, index + 1);
        case 'ArrowLeft':
        case 'ArrowUp':
          return Math.max(0, index - 1);
        case 'Home':
          return 0;
        case 'End':
          return this.segments.length - 1;
        default:
          return null;
      }
    })();
    if (nextIndex === null) return;
    event.preventDefault();
    const next = this.segments[nextIndex]?.value;
    if (next === undefined) return;
    // Boundary keys resolve to the current segment — only emit on real change.
    if (next !== this.value()) {
      this.select(next);
    }
    // Direct id lookup keeps the demo dependency-free; this app is CSR-only so
    // `document` access is safe (a viewChildren()-based query would be the
    // SSR-safe alternative).
    document.getElementById(`${this.groupId}-${next}`)?.focus();
  }

  // ── ControlValueAccessor ──────────────────────────────────────────
  writeValue(value: string | null): void {
    this.value.set(typeof value === 'string' ? value : null);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
