import {
  computed,
  Directive,
  effect,
  inject,
  input,
  isDevMode,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import {
  getAllFormErrors,
  NGX_SCHEMA_STATE,
  NgxFormCoreDirective,
} from 'ngx-vest-forms/core';
import { catchError, EMPTY, map, merge, Observable, retry, tap } from 'rxjs';
import { NgxSchemaValidationDirective } from './schema-validation.directive';

/**
 * Convenience directive that composes core + schema validation on a single form.
 *
 * Usage:
 *  - Import NgxVestFormWithSchemaDirective in your component
 *  - Use <form ngxVestFormWithSchema [vestSuite]="..." [formSchema]="..." [(formValue)]="..."> ... </form>
 *
 * Notes:
 *  - This avoids having to import both directives separately.
 *  - If you already use ngxVestForm/ngxVestFormCore and attach [formSchema], prefer importing
 *    NgxSchemaValidationDirective directly. Do NOT apply both this wrapper and ngxVestForm on the same form.
 */
@Directive({
  selector: 'form[ngxVestFormWithSchema]',
  // Export under the same name as the full directive for drop-in compatibility
  exportAs: 'ngxVestForm',
  hostDirectives: [
    {
      directive: NgxFormCoreDirective,
      inputs: ['formValue', 'vestSuite', 'validationOptions'],
      outputs: ['formValueChange'],
    },
    {
      directive: NgxSchemaValidationDirective,
      inputs: ['formSchema'],
    },
  ],
})
export class NgxVestFormWithSchemaDirective {
  // Host services
  readonly #core = inject(NgxFormCoreDirective, { host: true });
  readonly #ngForm = inject(NgForm, { host: true });
  // Optional schema state provided by NgxSchemaValidationDirective
  readonly #schemaState = inject(NGX_SCHEMA_STATE, { optional: true });

  // Optional dependent field validation config to match full directive API
  readonly validationConfig = input<Record<string, string[]> | null>(null);

  // Internal: wire dependency streams when config present (simplified version)
  #setupValidationDepStreams(): void {
    effect(() => {
      const config = this.validationConfig();
      if (!config) return;
      const streams: (Observable<unknown> | null)[] = Object.keys(config)
        .map((key) => {
          const control = this.#ngForm.form.get(key);
          if (!control) {
            if (isDevMode()) {
              console.warn(
                `[ngx-vest-forms][schemas] Control '${key}' not found for validationConfig.`,
              );
            }
            return null;
          }
          return control.valueChanges.pipe(
            tap(() => {
              for (const dep of config[key] || []) {
                const c = this.#ngForm.form.get(dep);
                c?.updateValueAndValidity({ onlySelf: true, emitEvent: true });
              }
            }),
            map(() => control.value),
          );
        })
        .filter((s): s is Observable<unknown> => s !== null);
      if (streams.length === 0) return;
      const nonNullStreams = streams as Observable<unknown>[];
      merge(...nonNullStreams)
        .pipe(
          retry(2),
          catchError((error) => {
            if (isDevMode()) {
              console.error(
                '[ngx-vest-forms][schemas] validationConfig stream error',
                error,
              );
            }
            // swallow errors
            return EMPTY;
          }),
        )
        .subscribe();
    });
  }

  constructor() {
    this.#setupValidationDepStreams();
  }

  // Expose enriched form state similar to full directive
  readonly formState = computed(() => {
    const base = this.#core.formState();
    const status = this.#ngForm.form.status as
      | 'VALID'
      | 'INVALID'
      | 'PENDING'
      | 'DISABLED';
    const isPending = status === 'PENDING';
    const isDisabled = status === 'DISABLED';
    const isIdle = !isPending && !isDisabled;
    const fieldErrors: Partial<Record<string, string[]>> = getAllFormErrors(
      this.#ngForm.form,
    );

    // firstInvalidField from field errors only
    let firstInvalidField: string | null = null;
    for (const key of Object.keys(fieldErrors)) {
      if ((fieldErrors[key] || []).length > 0) {
        firstInvalidField = key;
        break;
      }
    }

    const schema = this.#schemaState?.() ?? null;
    return {
      value: base.value,
      errors: fieldErrors,
      warnings: {},
      status,
      dirty: base.dirty,
      valid: base.valid,
      invalid: !base.valid,
      pending: isPending,
      disabled: isDisabled,
      idle: isIdle,
      submitted: base.submitted,
      schema: schema,
      errorCount: Object.values(fieldErrors).reduce(
        (a, b) => a + (b?.length ?? 0),
        0,
      ),
      warningCount: 0,
      firstInvalidField,
    } as const;
  });
}
