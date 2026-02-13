import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  signal,
} from '@angular/core';
import { createEmptyFormState, NgxFormState } from 'ngx-vest-forms';
import { AlertPanel } from '../alert-panel/alert-panel.component';
import { Card } from '../card/card.component';
import { JsonPreviewComponent } from '../json-preview/json-preview.component';
import { StatusBadge } from '../status-badge/status-badge.component';

/**
 * Accepts either a flat string array or a field-keyed record.
 * The component normalises both forms internally.
 */
type MessageInput = readonly string[] | Record<string, string[]>;

@Component({
  selector: 'ngx-form-state-card',
  imports: [Card, StatusBadge, AlertPanel, JsonPreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ngx-card>
      <div class="mb-4 border-b border-gray-200 pb-4 dark:border-gray-700">
        <div class="flex items-center justify-between gap-3">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">
            {{ title() }}
          </h3>
          <ngx-status-badge
            [valid]="effectiveIsValid()"
            [pending]="isPending()"
          />
        </div>
      </div>

      @if (hasMessages()) {
        <div class="mb-4 space-y-2">
          @if (resolvedMessages().length > 0) {
            <ngx-alert-panel tone="success" [title]="resolvedTitle()">
              <ul class="list-disc space-y-1 pl-5">
                @for (message of resolvedMessages(); track message) {
                  <li>{{ message }}</li>
                }
              </ul>
            </ngx-alert-panel>
          }

          @if (uniqueErrors().length > 0) {
            <ngx-alert-panel tone="error" [title]="errorsTitle()">
              <ul class="list-disc space-y-1 pl-5">
                @for (message of uniqueErrors(); track message) {
                  <li>{{ message }}</li>
                }
              </ul>
            </ngx-alert-panel>
          }

          @if (uniqueWarnings().length > 0) {
            <ngx-alert-panel tone="warning" [title]="warningsTitle()">
              <ul class="list-disc space-y-1 pl-5">
                @for (message of uniqueWarnings(); track message) {
                  <li>{{ message }}</li>
                }
              </ul>
            </ngx-alert-panel>
          }

          @if (uniqueInfo().length > 0) {
            <ngx-alert-panel tone="info" [title]="infoTitle()">
              <ul class="list-disc space-y-1 pl-5">
                @for (message of uniqueInfo(); track message) {
                  <li>{{ message }}</li>
                }
              </ul>
            </ngx-alert-panel>
          }
        </div>
      }

      <ngx-json-preview
        [title]="formValueTitle()"
        [value]="effectiveFormValue()"
      />
    </ngx-card>
  `,
})
export class FormStateCardComponent {
  readonly title = input('Form State');
  readonly formValueTitle = input('Form Value');
  readonly formState = input<NgxFormState<unknown> | null>(null);
  readonly isValid = input<boolean | null>(null);
  readonly formValue = input<unknown | null>(null);

  /** Accepts a flat `string[]` or a `Record<string, string[]>` (flattened internally). */
  readonly errors = input<MessageInput | null>(null);
  /** Accepts a flat `string[]` or a `Record<string, string[]>` (flattened internally). */
  readonly warnings = input<MessageInput | null>(null);
  /** Accepts a flat `string[]` or a `Record<string, string[]>` (flattened internally). */
  readonly info = input<MessageInput | null>(null);

  readonly errorsTitle = input('Errors');
  readonly warningsTitle = input('Warnings');
  readonly infoTitle = input('Info');
  readonly resolvedTitle = input('Passing');

  /**
   * Accumulated history of all errors/warnings ever seen per field.
   * Used to compute which validations have been resolved.
   */
  readonly #knownErrors = signal<Record<string, string[]>>({});
  readonly #knownWarnings = signal<Record<string, string[]>>({});

  constructor() {
    effect(() => {
      const current = this.#errorsRecord();
      this.#knownErrors.update((known) => this.#mergeRecords(known, current));
    });
    effect(() => {
      const current = this.#warningsRecord();
      this.#knownWarnings.update((known) => this.#mergeRecords(known, current));
    });
  }

  // ── Internals: Record-form of current errors/warnings ──────────────

  readonly #errorsRecord = computed(() => {
    const explicit = this.errors();
    if (explicit !== null) return this.#toRecord(explicit);
    return this.resolvedFormState().errors;
  });

  readonly #warningsRecord = computed(() => this.#toRecord(this.warnings()));

  // ── Resolved: validations that were failing/warning but now pass ───

  protected readonly resolvedMessages = computed(() => {
    const resolvedErrors = this.#resolvedFromRecord(
      this.#knownErrors(),
      this.#errorsRecord()
    );
    const resolvedWarnings = this.#resolvedFromRecord(
      this.#knownWarnings(),
      this.#warningsRecord()
    );
    return [...new Set([...resolvedErrors, ...resolvedWarnings])];
  });

  // ── Display computeds ─────────────────────────────────────────────

  protected readonly resolvedFormState = computed(
    () => this.formState() ?? createEmptyFormState<unknown>()
  );

  protected readonly effectiveIsValid = computed(
    () => this.isValid() ?? this.resolvedFormState().valid
  );

  protected readonly effectiveFormValue = computed(
    () => this.formValue() ?? this.resolvedFormState().value
  );

  protected readonly uniqueErrors = computed(() =>
    this.#flattenUnique(this.#errorsRecord())
  );

  protected readonly uniqueWarnings = computed(() =>
    this.#flattenUnique(this.#warningsRecord())
  );

  protected readonly uniqueInfo = computed(() =>
    this.#toUnique(this.#normalizeMessages(this.info()))
  );

  protected readonly hasDisplayableValidationMessages = computed(
    () => this.uniqueErrors().length > 0 || this.uniqueWarnings().length > 0
  );

  protected readonly isPending = computed(
    () => !this.effectiveIsValid() && !this.hasDisplayableValidationMessages()
  );

  protected readonly hasMessages = computed(
    () =>
      this.resolvedMessages().length > 0 ||
      this.uniqueErrors().length > 0 ||
      this.uniqueWarnings().length > 0 ||
      this.uniqueInfo().length > 0
  );

  // ── Helpers ────────────────────────────────────────────────────────

  /**
   * Convert a `MessageInput` to a field-keyed Record.
   * Flat arrays are stored under a synthetic `_flat` key.
   */
  #toRecord(input: MessageInput | null): Record<string, string[]> {
    if (input === null) return {};
    if (Array.isArray(input)) {
      return input.length > 0 ? { _flat: [...input] as string[] } : {};
    }
    return input as Record<string, string[]>;
  }

  /**
   * Merge incoming messages into an existing accumulated record.
   * Returns the same reference when nothing changed (avoids signal churn).
   */
  #mergeRecords(
    existing: Record<string, string[]>,
    incoming: Record<string, string[]>
  ): Record<string, string[]> {
    let result = existing;
    let changed = false;

    for (const [field, messages] of Object.entries(incoming)) {
      const existingMsgs = new Set(existing[field] ?? []);
      const newMsgs = messages.filter((msg) => !existingMsgs.has(msg));

      if (newMsgs.length > 0) {
        if (!changed) {
          result = { ...existing };
          changed = true;
        }
        result[field] = [...(existing[field] ?? []), ...newMsgs];
      }
    }
    return result;
  }

  /**
   * Find messages in `all` that are no longer present in `current` (field-aware).
   */
  #resolvedFromRecord(
    all: Record<string, string[]>,
    current: Record<string, string[]>
  ): string[] {
    const resolved: string[] = [];
    for (const [field, messages] of Object.entries(all)) {
      const currentFieldMsgs = new Set(current[field] ?? []);
      for (const msg of messages) {
        if (!currentFieldMsgs.has(msg)) {
          resolved.push(msg);
        }
      }
    }
    return resolved;
  }

  /**
   * Normalise a `MessageInput` into a flat string array.
   * Used for `info` messages which have no resolved-tracking.
   */
  #normalizeMessages(input: MessageInput | null): readonly string[] {
    if (input === null) return [];
    if (Array.isArray(input)) return input;
    return this.#flattenRecord(input as Record<string, string[]>);
  }

  #toUnique(messages: readonly string[]): string[] {
    return [...new Set(messages.filter(Boolean))];
  }

  #flattenRecord(messagesByField: Record<string, string[]>): string[] {
    return [...new Set(Object.values(messagesByField).flat().filter(Boolean))];
  }

  #flattenUnique(record: Record<string, string[]>): string[] {
    return this.#toUnique(this.#flattenRecord(record));
  }
}
