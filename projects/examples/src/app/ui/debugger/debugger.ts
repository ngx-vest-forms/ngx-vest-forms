import { JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type { EnhancedVestForm } from 'ngx-vest-forms';

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

  /**
   * Use the form's visibleErrors convenience API which automatically filters
   * errors based on the error display strategy (immediate, on-touch, on-submit, manual).
   * This respects which fields should show errors according to their showErrors() state.
   */
  protected readonly visibleErrors = computed(() =>
    this.form().visibleErrors(),
  );

  protected readonly errorEntries = computed(() =>
    Object.entries(this.visibleErrors())
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
