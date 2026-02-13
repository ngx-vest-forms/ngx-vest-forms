import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  linkedSignal,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  clearFields,
  createEmptyFormState,
  createValidationConfig,
  FormDirective,
  NgxVestForms,
  setValueAtPath,
} from 'ngx-vest-forms';
import { AddressModel } from '../../models/address.model';
import {
  initialPurchaseFormValue,
  PurchaseFormModel,
  purchaseFormShape,
} from '../../models/purchase-form.model';
import { AddressComponent } from '../../ui/address/address.component';
import { FormSectionComponent } from '../../ui/form-section/form-section.component';
import { PhoneNumbersComponent } from '../../ui/phonenumbers/phonenumbers.component';
import { mapWarningsToRecord } from '../../utils/form-warnings.util';
import { ProductService } from './product.service';
import { createPurchaseValidationSuite } from './purchase.validations';
import { SwapiService } from './swapi.service';

// API response type from json-server
type LukeApiResponse = {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
};

@Component({
  selector: 'ngx-purchase-form',
  imports: [
    NgxVestForms,
    AddressComponent,
    FormSectionComponent,
    PhoneNumbersComponent,
  ],
  templateUrl: './purchase.form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseForm {
  private readonly swapiService = inject(SwapiService);
  private readonly productService = inject(ProductService);
  readonly products = toSignal(this.productService.getAll());

  private readonly vestForm =
    viewChild<FormDirective<PurchaseFormModel>>('vestForm');

  private readonly shippingAddress = signal<AddressModel>({});

  protected readonly formValue = signal<PurchaseFormModel>(
    initialPurchaseFormValue
  );
  protected readonly shape = purchaseFormShape;
  protected readonly purchaseValidationSuite = createPurchaseValidationSuite(
    this.swapiService
  );

  readonly formValueChange = output<PurchaseFormModel>();
  readonly saveRequested = output<PurchaseFormModel>();

  /**
   * Errors updated via the directive's (errorsChange) event binding.
   * The event fires on *every* StatusChangeEvent, making it more reactive
   * than formState.errors when the form's overall status stays the same.
   */
  protected readonly currentErrors = signal<Record<string, string[]>>({});

  /** Exposes the directive's packaged form state with up-to-date errors. */
  readonly formState = computed(() => {
    const state = this.vestForm()?.formState();
    if (!state) return createEmptyFormState<PurchaseFormModel>();
    return { ...state, errors: this.currentErrors() };
  });

  /** Exposes field warnings as a plain Record for presentational components. */
  readonly warnings = computed(() =>
    mapWarningsToRecord(this.vestForm()?.fieldWarnings() ?? new Map())
  );

  /**
   * Reactive fetch trigger derived from firstName.
   * Automatically becomes `true` when firstName is "Luke".
   * Writable so the "Fetch Data" button can trigger a manual fetch.
   * Resets when firstName changes away from "Luke".
   */
  private readonly fetchLukeRequested = linkedSignal({
    source: () => this.formValue().firstName,
    computation: (firstName) => firstName === 'Luke',
  });

  private readonly lukeResource = httpResource<LukeApiResponse>(() => {
    if (!this.fetchLukeRequested()) {
      return undefined;
    }
    return 'http://localhost:3000/people/1';
  });

  private readonly lukeData = computed(() => {
    const data = this.lukeResource.value();
    if (!data) return undefined;
    const nameParts = data.name.split(' ');
    return {
      userId: data.id,
      firstName: nameParts[0],
      lastName: nameParts[1],
      gender: data.gender,
    };
  });

  protected readonly fetchedDataDisabled = computed(
    () => this.lukeResource.value() !== undefined
  );

  protected readonly loading = computed(
    () => this.lukeResource.status() === 'loading'
  );

  protected readonly emergencyContactDisabled = computed(
    () => (this.formValue().age || 0) >= 18
  );

  protected readonly showShippingAddress = computed(
    () =>
      !!this.formValue().addresses?.shippingAddressDifferentFromBillingAddress
  );

  protected readonly showGenderOther = computed(
    () => this.formValue().gender === 'other'
  );

  protected readonly showJustification = computed(
    () => (this.formValue().quantity || 0) > 5
  );

  protected readonly currentShippingAddress = computed(
    () => this.formValue().addresses?.shippingAddress || this.shippingAddress()
  );

  protected readonly validationConfig = computed(() => {
    const builder = createValidationConfig<PurchaseFormModel>()
      .bidirectional('passwords.password', 'passwords.confirmPassword')
      .bidirectional('age', 'emergencyContact');

    if (this.formValue().gender === 'other') {
      builder.whenChanged('gender', 'genderOther');
    }

    if ((this.formValue().quantity || 0) > 5) {
      builder.bidirectional('quantity', 'justification');
    }

    return builder.build();
  });

  constructor() {
    const firstName = computed(() => this.formValue().firstName);
    const lastName = computed(() => this.formValue().lastName);

    // Auto-fill when first name is "Brecht".
    // Reads are tracked (firstName, lastName); writes use untracked to avoid
    // a circular dependency on formValue which would cause an infinite loop.
    effect(() => {
      const fn = firstName();
      const ln = lastName();

      untracked(() => {
        if (fn === 'Brecht') {
          this.updateFormValue((val) => ({ ...val, gender: 'male' }));
        }

        if (fn === 'Brecht' && ln === 'Billiet') {
          this.updateFormValue((val) => {
            let didUpdate = false;
            const next = { ...val };

            if (next.age === undefined || next.age === null) {
              next.age = 35;
              didUpdate = true;
            }

            const hasPassword = !!next.passwords?.password;
            const hasConfirmPassword = !!next.passwords?.confirmPassword;
            if (!hasPassword && !hasConfirmPassword) {
              next.passwords = {
                password: 'Test1234',
                confirmPassword: 'Test12345',
              };
              didUpdate = true;
            }

            return didUpdate ? next : val;
          });
        }
      });
    });

    // Apply fetched Luke data to form.
    // Only tracks lukeData(); writes use untracked to avoid a circular
    // dependency on formValue (which would re-trigger this effect endlessly).
    effect(() => {
      const luke = this.lukeData();
      if (luke) {
        untracked(() => {
          this.updateFormValue((v) => ({ ...v, ...luke }));
        });
      }
    });
  }

  fetchData(): void {
    this.fetchLukeRequested.set(true);
  }

  clearSensitiveData(): void {
    this.fetchLukeRequested.set(false);
    this.updateFormValue((v) =>
      clearFields(v, [
        'passwords',
        'emergencyContact',
        'userId',
        'firstName',
        'lastName',
        'gender',
      ])
    );
  }

  prefillBillingAddress(): void {
    this.updateFormValue((v) => {
      const updated = structuredClone(v);
      setValueAtPath(updated, 'addresses.billingAddress.street', '123 Main St');
      setValueAtPath(updated, 'addresses.billingAddress.number', '42A');
      setValueAtPath(updated, 'addresses.billingAddress.city', 'New York');
      setValueAtPath(updated, 'addresses.billingAddress.zipcode', '10001');
      setValueAtPath(updated, 'addresses.billingAddress.country', 'USA');
      return updated;
    });
  }

  protected onFormValueChange(value: PurchaseFormModel): void {
    this.formValue.set(value);
    if (value.addresses?.shippingAddress) {
      this.shippingAddress.set(value.addresses.shippingAddress);
    }
    this.formValueChange.emit(value);
  }

  protected onPhoneNumbersChange(values: Record<string, string>): void {
    this.updateFormValue((v) => ({
      ...v,
      phonenumbers: {
        ...v.phonenumbers,
        values,
      },
    }));
  }

  protected onSubmit(): void {
    this.saveRequested.emit(this.formValue());
  }

  protected onReset(): void {
    this.formValue.set(initialPurchaseFormValue);
    this.shippingAddress.set({});
    // resetForm() handles everything: clears controls, fieldWarnings, triggers
    // re-validation, which causes formValueChange to emit.
    this.vestForm()?.resetForm(initialPurchaseFormValue);
  }

  private updateFormValue(
    updater: (current: PurchaseFormModel) => PurchaseFormModel
  ): void {
    const next = updater(this.formValue());
    if (next === this.formValue()) {
      return;
    }
    this.formValue.set(next);
    if (next.addresses?.shippingAddress) {
      this.shippingAddress.set(next.addresses.shippingAddress);
    }
    this.formValueChange.emit(next);
  }
}
