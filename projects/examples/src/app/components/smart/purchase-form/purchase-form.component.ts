import { JsonPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  clearFields,
  createValidationConfig,
  FormDirective,
  NgxVestForms,
  ROOT_FORM,
  setValueAtPath,
} from 'ngx-vest-forms';
import { AddressModel } from '../../../models/address.model';
import {
  initialPurchaseFormValue,
  PurchaseFormModel,
  purchaseFormShape,
} from '../../../models/purchase-form.model';
import { ProductService } from '../../../product.service';
import { SwapiService } from '../../../swapi.service';
import { createPurchaseValidationSuite } from '../../../validations/purchase.validations';
import { AddressComponent } from '../../ui/address/address.component';
import { CardComponent } from '../../ui/card/card.component';
import { PhoneNumbersComponent } from '../../ui/phonenumbers/phonenumbers.component';

// API response type from json-server
type LukeApiResponse = {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
};

@Component({
  selector: 'ngx-purchase-form',
  imports: [
    JsonPipe,
    NgxVestForms,
    AddressComponent,
    PhoneNumbersComponent,
    CardComponent,
  ],
  templateUrl: './purchase-form.component.html',
  styleUrls: ['./purchase-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseFormComponent {
  private readonly swapiService = inject(SwapiService);
  private readonly productService = inject(ProductService);
  readonly products = toSignal(this.productService.getAll());

  // Signal to trigger Luke fetch (changes value to trigger refetch)
  private readonly lukeFetchTrigger = signal<string | undefined>(undefined);

  // Form reference for reset functionality
  private readonly vestForm =
    viewChild.required<FormDirective<PurchaseFormModel>>('vestForm');

  protected readonly formValue = signal<PurchaseFormModel>(
    initialPurchaseFormValue
  );
  protected readonly formValid = signal<boolean>(false);
  protected readonly errors = signal<Record<string, string[]>>({});
  protected readonly purchaseValidationSuite = createPurchaseValidationSuite(
    this.swapiService
  );
  private readonly shippingAddress = signal<AddressModel>({});

  // httpResource for fetching Luke data - only fetches when trigger is set
  private readonly lukeResource = httpResource<LukeApiResponse>(() =>
    this.lukeFetchTrigger() ? 'http://localhost:3000/people/1' : undefined
  );

  // Transform the raw API response into the form model shape
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

  // Fields populated by fetch should be disabled (system-provided data)
  protected readonly fetchedDataDisabled = computed(
    () => this.lukeResource.value() !== undefined
  );

  // Derive loading state from httpResource status
  protected readonly loading = computed(
    () => this.lukeResource.status() === 'loading'
  );
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

  // Computed validationConfig using the fluent builder API
  // This prevents "control not found" warnings for conditionally rendered fields
  protected readonly validationConfig = computed(() => {
    const builder = createValidationConfig<PurchaseFormModel>()
      // Password confirmation (bidirectional validation)
      .bidirectional('passwords.password', 'passwords.confirmPassword')

      // Age and emergency contact relationship
      .bidirectional('age', 'emergencyContact');

    // Conditionally add genderOther validation when gender is 'other'
    if (this.formValue().gender === 'other') {
      builder.whenChanged('gender', 'genderOther');
    }

    // Conditionally add justification when quantity > 5
    if ((this.formValue().quantity || 0) > 5) {
      builder.bidirectional('quantity', 'justification');
    }

    return builder.build();
  });

  // Expose ROOT_FORM constant for template
  protected readonly ROOT_FORM = ROOT_FORM;

  constructor() {
    const firstName = computed(() => this.formValue().firstName);
    const lastName = computed(() => this.formValue().lastName);

    // Effect for Brecht-specific logic
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

    // Effect to update form when Luke data is fetched via httpResource
    effect(() => {
      const luke = this.lukeData();
      if (luke) {
        this.formValue.update((v) => ({ ...v, ...luke }));
      }
    });

    // Effect to auto-fetch Luke when firstName becomes 'Luke'
    // Uses a debounced approach by tracking the previous value
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    effect((onCleanup) => {
      const name = firstName();
      if (name === 'Luke') {
        debounceTimer = setTimeout(() => {
          // Only trigger if not already loading and trigger hasn't been set for this
          if (this.lukeResource.status() !== 'loading') {
            this.lukeFetchTrigger.set(`auto-${Date.now()}`);
          }
        }, 1000);
      }
      onCleanup(() => {
        if (debounceTimer) clearTimeout(debounceTimer);
      });
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

  protected save(): void {
    if (this.formValid()) {
      // Intentionally no console output in examples to keep CI and demos quiet
    }
  }

  protected fetchData() {
    // Trigger httpResource fetch by changing the signal value
    // The unique ID ensures a new fetch even if called multiple times
    this.lukeFetchTrigger.set(`manual-${Date.now()}`);
  }

  protected reset(): void {
    // 1. Reset form data (component owns the data)
    this.formValue.set(initialPurchaseFormValue);

    // 2. Reset Angular form state + Vest validation state
    this.vestForm().resetForm(initialPurchaseFormValue);

    // 3. Reset component-local cache (not part of form directive)
    this.shippingAddress.set({});

    // 4. Reset Luke fetch trigger so fields become editable again
    this.lukeFetchTrigger.set(undefined);

    // Note: formValid and errors will auto-update via output bindings
  }

  /**
   * Example: Clear sensitive fields while keeping basic info
   * Showcases the clearFields utility from ngx-vest-forms
   * Also clears any fetched data (Luke) and resets the fetch trigger
   */
  protected clearSensitiveData(): void {
    // Clear fetched data trigger so fields become editable again
    this.lukeFetchTrigger.set(undefined);

    // Clear sensitive fields including fetched user data
    this.formValue.update((v) =>
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

  /**
   * Example: Programmatically set nested values
   * Showcases the setValueAtPath utility from ngx-vest-forms
   */
  protected prefillBillingAddress(): void {
    this.formValue.update((v) => {
      const updated = structuredClone(v); // Clone to avoid mutation
      setValueAtPath(updated, 'addresses.billingAddress.street', '123 Main St');
      setValueAtPath(updated, 'addresses.billingAddress.number', '42A');
      setValueAtPath(updated, 'addresses.billingAddress.city', 'New York');
      setValueAtPath(updated, 'addresses.billingAddress.zipcode', '10001');
      setValueAtPath(updated, 'addresses.billingAddress.country', 'USA');
      return updated;
    });
  }

  /**
   * Handles structural changes to phone numbers (add/remove).
   * Value edits flow automatically via ngModel + vestFormsViewProviders.
   */
  protected onPhoneNumbersChange(values: Record<string, string>): void {
    this.formValue.update((v) => ({
      ...v,
      phonenumbers: {
        ...v.phonenumbers,
        values,
      },
    }));
  }
}
