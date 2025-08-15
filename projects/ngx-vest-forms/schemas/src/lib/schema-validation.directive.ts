import {
  Directive,
  computed,
  effect,
  inject,
  input,
  isDevMode,
  signal,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgxFormCoreDirective } from 'ngx-vest-forms/core';
import { toAnyRuntimeSchema } from './runtime-adapters';
import type { NgxRuntimeSchema } from './runtime-schema';
import {
  ngxExtractTemplateFromSchema,
  type SchemaDefinition,
} from './schema-adapter';

export type SchemaValidationState = {
  hasRun: boolean;
  success: boolean | null;
  issues: readonly { path?: string; message: string }[];
  errorMap: Readonly<Record<string, readonly string[]>>;
};

/**
 * Adds optional schema validation to a core ngxVestForm form.
 * - Validates on ngSubmit only (single pass per submit)
 * - Keeps state separate from Vest field errors under `schema`
 * - Also performs dev-time template conformance checks when using
 *   `ngxModelToStandardSchema` (via `_shape` extraction). This check is
 *   lightweight: it only verifies that no extra keys exist in the form value
 *   that aren't present in the extracted template. It does not enforce full
 *   type validation which should be handled by the schema itself.
 */
@Directive({
  selector: 'form[ngxVestForm][formSchema], form[ngxVestFormCore][formSchema]',
  exportAs: 'ngxSchemaValidation',
})
export class NgxSchemaValidationDirective {
  // Host directives / services
  readonly #core = inject(NgxFormCoreDirective, { host: true });
  readonly #ngForm = inject(NgForm);

  // Inputs
  readonly formSchema = input<
    SchemaDefinition | NgxRuntimeSchema<unknown> | null
  >(null);

  // Internal state
  readonly #schemaState = signal<SchemaValidationState | null>(null);

  // Dev-only: validate that form value shape conforms to template extracted from schema
  // This guards against typos in name/ngModelGroup during development.
  // eslint-disable-next-line no-unused-private-class-members
  readonly #templateConformance = effect(() => {
    const schema = this.formSchema();
    if (!schema) return;
    const template = ngxExtractTemplateFromSchema(schema as SchemaDefinition);
    const value = this.#core.formState().value;
    if (!template || !value) return;
    if (!isDevMode()) return;
    try {
      // Shallow conformance check: extra keys in value not present in template
      const check = (
        value_: unknown,
        template_: unknown,
        path = '',
      ): string[] => {
        if (
          !value_ ||
          typeof value_ !== 'object' ||
          !template_ ||
          typeof template_ !== 'object'
        )
          return [];
        const errors: string[] = [];
        for (const key of Object.keys(value_ as Record<string, unknown>)) {
          if (Object.prototype.hasOwnProperty.call(template_ as object, key)) {
            errors.push(
              ...check(
                (value_ as Record<string, unknown>)[key],
                (template_ as Record<string, unknown>)[key],
                path ? `${path}.${key}` : key,
              ),
            );
          } else {
            const full = path ? `${path}.${key}` : key;
            const isGroup =
              typeof (value_ as Record<string, unknown>)[key] === 'object' &&
              (value_ as Record<string, unknown>)[key] !== null;
            errors.push(
              isGroup
                ? `[ngModelGroup] Mismatch: '${full}'`
                : `[ngModel] Mismatch '${full}'`,
            );
          }
        }
        return errors;
      };
      const errs = check(value as object, template as object);
      if (errs.length > 0) {
        console.warn('[ngx-vest-forms][schemas] Template mismatch', errs);
      }
    } catch {
      // Non-fatal; template conformance is a dev aid only.
    }
  });

  // Public API for consumers to read schema validation state
  readonly schema = computed<SchemaValidationState | null>(() => {
    const state = this.#schemaState();
    if (state) return state;
    if (this.formSchema()) {
      return { hasRun: false, success: null, issues: [], errorMap: {} };
    }
    return null;
  });

  constructor() {
    // Run schema validation on submit
    this.#ngForm.ngSubmit.subscribe(() => {
      const candidate = this.formSchema();
      if (!candidate) return;
      try {
        const runtime = toAnyRuntimeSchema(candidate);
        const currentModel = this.#core.formState().value;
        const result = runtime.safeParse(currentModel);
        if (result.success === false) {
          const issues = result.issues.map((issue) => ({
            path: issue.path,
            message: issue.message,
          }));
          const errorMap: Record<string, readonly string[]> = {};
          for (const issue of issues) {
            const key = issue.path || '_root';
            errorMap[key] = [...(errorMap[key] || []), issue.message];
          }
          this.#schemaState.set({
            hasRun: true,
            success: false,
            issues,
            errorMap,
          });
          if (isDevMode()) {
            console.warn('[ngx-vest-forms][schemas] schema validation failed', {
              issues,
            });
          }
        } else {
          this.#schemaState.set({
            hasRun: true,
            success: true,
            issues: [],
            errorMap: {},
          });
        }
      } catch (error) {
        if (isDevMode()) {
          console.error('[ngx-vest-forms][schemas] schema error', error);
        }
        this.#schemaState.set({
          hasRun: true,
          success: false,
          issues: [{ message: 'Schema validation error' }],
          errorMap: { _root: ['Schema validation error'] },
        });
      } finally {
        // ensure status/errors recompute
        this.#ngForm.form.updateValueAndValidity({ emitEvent: true });
      }
    });
  }
}
