import {
  Component,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { objectToArray } from 'ngx-vest-forms';
import {
  ComplexNestedModel,
  initialComplexNestedValue,
} from '../../models/complex-nested.model';
import { Card } from '../../ui/card/card.component';
import { ExampleCardsComponent } from '../../ui/example-cards/example-cards.component';
import { FormPageLayout } from '../../ui/form-page-layout/form-page-layout.component';
import { FormStateCardComponent } from '../../ui/form-state/form-state.component';
import { JsonPreviewComponent } from '../../ui/json-preview/json-preview.component';
import { PageTitle } from '../../ui/page-title/page-title.component';
import { complexNestedContent } from './complex-nested.content';
import { ComplexNestedFormBody } from './complex-nested.form';
import { complexNestedSuite } from './complex-nested.validations';

/**
 * Team-registration demo: deep ngModelGroup nesting plus a dynamic,
 * repeatable id-keyed collection, composed from reusable child components.
 *
 * The page owns the `formValue` signal (single source of truth) and the
 * add/remove handlers; the form-body component renders the form tree and
 * exposes packaged form state.
 */
@Component({
  selector: 'ngx-complex-nested-page',
  imports: [
    PageTitle,
    Card,
    FormPageLayout,
    FormStateCardComponent,
    ExampleCardsComponent,
    JsonPreviewComponent,
    ComplexNestedFormBody,
  ],
  templateUrl: './complex-nested.page.html',
})
export class ComplexNestedPageComponent {
  protected readonly feedback = computed(() => this.formBody()?.feedback);
  protected readonly exampleContent = complexNestedContent;
  protected readonly suite = complexNestedSuite;

  /** The form value is the single source of truth, owned by the page. */
  protected readonly formValue = signal<ComplexNestedModel>(
    initialComplexNestedValue
  );
  protected readonly submittedValue = signal<ComplexNestedModel | null>(null);

  /**
   * The submitted payload with `teamMembers` converted from a numeric-keyed
   * record back to a real array via `objectToArray` — the shape you'd send
   * to a backend (same round-trip the purchase form uses).
   */
  protected readonly submittedPayload = signal<unknown | null>(null);

  private readonly formBody = viewChild(ComplexNestedFormBody);

  protected onFormValueChange(value: ComplexNestedModel): void {
    this.formValue.set(value);
  }

  protected onSubmit(): void {
    if (!this.feedback()?.formState()?.valid) {
      this.submittedValue.set(null);
      this.submittedPayload.set(null);
      return;
    }
    const value = structuredClone(this.formValue());
    this.submittedValue.set(value);
    this.submittedPayload.set(objectToArray(value, ['teamMembers']));
  }

  protected onReset(): void {
    this.submittedValue.set(null);
    this.submittedPayload.set(null);
    this.formValue.set(initialComplexNestedValue);
    this.formBody()?.resetFormState(initialComplexNestedValue);
  }
}
