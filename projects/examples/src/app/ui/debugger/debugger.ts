import { JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type { EnhancedVestForm } from 'ngx-vest-forms/core';

@Component({
  selector: 'ngx-debugger',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [JsonPipe],
  templateUrl: './debugger.html',
  styleUrl: './debugger.css',
})
export class Debugger {
  readonly form = input.required<EnhancedVestForm<Record<string, unknown>>>();

  protected readonly model = computed(() => this.form().model());
  protected readonly valid = computed(() => this.form().valid());
  protected readonly pending = computed(() => this.form().pending());
  protected readonly submitting = computed(() => this.form().submitting());
  protected readonly errors = computed(() => this.form().errors());
  protected readonly errorEntries = computed(() =>
    Object.entries(this.errors())
      .filter(([, messages]) => messages.length > 0)
      .map(([field, messages]) => ({
        field,
        messages,
      })),
  );
}

export function asDebuggerForm<TModel extends Record<string, unknown>>(
  form: EnhancedVestForm<TModel>,
): EnhancedVestForm<Record<string, unknown>> {
  return form as unknown as EnhancedVestForm<Record<string, unknown>>;
}
