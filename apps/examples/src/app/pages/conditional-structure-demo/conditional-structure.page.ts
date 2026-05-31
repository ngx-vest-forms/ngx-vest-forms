import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { clearFieldsWhen, keepFieldsWhen } from 'ngx-vest-forms';
import {
  ConditionalStructureModel,
  DeliveryMode,
  initialConditionalStructureValue,
} from '../../models/conditional-structure.model';
import { AlertPanel } from '../../ui/alert-panel/alert-panel.component';
import { Card } from '../../ui/card/card.component';
import { ExampleCardsComponent } from '../../ui/example-cards/example-cards.component';
import { FormPageLayout } from '../../ui/form-page-layout/form-page-layout.component';
import { FormStateCardComponent } from '../../ui/form-state/form-state.component';
import { JsonPreviewComponent } from '../../ui/json-preview/json-preview.component';
import { PageTitle } from '../../ui/page-title/page-title.component';
import { conditionalStructureContent } from './conditional-structure.content';
import { ConditionalStructureFormBody } from './conditional-structure.form';
import { conditionalStructureSuite } from './conditional-structure.validations';

@Component({
  selector: 'ngx-conditional-structure-page',
  imports: [
    PageTitle,
    Card,
    AlertPanel,
    ExampleCardsComponent,
    FormPageLayout,
    FormStateCardComponent,
    JsonPreviewComponent,
    ConditionalStructureFormBody,
  ],
  templateUrl: './conditional-structure.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditionalStructurePageComponent {
  protected readonly exampleContent = conditionalStructureContent;
  protected readonly suite = conditionalStructureSuite;
  protected readonly formValue = signal<ConditionalStructureModel>(
    initialConditionalStructureValue
  );
  protected readonly submittedPayload =
    signal<ConditionalStructureModel | null>(null);

  private readonly formBody = viewChild(ConditionalStructureFormBody);

  protected readonly feedback = computed(() => this.formBody()?.feedback);
  protected readonly payloadPreview = computed(() => {
    const deliveryMode = this.formValue().deliveryMode ?? 'pickup';

    return keepFieldsWhen(this.formValue(), {
      contactName: true,
      deliveryMode: true,
      shippingAddress: deliveryMode === 'shipment',
      deliveryEmail: deliveryMode === 'digital',
    });
  });

  protected onFormValueChange(value: ConditionalStructureModel): void {
    const previousDeliveryMode = this.formValue().deliveryMode ?? 'pickup';
    const nextDeliveryMode = this.asDeliveryMode(
      value.deliveryMode ?? 'pickup'
    );
    const nextValue = {
      ...value,
      deliveryMode: nextDeliveryMode,
    };

    // Accept the ngxVestForm snapshot first. Derived clearing happens in the
    // next turn so the form and model don't become divergent same-tick writers.
    this.formValue.set(nextValue);

    if (previousDeliveryMode !== nextDeliveryMode) {
      this.submittedPayload.set(null);
      setTimeout(() => {
        this.formValue.set(
          clearFieldsWhen(this.formValue(), {
            shippingAddress: this.formValue().deliveryMode !== 'shipment',
            deliveryEmail: this.formValue().deliveryMode !== 'digital',
          })
        );
        this.formBody()?.triggerValidation();
      }, 0);
    }
  }

  protected onSubmit(): void {
    if (!this.feedback()?.formState()?.valid) {
      this.submittedPayload.set(null);
      this.formBody()?.focusFirstInvalidControl();
      return;
    }

    this.submittedPayload.set(structuredClone(this.payloadPreview()));
  }

  protected reset(): void {
    this.submittedPayload.set(null);
    this.formBody()?.resetFormState(initialConditionalStructureValue);
    this.formValue.set(initialConditionalStructureValue);
  }

  private asDeliveryMode(value: string): DeliveryMode {
    return value === 'shipment' || value === 'digital' ? value : 'pickup';
  }
}
