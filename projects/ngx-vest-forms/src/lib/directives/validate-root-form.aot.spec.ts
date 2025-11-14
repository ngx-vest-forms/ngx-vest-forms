import { Component, signal, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { enforce, only, staticSuite, test } from 'vest';
import { ROOT_FORM } from '../constants';
import { vestForms } from '../exports';

type PasswordFormModel = {
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  age?: number;
};

const passwordSuite = staticSuite(
  (model: PasswordFormModel = {}, field?: string) => {
    only(field);

    test('password', 'Password is required', () => {
      enforce(model.password).isNotBlank();
    });

    test('confirmPassword', 'Confirm password is required', () => {
      enforce(model.confirmPassword).isNotBlank();
    });

    test(ROOT_FORM, 'Passwords must match', () => {
      if (model.password && model.confirmPassword) {
        enforce(model.confirmPassword).equals(model.password);
      }
    });
  }
);

const brechtSuite = staticSuite(
  (model: PasswordFormModel = {}, field?: string) => {
    only(field);

    test('firstName', 'First name is required', () => {
      enforce(model.firstName).isNotBlank();
    });

    test('lastName', 'Last name is required', () => {
      enforce(model.lastName).isNotBlank();
    });

    test('age', 'Age is required', () => {
      enforce(model.age).isNotBlank();
    });

    test(ROOT_FORM, 'Brecht is not 30 anymore', () => {
      enforce(
        model.firstName === 'Brecht' &&
          model.lastName === 'Billiet' &&
          model.age === 30
      ).isFalsy();
    });
  }
);

async function compileStandaloneComponent(
  component: Type<unknown>
): Promise<void> {
  await TestBed.configureTestingModule({
    imports: [component],
  }).compileComponents();

  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
}

describe('ValidateRootFormDirective (template compilation)', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('compiles templates that use validateRootForm attribute', async () => {
    @Component({
      standalone: true,
      imports: [vestForms],
      template: `
        <form
          scVestForm
          validateRootForm
          [suite]="suite"
          [formValue]="formValue()"
          (formValueChange)="formValue.set($event)"
        >
          <input name="password" [ngModel]="formValue().password" />
          <input
            name="confirmPassword"
            [ngModel]="formValue().confirmPassword"
          />
        </form>
      `,
    })
    class AttributeComponent {
      protected readonly formValue = signal<PasswordFormModel>({});
      protected readonly suite = passwordSuite;
    }

    await expect(
      compileStandaloneComponent(AttributeComponent)
    ).resolves.toBeUndefined();
  });

  it('compiles templates that bind validateRootForm inputs', async () => {
    @Component({
      standalone: true,
      imports: [vestForms],
      template: `
        <form
          scVestForm
          [validateRootForm]="shouldValidate()"
          [validateRootFormMode]="mode"
          [suite]="suite"
          [formValue]="formValue()"
          (formValueChange)="formValue.set($event)"
        >
          <input name="password" [ngModel]="formValue().password" />
        </form>
      `,
    })
    class BoundInputsComponent {
      protected readonly formValue = signal<PasswordFormModel>({});
      protected readonly suite = passwordSuite;
      protected readonly mode: 'submit' | 'live' = 'submit';

      protected shouldValidate(): boolean {
        return true;
      }
    }

    await expect(
      compileStandaloneComponent(BoundInputsComponent)
    ).resolves.toBeUndefined();
  });

  it('compiles templates using ngxValidateRootForm alias and live mode', async () => {
    @Component({
      standalone: true,
      imports: [vestForms],
      template: `
        <form
          ngxVestForm
          ngxValidateRootForm
          [ngxValidateRootFormMode]="'live'"
          [suite]="suite"
          [formValue]="formValue()"
          (formValueChange)="formValue.set($event)"
        >
          <input name="firstName" [ngModel]="formValue().firstName" />
          <input name="lastName" [ngModel]="formValue().lastName" />
        </form>
      `,
    })
    class NgxAliasComponent {
      protected readonly formValue = signal<PasswordFormModel>({});
      protected readonly suite = brechtSuite;
    }

    await expect(
      compileStandaloneComponent(NgxAliasComponent)
    ).resolves.toBeUndefined();
  });

  it('compiles template that mirrors the Issue #13 reproduction snippet', async () => {
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
          <div class="w-full" ngModelGroup="generalInfo" sc-control-wrapper>
            <div sc-control-wrapper>
              <label for="name">First name</label>
              <input
                id="name"
                class="input"
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
    class IssueThirteenComponent {
      protected readonly formValue = signal<{
        generalInfo?: { firstName?: string };
      }>({});
      protected readonly formValid = signal(false);
      protected readonly suite = passwordSuite;
      protected readonly shape = {
        generalInfo: {
          firstName: '',
        },
      };

      protected onSubmit(): void {
        // No-op for compilation purposes
      }
    }

    await expect(
      compileStandaloneComponent(IssueThirteenComponent)
    ).resolves.toBeUndefined();
  });
});
