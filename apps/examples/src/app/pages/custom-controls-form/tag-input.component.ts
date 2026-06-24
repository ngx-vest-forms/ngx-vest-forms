import {
  Component,
  forwardRef,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let nextId = 0;

/**
 * An inline tag editor built on {@link ControlValueAccessor}. Type and press
 * Enter to add a tag; click a tag (or press its ×) to remove it. The model
 * value is a `string[]`, fed through `[ngModel]` so ngx-vest-forms validates
 * it (≥1 tag required, >5 advisory warning) like any native field.
 *
 * Accessibility: a labelled text input plus a `list` of tags, each removable
 * via a real `button` with an accessible name. `onTouched` fires when focus
 * leaves the control so the field is marked touched.
 */
@Component({
  selector: 'ngx-tag-input',
  template: `
    <div (focusout)="onFocusOut($event)">
      @if (tags().length > 0) {
        <ul class="mb-2 flex flex-wrap gap-2" role="list">
          @for (tag of tags(); track tag; let i = $index) {
            <li
              class="bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-200 inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm"
            >
              <span>{{ tag }}</span>
              <button
                type="button"
                [attr.aria-label]="'Remove tag ' + tag"
                [disabled]="disabled()"
                (click)="remove(i)"
                class="text-primary-600 hover:text-primary-900 focus-visible:ring-primary-500 dark:text-primary-300 rounded-full leading-none focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span aria-hidden="true">×</span>
              </button>
            </li>
          }
        </ul>
      }

      <input
        #tagBox
        type="text"
        class="input-field"
        [id]="inputId"
        [disabled]="disabled()"
        aria-label="Add a tag"
        placeholder="Type a tag and press Enter"
        (keydown.enter)="add($event, tagBox)"
      />
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TagInputComponent),
      multi: true,
    },
  ],
  host: { class: 'block' },
})
export class TagInputComponent implements ControlValueAccessor {
  protected readonly inputId = `ngx-tag-input-${nextId++}`;
  protected readonly tags = signal<string[]>([]);
  protected readonly disabled = signal(false);

  private onChange: (value: string[]) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  protected add(event: Event, box: HTMLInputElement): void {
    event.preventDefault();
    if (this.disabled()) return;
    const raw = box.value.trim();
    if (!raw) return;
    if (this.tags().includes(raw)) {
      box.value = '';
      return;
    }
    this.tags.update((tags) => [...tags, raw]);
    box.value = '';
    this.onChange(this.tags());
  }

  protected remove(index: number): void {
    if (this.disabled()) return;
    this.tags.update((tags) => tags.filter((_, i) => i !== index));
    this.onChange(this.tags());
  }

  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (!next || !(event.currentTarget as Node).contains(next)) {
      this.onTouched();
    }
  }

  // ── ControlValueAccessor ──────────────────────────────────────────
  writeValue(value: string[] | null): void {
    this.tags.set(Array.isArray(value) ? [...value] : []);
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
