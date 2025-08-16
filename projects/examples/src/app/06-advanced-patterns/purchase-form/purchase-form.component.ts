import { JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  isDevMode,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import type { NgxVestSuite } from 'ngx-vest-forms';
import { injectNgxRootFormKey, ngxVestForms } from 'ngx-vest-forms';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';
import { NgxFormDirective } from 'ngx-vest-forms/core';
import type { InferSchemaType } from 'ngx-vest-forms/schemas';
import {
  ngxModelToStandardSchema,
  NgxVestFormWithSchemaDirective,
} from 'ngx-vest-forms/schemas';
import { debounceTime, filter, finalize, switchMap } from 'rxjs';
import { LukeService } from '../../services/luke.service';
import { ProductService } from '../../services/product.service';
import { SwapiService } from '../../services/swapi.service';
import { AddressComponent } from '../../ui/address/address.component';
import { AddressModel } from '../../ui/address/address.model';
import { PhoneNumbersComponent } from '../../ui/phone-numbers/phone-numbers.component';
import { initialPurchaseFormData } from './purchase-form.model';
import { createPurchaseValidationSuite } from './purchase.validations';

// Create a schema for the purchase form
const purchaseFormSchema = ngxModelToStandardSchema(initialPurchaseFormData);

// Infer the type for the purchase form from the schema
type PurchaseFormModel = InferSchemaType<typeof purchaseFormSchema>;

@Component({
  selector: 'ngx-purchase-form',
  imports: [
    JsonPipe,
    ngxVestForms,
    AddressComponent,
    PhoneNumbersComponent,
    NgxControlWrapper,
    NgxVestFormWithSchemaDirective,
  ],
  templateUrl: './purchase-form.component.html',
  styleUrls: ['./purchase-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseFormComponent {
  /**
   * Expose the initial form data for use in the template (e.g., for reset or fallback).
   */
  /**
   * The initial value for the purchase form.
   */
  /**s.purchaseFormModel.set(this.initialPurchaseFormData);  /**
   * The initial value for the purchase form.
   */
  readonly initialPurchaseFormData = initialPurchaseFormData;
  #lukeService = inject(LukeService);
  #swapiService = inject(SwapiService);
  #productService = inject(ProductService);
  readonly rootFormKey = injectNgxRootFormKey();
  readonly products = toSignal(this.#productService.getAll());

  /**
   * The form value signal, bound to the form using model() for two-way binding.
   * This is the single source of truth for the form's value.
   */
  /**
   * The form value signal, bound to the form using model() for two-way binding.
   */
  protected readonly purchaseFormModel = model<PurchaseFormModel>(
    this.initialPurchaseFormData,
  );
  protected readonly loading = signal<boolean>(false);

  // Define the view child for the vestForm directive
  protected readonly vestForm =
    viewChild.required<NgxFormDirective>('vestForm');

  // Use the NgxVestSuite type alias for consistency
  /**
   * The Vest validation suite for the purchase form.
   */
  protected readonly purchaseFormSuite: NgxVestSuite<PurchaseFormModel> =
    createPurchaseValidationSuite(this.rootFormKey, this.#swapiService);

  // Provide the wrapped model template to the 'formSchema' input
  /**
   * The schema definition for the purchase form.
   */
  protected readonly purchaseFormSchema = purchaseFormSchema;

  // Keep shippingAddress signal if needed for specific logic
  #shippingAddress = signal<AddressModel>(
    this.initialPurchaseFormData.addresses?.shippingAddress ?? {},
  );

  /**
   * View model for template binding. Exposes plain values, not signals.
   */
  private readonly viewModel = computed(() => {
    const vestFormInstance = this.vestForm();
    const formState = vestFormInstance?.formState();
    // Use a safe fallback to avoid undefined during early render/hot-reload edges
    const current = this.purchaseFormModel();
    const useInitial =
      current == null ||
      (typeof current === 'object' &&
        Object.keys(current as object).length === 0);
    const value = useInitial ? this.initialPurchaseFormData : current;
    return {
      formValue: () => value,
      errors: formState?.errors ?? {},
      formValid: formState?.valid ?? false,
      emergencyContactDisabled: (value?.age ?? 0) >= 18,
      showShippingAddress:
        value?.addresses?.shippingAddressDifferentFromBillingAddress,
      showGenderOther: value?.gender === 'other',
      shippingAddress:
        value?.addresses?.shippingAddress ?? this.#shippingAddress(),
      loading: this.loading(),
    };
  });

  protected readonly validationConfig: Record<string, string[]> = {
    age: ['emergencyContact'],
    'passwords.password': ['passwords.confirmPassword'],
    gender: ['genderOther'],
  };

  constructor() {
    const firstName = computed(() => this.purchaseFormModel()?.firstName ?? '');
    const lastName = computed(() => this.purchaseFormModel()?.lastName ?? '');

    effect(() => {
      if (firstName() === 'Brecht') {
        this.purchaseFormModel.update((value: PurchaseFormModel) => ({
          ...value,
          gender: 'male',
        }));
      }
      if (firstName() === 'Brecht' && lastName() === 'Billiet') {
        this.purchaseFormModel.update((value: PurchaseFormModel) => ({
          ...value,
          age: 35,
          passwords: {
            password: 'Test1234',
            confirmPassword: 'Test12345',
          },
        }));
      }
    });

    toObservable(firstName)
      .pipe(
        debounceTime(1000),
        filter((v) => v === 'Luke'),
        switchMap(() => {
          if (isDevMode()) {
            console.log('Fetching Luke data...');
          }
          return this.#lukeService.getLuke();
        }),
      )
      .subscribe((luke: Partial<PurchaseFormModel>) => {
        if (isDevMode()) {
          console.log('Received Luke data:', structuredClone(luke));
        }
        this.purchaseFormModel.update((v: PurchaseFormModel) => {
          if (isDevMode()) {
            console.log(
              'Before Luke update - current formValue:',
              structuredClone(v),
            );
          }
          const newValue = { ...v, ...luke };
          if (isDevMode()) {
            console.log(
              'After Luke update - new formValue:',
              structuredClone(newValue),
            );
          }
          if (!newValue.phoneNumbers) {
            console.error(
              'CRITICAL: phoneNumbers is undefined/missing AFTER merging Luke data!',
              structuredClone(newValue),
            );
          }
          return newValue;
        });
      });
    if (isDevMode()) {
      console.log('Root form identifier:', this.rootFormKey);
    }

    effect(() => {
      const currentValue = this.purchaseFormModel();
      // Early render can momentarily set formValue to null/{} during sync. Guard access.
      const isEmptyObject =
        currentValue &&
        typeof currentValue === 'object' &&
        Object.keys(currentValue as object).length === 0;
      if (isDevMode()) {
        console.log(
          'Form value changed overall. Has phoneNumbers:',
          !!(
            currentValue &&
            !isEmptyObject &&
            (currentValue as PurchaseFormModel).phoneNumbers
          ),
          'Value:',
          structuredClone(currentValue ?? this.initialPurchaseFormData),
        );
      }
      if (
        !currentValue ||
        isEmptyObject ||
        !(currentValue as PurchaseFormModel).phoneNumbers
      ) {
        // Just a dev hint; initial sync can transiently lack phoneNumbers until controls register.
        console.warn(
          '[dev] formValue missing phoneNumbers during init/sync, will settle after control registration.',
        );
      }
    });
  }

  /**
   * Updates the shippingAddress signal if the form value changes.
   * This keeps the shipping address in sync for any logic that depends on it.
   */
  // This effect is intentionally unused; it runs for its side effect of keeping the shipping address in sync.
  // eslint-disable-next-line no-unused-private-class-members
  #syncShippingAddressEffect = effect(() => {
    const raw = this.purchaseFormModel();
    const shipping =
      raw && typeof raw === 'object' && Object.keys(raw as object).length > 0
        ? raw.addresses?.shippingAddress
        : this.initialPurchaseFormData.addresses.shippingAddress;
    if (shipping) {
      this.#shippingAddress.set(shipping);
    }
  });

  /**
   * Returns the current view model for template binding.
   */
  protected get vm() {
    return this.viewModel();
  }

  /**
   * Handles form submission. Logs the form value and errors.
   */
  protected onSubmit(): void {
    const formState = this.vestForm()?.formState();
    if (formState?.valid) {
      if (isDevMode()) {
        console.log('Form Submitted (Valid):', this.purchaseFormModel());
      }
    } else {
      if (isDevMode()) {
        console.log('Form Submitted (Invalid):', this.purchaseFormModel());
        console.log('Current Errors:', formState?.errors ?? {});
      }
    }
  }

  /**
   * Fetches Luke data and merges it into the form value.
   * Sets loading state while fetching.
   */
  protected fetchData() {
    this.loading.set(true);
    this.#lukeService
      .getLuke()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((luke) => {
        this.purchaseFormModel.update((v) => {
          const newValue = { ...v, ...luke };
          if (!newValue.phoneNumbers) {
            console.error(
              'CRITICAL (fetchData): phoneNumbers is undefined/missing AFTER merging Luke data!',
              structuredClone(newValue),
            );
          }
          return newValue;
        });
      });
  }

  /**
   * Resets the form to initial values using the model API.
   */
  protected resetForm(): void {
    this.purchaseFormModel.set(this.initialPurchaseFormData);
    // Access the form through viewChild
    setTimeout(() => {
      const form = this.vestForm()?.ngForm?.form;
      if (form) {
        form.markAsPristine();
        form.markAsUntouched();
      }
    });
  }
}
