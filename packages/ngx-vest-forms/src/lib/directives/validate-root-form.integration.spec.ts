import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgxVestForms, provideFormContract, ROOT_FORM } from 'ngx-vest-forms';
import { create, enforce, test } from 'vest';

type GeneralInfoForm = {
  generalInfo?: {
    firstName?: string;
    lastName?: string;
  };
};

const issueThirteenSuite = create((model: GeneralInfoForm = {}) => {
  test('generalInfo.firstName', 'First name is required', () => {
    enforce(model.generalInfo?.firstName).isNotBlank();
  });

  test(ROOT_FORM, 'General info must be complete', () => {
    enforce(model.generalInfo?.firstName).isNotBlank();
  });
});

@Component({
  imports: [NgxVestForms],
  providers: [
    provideFormContract({
      generalInfo: {
        firstName: '',
        lastName: '',
      },
    }),
  ],
  template: `
    <form
      ngxVestForm
      ngxValidateRootForm
      [formValue]="formValue()"
      [suite]="suite"
      (formValueChange)="formValue.set($event)"
      (validChange)="formValid.set($event)"
      (ngSubmit)="onSubmit()"
    >
      <div ngModelGroup="generalInfo">
        <div ngxControlWrapper>
          <label for="firstName">First name</label>
          <input
            id="firstName"
            class="input input-bordered input-primary"
            type="text"
            name="firstName"
            [ngModel]="formValue().generalInfo?.firstName"
          />
        </div>
      </div>
      <p>Valid: {{ formValid() }}</p>
    </form>
  `,
})
class PackageConsumerComponent {
  protected readonly suite = issueThirteenSuite;
  protected readonly formValue = signal<GeneralInfoForm>({ generalInfo: {} });
  protected readonly formValid = signal(false);

  protected onSubmit(): void {
    // no-op
  }
}

describe('validateRootForm integration', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('compiles correctly with NgxVestForms directives', async () => {
    await TestBed.configureTestingModule({
      imports: [PackageConsumerComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(PackageConsumerComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement).toBeTruthy();
  });
});
