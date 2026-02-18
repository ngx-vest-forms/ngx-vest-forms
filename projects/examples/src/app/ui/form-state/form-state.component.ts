import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { createEmptyFormState, NgxFormState, ROOT_FORM } from 'ngx-vest-forms';
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
            [pristine]="isPristine()"
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

      @if (hasPrimaryValidationFeedback()) {
        <div
          class="mt-4 border-t border-gray-200/80 pt-4 dark:border-gray-700/80"
        >
          <ngx-json-preview
            [title]="formValueTitle()"
            [value]="effectiveFormValue()"
          />
        </div>
      } @else {
        <ngx-json-preview
          [title]="formValueTitle()"
          [value]="effectiveFormValue()"
        />
      }

      @if (unusedValidationRules().length > 0) {
        <div
          class="mt-4 border-t border-gray-200/80 pt-4 dark:border-gray-700/80"
        >
          <ngx-alert-panel tone="info" [title]="validationRulesTitle()">
            @if (unusedValidationWarningRules().length > 0) {
              <div class="space-y-3">
                @if (unusedValidationErrorRules().length > 0) {
                  <div>
                    <h4
                      class="text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      {{ validationErrorRulesTitle() }}
                    </h4>
                    <ul class="mt-1 list-disc space-y-1 pl-5">
                      @for (
                        message of unusedValidationErrorRules();
                        track message
                      ) {
                        <li>{{ message }}</li>
                      }
                    </ul>
                  </div>
                }

                <div
                  class="border-t border-gray-200/70 pt-3 dark:border-gray-700/70"
                >
                  <h4
                    class="text-sm font-semibold text-gray-900 dark:text-white"
                  >
                    {{ validationWarningRulesTitle() }}
                  </h4>
                  <ul class="mt-1 list-disc space-y-1 pl-5">
                    @for (
                      message of unusedValidationWarningRules();
                      track message
                    ) {
                      <li>{{ message }}</li>
                    }
                  </ul>
                </div>
              </div>
            } @else {
              <ul class="list-disc space-y-1 pl-5">
                @for (message of unusedValidationErrorRules(); track message) {
                  <li>{{ message }}</li>
                }
              </ul>
            }
          </ngx-alert-panel>
        </div>
      }
    </ngx-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormStateCardComponent {
  readonly title = input('Form State');
  readonly formValueTitle = input('Form Value');
  readonly formState = input<NgxFormState<unknown> | null>(null);
  readonly isValid = input<boolean | null>(null);
  readonly formValue = input<unknown | null>(null);
  /** True when async validation is currently in progress. */
  readonly pending = input(false);

  /** Accepts a flat `string[]` or a `Record<string, string[]>` (flattened internally). */
  readonly errors = input<MessageInput | null>(null);
  /** Accepts a flat `string[]` or a `Record<string, string[]>` (flattened internally). */
  readonly warnings = input<MessageInput | null>(null);
  /** Accepts a flat `string[]` or a `Record<string, string[]>` (flattened internally). */
  readonly info = input<MessageInput | null>(null);
  /** All validation rules for this form (used to show rules not yet triggered). */
  readonly validationRules = input<MessageInput | null>(null);
  /** Error validation rules for this form (optional grouped overview). */
  readonly validationErrorRules = input<MessageInput | null>(null);
  /** Warning validation rules for this form (optional grouped overview). */
  readonly validationWarningRules = input<MessageInput | null>(null);
  /** Field paths that have been validated (e.g., touched/blurred or submitted). */
  readonly validatedFields = input<readonly string[] | null>(null);

  readonly errorsTitle = input('Errors');
  readonly warningsTitle = input('Warnings');
  readonly infoTitle = input('Info');
  readonly validationRulesTitle = input(
    'Validation rules (remaining for untouched fields)'
  );
  readonly validationErrorRulesTitle = input('Error rules');
  readonly validationWarningRulesTitle = input('Warning rules');
  readonly resolvedTitle = input('Passing');

  // ── Internals: Record-form of current errors/warnings ──────────────

  readonly #errorsRecord = computed(() => {
    const explicit = this.errors();
    if (explicit !== null) {
      return this.#filterByValidatedFields(this.#toRecord(explicit));
    }
    return this.#filterByValidatedFields(this.resolvedFormState().errors);
  });

  readonly #warningsRecord = computed(() => {
    const raw = this.#toRecord(this.warnings());
    return this.#filterByValidatedFields(raw);
  });

  readonly #validationWarningRulesRecord = computed(() =>
    this.#toRecord(this.validationWarningRules())
  );

  readonly #validationErrorRulesRecord = computed(() => {
    const explicitErrorRules = this.validationErrorRules();
    if (explicitErrorRules !== null) {
      return this.#toRecord(explicitErrorRules);
    }

    const baseRules = this.#validationRulesRecord();
    const warningRules = this.#validationWarningRulesRecord();
    if (Object.keys(warningRules).length === 0) {
      return baseRules;
    }

    return this.#subtractRules(baseRules, warningRules);
  });

  readonly #effectiveValidationRulesRecord = computed(() =>
    this.#mergeRules(
      this.#validationRulesRecord(),
      this.#validationErrorRulesRecord(),
      this.#validationWarningRulesRecord()
    )
  );

  // ── Passing: validated fields without visible issues ───────────────

  protected readonly resolvedMessages = computed(() => {
    const validated = new Set(this.validatedFields() ?? []);
    if (validated.size === 0) {
      return [];
    }

    const rules = this.#effectiveValidationRulesRecord();
    const errors = this.#errorsRecord();
    const warnings = this.#warningsRecord();

    const passing = [...validated]
      .filter((field) => field !== '_flat' && (rules[field] ?? []).length > 0)
      .filter((field) => (errors[field] ?? []).length === 0)
      .filter((field) => (warnings[field] ?? []).length === 0)
      .map((field) => this.#formatFieldLabel(field));

    return this.#toUnique(passing);
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

  protected readonly unusedValidationErrorRules = computed(() =>
    this.#collectUnusedRules(this.#validationErrorRulesRecord())
  );

  protected readonly unusedValidationWarningRules = computed(() =>
    this.#collectUnusedRules(this.#validationWarningRulesRecord())
  );

  protected readonly unusedValidationRules = computed(() =>
    this.#toUnique([
      ...this.unusedValidationErrorRules(),
      ...this.unusedValidationWarningRules(),
    ])
  );

  protected readonly hasDisplayableValidationMessages = computed(
    () => this.uniqueErrors().length > 0 || this.uniqueWarnings().length > 0
  );

  protected readonly hasPrimaryValidationFeedback = computed(
    () =>
      this.resolvedMessages().length > 0 ||
      this.uniqueErrors().length > 0 ||
      this.uniqueWarnings().length > 0
  );

  protected readonly isPending = computed(() => this.pending());

  protected readonly isPristine = computed(() => {
    const validated = this.validatedFields();
    return (
      !this.isPending() &&
      Array.isArray(validated) &&
      validated.length === 0 &&
      !this.hasDisplayableValidationMessages()
    );
  });

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
   * Filters a record to only include entries for validated fields.
   * When `validatedFields` is not provided (null), returns the full record.
   * ROOT_FORM entries are shown only after at least one field has been validated.
   */
  #filterByValidatedFields(
    record: Record<string, string[]>
  ): Record<string, string[]> {
    const validatedFieldsList = this.validatedFields();
    if (validatedFieldsList === null || validatedFieldsList === undefined) {
      return record;
    }
    if (validatedFieldsList.length === 0) {
      // No fields validated yet — keep UI neutral.
      return {};
    }
    const validated = new Set(validatedFieldsList);
    const validatedArray = [...validated];
    const filtered: Record<string, string[]> = {};
    for (const [field, messages] of Object.entries(record)) {
      if (
        field === '_flat' ||
        field === ROOT_FORM ||
        validated.has(field) ||
        validatedArray.some(
          (validatedField) =>
            validatedField.startsWith(`${field}.`) ||
            field.startsWith(`${validatedField}.`)
        )
      ) {
        filtered[field] = messages;
      }
    }
    return filtered;
  }

  #validationRulesRecord(): Record<string, string[]> {
    return this.#toRecord(this.validationRules());
  }

  #collectUnusedRules(rules: Record<string, string[]>): string[] {
    const validated = new Set(this.validatedFields() ?? []);
    const messages = Object.entries(rules)
      .filter(([field]) => field === '_flat' || !validated.has(field))
      .flatMap(([field, fieldRules]) => {
        if (field === '_flat') {
          return fieldRules;
        }

        const fieldLabel = this.#formatFullFieldLabel(field);
        return fieldRules.map((rule) => `${fieldLabel}: ${rule}`);
      });

    return this.#toUnique(messages);
  }

  #subtractRules(
    baseRules: Record<string, string[]>,
    rulesToRemove: Record<string, string[]>
  ): Record<string, string[]> {
    const result: Record<string, string[]> = {};

    for (const [field, messages] of Object.entries(baseRules)) {
      const removeSet = new Set(rulesToRemove[field] ?? []);
      if (removeSet.size === 0) {
        result[field] = messages;
        continue;
      }

      const remaining = messages.filter((message) => !removeSet.has(message));
      if (remaining.length > 0) {
        result[field] = remaining;
      }
    }

    return result;
  }

  #mergeRules(
    ...records: Array<Record<string, string[]>>
  ): Record<string, string[]> {
    const merged: Record<string, string[]> = {};

    for (const record of records) {
      for (const [field, messages] of Object.entries(record)) {
        merged[field] = this.#toUnique([...(merged[field] ?? []), ...messages]);
      }
    }

    return merged;
  }

  #formatFieldLabel(path: string): string {
    const normalised = path.replace(/\[(\d+)\]/g, '.$1');
    const segments = normalised.split('.').filter(Boolean);
    const last = segments[segments.length - 1] ?? path;
    const withSpaces = last
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[-_]+/g, ' ')
      .trim();
    return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
  }

  #formatFullFieldLabel(path: string): string {
    const normalised = path.replace(/\[(\d+)\]/g, '.$1');
    const segments = normalised.split('.').filter(Boolean);
    if (segments.length === 0) return path;

    const humanized = segments.map((segment) =>
      segment
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[-_]+/g, ' ')
        .trim()
    );

    return humanized
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' → ');
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
