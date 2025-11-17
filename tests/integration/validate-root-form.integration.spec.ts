import { Component, signal, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ROOT_FORM, vestForms } from 'ngx-vest-forms';
import { enforce, only, staticSuite, test } from 'vest';

type GeneralInfoForm = {
  generalInfo?: {
    firstName?: string;
    lastName?: string;
  };
};

const issueThirteenSuite = staticSuite(
  (model: GeneralInfoForm = {}, field?: string) => {
    only(field);

    test('generalInfo.firstName', 'First name is required', () => {
      enforce(model.generalInfo?.firstName).isNotBlank();
    });

    test(ROOT_FORM, 'General info must be complete', () => {
      enforce(model.generalInfo?.firstName).isNotBlank();
    });
  }
);

@Component({
  standalone: true,
  imports: [vestForms],
  template: `
    <form
      scVestForm
      [formShape]="shape"
      [suite]="suite"
      [validateRootForm]="true"
      (formValueChange)="formValue.set($event)"
      (validChange)="formValid.set($event)"
      (ngSubmit)="onSubmit()"
    >
      <div class="w-full" ngModelGroup="generalInfo" ngx-control-wrapper>
        <div ngx-control-wrapper>
          <label for="firstName">First name</label>
          <input
            id="firstName"
            class="input input-bordered input-primary"
            type="text"
            name="generalInfo.firstName"
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
  protected readonly shape = {
    generalInfo: {
      firstName: '',
      lastName: '',
    },
  };

  protected onSubmit(): void {
    // no-op
  }
}

async function compilePackageConsumer(component: Type<unknown>): Promise<void> {
  await TestBed.configureTestingModule({
    imports: [component],
  }).compileComponents();

  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
}

describe('validateRootForm integration (dist consumer)', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('compiles when consumers import vestForms from the built package', async () => {
    await expect(
      compilePackageConsumer(PackageConsumerComponent)
    ).resolves.toBeUndefined();
  });
});
