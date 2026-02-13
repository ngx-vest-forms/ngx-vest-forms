import {
  ChangeDetectionStrategy,
  Component,
  computed,
  viewChild,
} from '@angular/core';
import { ROOT_FORM } from 'ngx-vest-forms';
import { PurchaseFormModel } from '../../models/purchase-form.model';
import { AlertPanel } from '../../ui/alert-panel/alert-panel.component';
import { Card } from '../../ui/card/card.component';
import { FormStateCardComponent } from '../../ui/form-state/form-state.component';
import { PageTitle } from '../../ui/page-title/page-title.component';
import { PurchaseForm } from './purchase.form';

@Component({
  selector: 'ngx-purchase-page',
  imports: [Card, PageTitle, AlertPanel, FormStateCardComponent, PurchaseForm],
  templateUrl: './purchase.page.html',
  styleUrls: ['./purchase.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchasePageComponent {
  private readonly purchaseForm = viewChild(PurchaseForm);

  protected readonly ROOT_FORM = ROOT_FORM;
  protected readonly rootFormErrors = computed(
    () => this.purchaseForm()?.formState()?.errors[ROOT_FORM] || []
  );

  protected fetchData(): void {
    this.purchaseForm()?.fetchData();
  }

  protected clearSensitiveData(): void {
    this.purchaseForm()?.clearSensitiveData();
  }

  protected prefillBillingAddress(): void {
    this.purchaseForm()?.prefillBillingAddress();
  }

  protected save(_value: PurchaseFormModel): void {
    // Intentionally no console output in examples to keep CI and demos quiet
  }
}
