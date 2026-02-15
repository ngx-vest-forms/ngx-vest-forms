import { JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

@Component({
  selector: 'ngx-json-preview',
  imports: [JsonPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (title()) {
      <h2
        class="text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400"
      >
        {{ title() }}
      </h2>
    }

    <pre
      class="mt-2 overflow-x-auto overflow-y-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-300"
      [style.resize]="'vertical'"
      [style.minBlockSize]="'8lh'"
      [style.blockSize]="'min(' + maxLines() + 'lh, max-content)'"
      [style.maxBlockSize]="'max-content'"
      >{{ isStringValue() ? value() : (value() | json) }}</pre
    >
  `,
})
export class JsonPreviewComponent {
  readonly title = input<string>();
  readonly value = input.required<unknown>();
  readonly maxLines = input(32);

  protected readonly isStringValue = computed(
    () => typeof this.value() === 'string'
  );
}
