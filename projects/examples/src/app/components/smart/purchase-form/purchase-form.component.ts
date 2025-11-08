import {
  vestForms,
  clearFields,
  setValueAtPath,
  ValidationConfigMap,
  NgxVestSuite,
  ROOT_FORM,
} from 'ngx-vest-forms';
import {
  Component,
  computed,
  effect,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { JsonPipe } from '@angular/common';
import { AddressComponent } from '../../ui/address/address.component';
import { PhonenumbersComponent } from '../../ui/phonenumbers/phonenumbers.component';
import { LukeService } from '../../../luke.service';
import { SwapiService } from '../../../swapi.service';
import { ProductService } from '../../../product.service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  PurchaseFormModel,
  purchaseFormShape,
} from '../../../models/purchase-form.model';
import { createPurchaseValidationSuite } from '../../../validations/purchase.validations';
import { AddressModel } from '../../../models/address.model';
import { debounceTime, filter, switchMap } from 'rxjs';

@Component({
  selector: 'sc-purchase-form',
  imports: [JsonPipe, vestForms, AddressComponent, PhonenumbersComponent],
  templateUrl: './purchase-form.component.html',
  styleUrls: ['./purchase-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseFormComponent {
  private readonly lukeService = inject(LukeService);
  private readonly swapiService = inject(SwapiService);
  private readonly productService = inject(ProductService);
  public readonly products = toSignal(this.productService.getAll());
  protected readonly formValue = signal<PurchaseFormModel>({});
  protected readonly formValid = signal<boolean>(false);
  protected readonly loading = signal<boolean>(false);
  protected readonly errors = signal<Record<string, string[]>>({});
  protected readonly purchaseValidationSuite: NgxVestSuite<PurchaseFormModel> =
    createPurchaseValidationSuite(this.swapiService);
  private readonly shippingAddress = signal<AddressModel>({});
  protected readonly shape = purchaseFormShape;
  private readonly viewModel = computed(() => {
    return {
      formValue: this.formValue(),
      errors: this.errors(),
      formValid: this.formValid(),
      emergencyContactDisabled: (this.formValue().age || 0) >= 18,
      showShippingAddress:
        this.formValue().addresses?.shippingAddressDifferentFromBillingAddress,
      showGenderOther: this.formValue().gender === 'other',
      showJustification: (this.formValue().quantity || 0) > 5,
      // Take shipping address from the state
      shippingAddress:
        this.formValue().addresses?.shippingAddress || this.shippingAddress(),
      loading: this.loading(),
    };
  });

  // Computed validationConfig that only references controls that exist in the DOM
  // This prevents "control not found" warnings for conditionally rendered fields
  protected readonly validationConfig = computed<
    ValidationConfigMap<PurchaseFormModel>
  >(() => {
    const config: ValidationConfigMap<PurchaseFormModel> = {
      quantity: ['justification'],
      justification: ['quantity'],
      age: ['emergencyContact'],
      'passwords.password': ['passwords.confirmPassword'],
      'passwords.confirmPassword': ['passwords.password'],
    };

    // Conditionally add genderOther validation when gender is 'other'
    if (this.formValue().gender === 'other') {
      config['gender'] = ['genderOther'];
    }

    // Conditionally add justification when quantity > 5
    if ((this.formValue().quantity || 0) > 5) {
      config['quantity'] = ['justification'];
      config['justification'] = ['quantity'];
    }

    return config;
  });

  // Expose ROOT_FORM constant for template
  protected readonly ROOT_FORM = ROOT_FORM;

  constructor() {
    const firstName = computed(() => this.formValue().firstName);
    const lastName = computed(() => this.formValue().lastName);
    effect(
      () => {
        // If the first name is Brecht, update the gender to male
        if (firstName() === 'Brecht') {
          this.formValue.update((val) => ({
            ...val,
            gender: 'male',
          }));
        }

        // If the first name is Brecht and the last name is Billiet, set the age and passwords
        if (firstName() === 'Brecht' && lastName() === 'Billiet') {
          this.formValue.update((val) => ({
            ...val,
            age: 35,
            passwords: {
              password: 'Test1234',
              confirmPassword: 'Test12345',
            },
          }));
        }
      }
      // Note: allowSignalWrites is deprecated and no longer needed
      // Writes are always allowed in effects in modern Angular
    );

    // When firstName is Luke, fetch luke skywalker and update the form value
    toObservable(firstName)
      .pipe(
        debounceTime(1000),
        filter((v) => v === 'Luke'),
        switchMap(() => this.lukeService.getLuke())
      )
      .subscribe((luke) => {
        this.formValue.update((v) => ({ ...v, ...luke }));
      });
  }

  protected setFormValue(v: PurchaseFormModel): void {
    this.formValue.set(v);

    // Keep shipping address in the state
    if (v.addresses?.shippingAddress) {
      this.shippingAddress.set(v.addresses.shippingAddress);
    }
  }

  protected get vm() {
    return this.viewModel();
  }

  protected onSubmit(): void {
    if (this.formValid()) {
      console.log(this.formValue());
    }
  }

  protected fetchData() {
    this.loading.set(true);
    this.lukeService.getLuke().subscribe((luke) => {
      this.formValue.update((v) => ({ ...v, ...luke }));
      this.loading.set(false);
    });
  }

  protected reset(): void {
    // Reset form data to empty state
    this.formValue.set({});

    // Reset form validation state
    this.formValid.set(false);
    this.errors.set({});

    // Reset shipping address state
    this.shippingAddress.set({});

    // Force change detection to properly clear all fields
    setTimeout(() => {
      this.formValue.set({});
    }, 0);
  }

  /**
   * Example: Clear sensitive fields while keeping basic info
   * Showcases the clearFields utility from ngx-vest-forms
   */
  protected clearSensitiveData(): void {
    this.formValue.update((v) =>
      clearFields(v, ['passwords', 'emergencyContact', 'userId'])
    );
  }

  /**
   * Example: Programmatically set nested values
   * Showcases the setValueAtPath utility from ngx-vest-forms
   */
  protected prefillBillingAddress(): void {
    this.formValue.update((v) => {
      const updated = structuredClone(v); // Clone to avoid mutation
      setValueAtPath(updated, 'addresses.billingAddress.street', '123 Main St');
      setValueAtPath(updated, 'addresses.billingAddress.city', 'New York');
      setValueAtPath(updated, 'addresses.billingAddress.zipcode', '10001');
      setValueAtPath(updated, 'addresses.billingAddress.country', 'USA');
      return updated;
    });
  }
}
