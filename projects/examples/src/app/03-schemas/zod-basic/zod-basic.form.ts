/**
 * Zod Basic Schema Integration Form Component
 *
 * Demonstrates two-layer validation:
 * 1. Zod schema (type/structure validation)
 * 2. Vest.js suite (business logic validation)
 */

import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { NgxVestForms } from 'ngx-vest-forms';
import { createVestForm, type ErrorDisplayStrategy } from 'ngx-vest-forms/core';
import { asDebuggerForm } from '../../ui/debugger/debugger';
import {
  createInitialUserRegistration,
  userRegistrationSchema,
  userRegistrationSuite,
  type UserRegistrationModel,
} from './zod-basic.validations';

@Component({
  selector: 'ngx-zod-basic-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxVestForms],
  templateUrl: './zod-basic.html',
})
export class ZodBasicFormComponent implements OnDestroy {
  private readonly router = inject(Router);

  // Dynamic error display mode from parent (example controls)
  readonly errorDisplayMode = input<ErrorDisplayStrategy>('on-touch');

  /**
   * Form with TWO-LAYER validation
   *
   * New createVestForm signature (v2.0):
   * createVestForm(model, { suite, ...options })
   *
   * Layer 1: Zod schema validates types/structure (runs first)
   * Layer 2: Vest suite validates business logic (runs after schema passes)
   *
   * ✨ Initial values come from Zod schema's .default() - single source of truth!
   *
   * 💡 New Schema Utilities (ngx-vest-forms/schemas):
   *
   * **Vendor Detection:**
   * - Simple: userRegistrationSchema['~standard'].vendor // 'zod'
   * - Type-safe: import { isZodSchema } from 'ngx-vest-forms/schemas'
   *
   * **Type Inference:**
   * - Universal: import type { InferOutput } from 'ngx-vest-forms/schemas'
   * - Works with any StandardSchemaV1 schema (Zod, Valibot, ArkType)
   *
   * **Standalone Validation** (for non-form use cases):
   * - import { validateStandardSchema } from 'ngx-vest-forms/schemas'
   * - const result = await validateStandardSchema(schema, data)
   *
   * See debugger panel on the right for live vendor detection →
   */
  readonly form = createVestForm(
    signal<UserRegistrationModel>(createInitialUserRegistration()),
    {
      suite: userRegistrationSuite,
      schema: userRegistrationSchema, // ✅ Layer 1: Zod schema
      errorStrategy: this.errorDisplayMode, // ✅ Reactive strategy from parent
      enhancedFieldSignals: true, // ✅ Enable camelCase field accessors
    },
  );

  /**
   * State management
   */
  protected readonly isSubmitting = signal(false);
  protected readonly submitError = signal<string | null>(null);

  /**
   * Debugger form (for debugger panel)
   */
  protected readonly debugForm = asDebuggerForm(this.form);

  readonly formState = () => this.form;
  readonly debugFormState = () => this.debugForm;

  /**
   * Submit handler
   */
  async save(event: Event): Promise<void> {
    event.preventDefault();
    this.isSubmitting.set(true);
    this.submitError.set(null);

    try {
      const result = await this.form.submit();

      if (result.valid) {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log('✅ Registration successful:', result.data);

        // Navigate to success page (or show success message)
        await this.router.navigate(['/']);
      } else {
        console.log('❌ Validation failed:', result.errors);
        this.submitError.set('Please fix the errors above');
      }
    } catch (error) {
      console.error('Submit error:', error);
      this.submitError.set('An unexpected error occurred');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  /**
   * Reset form to initial state
   */
  reset(): void {
    this.form.reset();
    this.submitError.set(null);
  }

  /**
   * Cleanup
   */
  ngOnDestroy(): void {
    this.form.dispose();
  }
}
