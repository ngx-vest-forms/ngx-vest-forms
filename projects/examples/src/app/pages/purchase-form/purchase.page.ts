import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { ROOT_FORM } from 'ngx-vest-forms';
import { PurchaseFormModel } from '../../models/purchase-form.model';
import { AlertPanel } from '../../ui/alert-panel/alert-panel.component';
import { Card } from '../../ui/card/card.component';
import { FormStateCardComponent } from '../../ui/form-state/form-state.component';
import { PageTitle } from '../../ui/page-title/page-title.component';
import { FetchErrorScenario, PurchaseForm } from './purchase.form';
import {
  purchaseValidationErrorRulesByField,
  purchaseValidationWarningRulesByField,
} from './purchase.validations';

type FetchLukeMode = 'normal' | FetchErrorScenario;

@Component({
  selector: 'ngx-purchase-page',
  imports: [Card, PageTitle, AlertPanel, FormStateCardComponent, PurchaseForm],
  templateUrl: './purchase.page.html',
  styleUrls: ['./purchase.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchasePageComponent {
  private readonly purchaseForm = viewChild(PurchaseForm);

  protected readonly fetchLukeModes: Array<{
    label: string;
    value: FetchLukeMode;
  }> = [
    { label: 'Successful response', value: 'normal' },
    { label: 'Random failure', value: 'random' },
    { label: 'Not found (404)', value: 'not-found' },
    { label: 'Unauthorized (401)', value: 'unauthorized' },
    { label: 'Server error (500)', value: 'server-error' },
    { label: 'Network error', value: 'network-error' },
  ];

  protected readonly defaultFetchLukeMode = 'normal' satisfies FetchLukeMode;
  protected readonly fetchLukeMode = signal<FetchLukeMode>(
    this.defaultFetchLukeMode
  );
  protected readonly fetchLukeButtonClass = computed(() =>
    this.fetchLukeMode() === 'normal'
      ? 'btn btn-primary w-full'
      : 'btn btn-danger w-full'
  );

  protected readonly ROOT_FORM = ROOT_FORM;
  protected readonly validationErrorRules = purchaseValidationErrorRulesByField;
  protected readonly validationWarningRules =
    purchaseValidationWarningRulesByField;
  protected readonly rootFormErrors = computed(
    () => this.purchaseForm()?.formState()?.errors[ROOT_FORM] || []
  );

  protected fetchLuke(mode: string): void {
    if (mode === 'normal') {
      this.purchaseForm()?.fetchData();
      return;
    }

    this.purchaseForm()?.fetchDataWithFailure(
      this.isFetchErrorScenario(mode) ? mode : 'not-found'
    );
  }

  protected clearSensitiveData(): void {
    this.purchaseForm()?.clearSensitiveData();
  }

  protected onFetchLukeModeChange(mode: string): void {
    this.fetchLukeMode.set(this.isFetchLukeMode(mode) ? mode : 'normal');
  }

  protected prefillBillingAddress(): void {
    this.purchaseForm()?.prefillBillingAddress();
  }

  protected save(_value: PurchaseFormModel): void {
    // Intentionally no console output in examples to keep CI and demos quiet
  }

  private isFetchErrorScenario(value: string): value is FetchErrorScenario {
    return this.fetchLukeModes.some(
      (scenario) => scenario.value === value && scenario.value !== 'normal'
    );
  }

  private isFetchLukeMode(value: string): value is FetchLukeMode {
    return this.fetchLukeModes.some((mode) => mode.value === value);
  }
}
