import { JsonPipe } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'ngx-form-state-display',
  imports: [JsonPipe],
  template: `
    <div class="mt-6 rounded-lg bg-black/80 p-4 text-xs text-green-400">
      <div class="mb-2 font-mono text-gray-400 dark:text-gray-300">
        {{ title() }}:
      </div>
      @if (formState(); as state) {
        <pre class="max-h-48 overflow-auto">{{ state | json }}</pre>
      }
    </div>
  `,
})
export class FormStateDisplayComponent {
  readonly title = input.required<string>();
  readonly formState = input.required<unknown>();
}
