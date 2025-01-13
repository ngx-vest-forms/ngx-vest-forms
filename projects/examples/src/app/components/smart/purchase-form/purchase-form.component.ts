import { JsonPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ValidateRootFormDirective, vestForms } from 'ngx-vest-forms';
import { debounceTime, filter, switchMap } from 'rxjs';
import { LukeService } from '../../../luke.service';
import { AddressModel } from '../../../models/address.model';
import {
  PurchaseFormModel,
  purchaseFormShape,
} from '../../../models/purchase-form.model';
import { ProductService } from '../../../product.service';
import { SwapiService } from '../../../swapi.service';
import { createPurchaseValidationSuite } from '../../../validations/purchase.validations';
import { AddressComponent } from '../../ui/address/address.component';
import { PhonenumbersComponent } from '../../ui/phonenumbers/phonenumbers.component';

@Component({
  selector: 'sc-purchase-form',
  imports: [
    JsonPipe,
    vestForms,
    AddressComponent,
    PhonenumbersComponent,
    ValidateRootFormDirective,
  ],
  templateUrl: './purchase-form.component.html',
  styleUrls: ['./purchase-form.component.scss'],
})
export class PurchaseFormComponent {
  private readonly lukeService = inject(LukeService);
  private readonly swapiService = inject(SwapiService);
  private readonly productService = inject(ProductService);
  public readonly products = toSignal(this.productService.getAll());
  protected readonly formValue = signal<PurchaseFormModel>({});
  protected readonly formValid = signal<boolean>(false);
  protected readonly loading = signal<boolean>(false);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly suite = createPurchaseValidationSuite(this.swapiService);
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
      // Take shipping address from the state
      shippingAddress:
        this.formValue().addresses?.shippingAddress || this.shippingAddress(),
      loading: this.loading(),
    };
  });

  protected readonly validationConfig: Record<string, string[]> = {
    age: ['emergencyContact'],
    'passwords.password': ['passwords.confirmPassword'],
    gender: ['genderOther'],
  };

  constructor() {
    const firstName = computed(() => this.formValue().firstName);
    const lastName = computed(() => this.formValue().lastName);

    effect(() => {
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
    });

    // When firstName is Luke, fetch luke skywalker and update the form value
    toObservable(firstName)
      .pipe(
        debounceTime(1000),
        filter((v) => v === 'Luke'),
        switchMap(() => this.lukeService.getLuke()),
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
}
