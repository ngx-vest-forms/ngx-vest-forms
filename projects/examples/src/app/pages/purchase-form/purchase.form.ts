import { HttpErrorResponse, httpResource } from '@angular/common/http';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  Injector,
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
  NGX_VALIDATION_DEBOUNCE_PRESETS,
  NgxVestForms,
  setValueAtPath,
  type ValidationOptions,
} from 'ngx-vest-forms';
import {
  initialPurchaseFormValue,
  PurchaseFormModel,
  purchaseFormShape,
} from '../../models/purchase-form.model';
import { AddressComponent } from '../../ui/address/address.component';
import { AlertPanel } from '../../ui/alert-panel/alert-panel.component';
import { FormSectionComponent } from '../../ui/form-section/form-section.component';
import { PhoneNumbersComponent } from '../../ui/phonenumbers/phonenumbers.component';
import { mapWarningsToRecord } from '../../utils/form-warnings.util';
import { ProductService } from './product.service';
import { createPurchaseValidationSuite } from './purchase.validations';
import { SwapiService } from './swapi.service';

// Response shape for the examples app's mock people API.
type LukeApiResponse = {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
};

type FetchErrorNotice = {
  title: string;
  message: string;
  detail?: string;
};

export type FetchErrorScenario =
  | 'random'
  | 'not-found'
  | 'unauthorized'
  | 'server-error'
  | 'network-error';

type FetchRequest = {
  personId: string;
  errorScenario?: Exclude<FetchErrorScenario, 'random'>;
};

const FETCH_ERROR_SCENARIOS: Array<Exclude<FetchErrorScenario, 'random'>> = [
  'not-found',
  'unauthorized',
  'server-error',
  'network-error',
];

@Component({
  selector: 'ngx-purchase-form',
  imports: [
    NgxVestForms,
    AlertPanel,
    AddressComponent,
    FormSectionComponent,
    PhoneNumbersComponent,
  ],
  templateUrl: './purchase.form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseForm {
  protected readonly validationDebouncePresets =
    NGX_VALIDATION_DEBOUNCE_PRESETS;
  protected readonly formValidationOptions: ValidationOptions = {
    debounceTime: this.validationDebouncePresets.typing,
  };
  protected readonly userIdValidationOptions: ValidationOptions = {
    debounceTime: this.validationDebouncePresets.async,
  };
  private readonly injector = inject(Injector);
  private readonly swapiService = inject(SwapiService);
  private readonly productService = inject(ProductService);
  readonly products = toSignal(this.productService.getAll());

  private readonly vestForm =
    viewChild<FormDirective<PurchaseFormModel>>('vestForm');

  protected readonly formValue = signal<PurchaseFormModel>(
    initialPurchaseFormValue
  );
  protected readonly shape = purchaseFormShape;
  protected readonly purchaseValidationSuite = createPurchaseValidationSuite(
    this.swapiService
  );

  readonly formValueChange = output<PurchaseFormModel>();
  readonly saveRequested = output<PurchaseFormModel>();

  /** Exposes the directive's packaged form state. */
  readonly formState = computed(() => {
    const state = this.vestForm()?.formState();
    if (!state) return createEmptyFormState<PurchaseFormModel>();
    return state;
  });

  /** Exposes field warnings as a plain Record for presentational components. */
  readonly warnings = computed(() =>
    mapWarningsToRecord(this.vestForm()?.fieldWarnings() ?? new Map())
  );

  /**
   * Field paths that have been validated (touched/blurred or submitted).
   * Delegates to the FormDirective's touchedFieldPaths signal which
   * reactively tracks TouchedChangeEvent from the form tree.
   */
  readonly validatedFields = computed(
    () => this.vestForm()?.touchedFieldPaths() ?? []
  );

  /** True while async validation is in progress. */
  readonly pending = computed(
    () => this.vestForm()?.ngForm.form.pending ?? false
  );

  /**
   * Automatically fetch demo data when the first name becomes "Luke".
   * A manual request can temporarily override this to demonstrate both
   * success and failure flows from the page toolbar.
   */
  private readonly autoFetchLukeRequested = linkedSignal({
    source: () => this.formValue().firstName,
    computation: (firstName) => firstName === 'Luke',
  });

  private readonly manualFetchRequest = signal<FetchRequest | undefined>(
    undefined
  );
  private readonly fetchedPersonId = signal<string | null>(null);
  private readonly fetchErrorNoticeSignal = signal<
    FetchErrorNotice | undefined
  >(undefined);

  private readonly requestedPersonId = computed(() => {
    const manualRequest = this.manualFetchRequest();
    if (manualRequest) {
      return manualRequest;
    }

    return this.autoFetchLukeRequested() ? { personId: '1' } : undefined;
  });

  private readonly lukeResource = httpResource<LukeApiResponse>(() => {
    const request = this.requestedPersonId();

    if (!request) {
      return undefined;
    }

    const requestUrl = new URL(
      `/api/people/${request.personId}`,
      globalThis.location.origin
    );

    if (request.errorScenario) {
      requestUrl.searchParams.set('errorScenario', request.errorScenario);
    }

    return `${requestUrl.pathname}${requestUrl.search}`;
  });

  private readonly lukeData = computed(() => {
    const data = this.lukeResource.hasValue()
      ? this.lukeResource.value()
      : undefined;

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
    () => this.fetchedPersonId() !== null
  );

  protected readonly loading = computed(
    () => this.lukeResource.status() === 'loading'
  );

  protected readonly fetchErrorNotice = computed(() =>
    this.fetchErrorNoticeSignal()
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
    () => this.formValue().addresses?.shippingAddress
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
          this.fetchErrorNoticeSignal.set(undefined);
          this.manualFetchRequest.set(undefined);
          this.fetchedPersonId.set(luke.userId);
          this.updateFormValue((v) => ({ ...v, ...luke }));
        });
      }
    });

    effect(() => {
      if (this.lukeResource.status() !== 'error') {
        return;
      }

      const request = this.requestedPersonId();
      const requestError = this.lukeResource.error();

      untracked(() => {
        const hadFetchedData = this.fetchedPersonId() !== null;

        this.manualFetchRequest.set(undefined);
        this.fetchedPersonId.set(null);
        this.fetchErrorNoticeSignal.set(
          this.buildFetchErrorNotice(requestError, request)
        );

        if (hadFetchedData) {
          this.updateFormValue((value) =>
            clearFields(value, ['userId', 'firstName', 'lastName', 'gender'])
          );
        }
      });
    });
  }

  fetchData(): void {
    this.fetchErrorNoticeSignal.set(undefined);
    this.manualFetchRequest.set({ personId: '1' });
  }

  fetchDataWithFailure(errorScenario: FetchErrorScenario = 'not-found'): void {
    const resolvedErrorScenario = this.resolveErrorScenario(errorScenario);

    this.fetchErrorNoticeSignal.set(undefined);
    this.manualFetchRequest.set({
      personId: resolvedErrorScenario === 'not-found' ? '404' : '1',
      errorScenario: resolvedErrorScenario,
    });
  }

  clearSensitiveData(): void {
    this.manualFetchRequest.set(undefined);
    this.fetchErrorNoticeSignal.set(undefined);
    this.fetchedPersonId.set(null);
    this.autoFetchLukeRequested.set(false);
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
    if (this.didFetchFieldsChange(value)) {
      this.fetchErrorNoticeSignal.set(undefined);
    }

    this.formValue.set(value);
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
    const formDirective = this.vestForm();
    if (!formDirective) {
      return;
    }

    afterNextRender(
      () => {
        formDirective.focusFirstInvalidControl();

        if (
          !formDirective.ngForm.form.valid ||
          formDirective.ngForm.form.pending
        ) {
          return;
        }

        this.saveRequested.emit(this.formValue());
      },
      { injector: this.injector }
    );
  }

  protected onReset(): void {
    this.manualFetchRequest.set(undefined);
    this.fetchErrorNoticeSignal.set(undefined);
    this.fetchedPersonId.set(null);
    this.autoFetchLukeRequested.set(false);
    this.formValue.set(initialPurchaseFormValue);
    // resetForm() handles everything: clears controls, fieldWarnings, triggers
    // re-validation, which causes formValueChange to emit.
    this.vestForm()?.resetForm(initialPurchaseFormValue);
  }

  private didFetchFieldsChange(nextValue: PurchaseFormModel): boolean {
    const currentValue = this.formValue();

    return (
      nextValue.userId !== currentValue.userId ||
      nextValue.firstName !== currentValue.firstName ||
      nextValue.lastName !== currentValue.lastName ||
      nextValue.gender !== currentValue.gender
    );
  }

  private buildFetchErrorNotice(
    error: unknown,
    request: FetchRequest | undefined
  ): FetchErrorNotice {
    if (error instanceof HttpErrorResponse) {
      const detail = this.getHttpErrorDetail(error);

      if (error.status === 404) {
        return {
          title: 'Person not found',
          message: 'No person was found for this request.',
          detail,
        };
      }

      if (error.status === 0) {
        return {
          title: 'Network error',
          message:
            'We could not reach the people service. Please check your connection and try again.',
          detail,
        };
      }

      return {
        title: error.statusText || 'Request failed',
        message: `The request failed with status ${error.status}.`,
        detail,
      };
    }

    if (error instanceof Error) {
      return {
        title: 'Request failed',
        message: error.message,
      };
    }

    return {
      title: 'Request failed',
      message:
        request?.personId === '1'
          ? 'We could not load Luke Skywalker right now. Please try again.'
          : 'We could not load demo data for this request. Please try again.',
    };
  }

  private resolveErrorScenario(
    errorScenario: FetchErrorScenario
  ): Exclude<FetchErrorScenario, 'random'> {
    if (errorScenario !== 'random') {
      return errorScenario;
    }

    const randomIndex = Math.floor(
      Math.random() * FETCH_ERROR_SCENARIOS.length
    );
    return FETCH_ERROR_SCENARIOS[randomIndex] ?? 'not-found';
  }

  private getHttpErrorDetail(error: HttpErrorResponse): string | undefined {
    if (
      typeof error.error === 'object' &&
      error.error !== null &&
      'message' in error.error &&
      typeof error.error.message === 'string'
    ) {
      return error.error.message;
    }

    if (typeof error.message === 'string' && error.message.length > 0) {
      return error.message;
    }

    return undefined;
  }

  private updateFormValue(
    updater: (current: PurchaseFormModel) => PurchaseFormModel
  ): void {
    const next = updater(this.formValue());
    if (next === this.formValue()) {
      return;
    }
    this.formValue.set(next);
    this.formValueChange.emit(next);
  }
}
