import {
  Component,
  ViewChild,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { create, test, omitWhen, enforce } from 'vest';
import { FormDirective } from '../directives/form.directive';
import { vestForms } from '../exports';
import { DeepPartial } from '../utils/deep-partial';
import { firstValueFrom } from 'rxjs';

interface FormModel {
  berekendeAftrekVoorarrest: {
    aantal: number | null;
    onderbouwing: string | null;
  };
}

interface PasswordFormModel {
  password?: string;
  confirmPassword?: string;
}

const validationSuite = create((model: DeepPartial<FormModel> = {}) => {
  const isBerekendeAftrekVoorarrest =
    model.berekendeAftrekVoorarrest?.aantal ||
    model.berekendeAftrekVoorarrest?.onderbouwing;

  omitWhen(!isBerekendeAftrekVoorarrest, () => {
    test(
      'berekendeAftrekVoorarrest.aantal',
      'Onderbouwing is verplicht',
      () => {
        enforce(model.berekendeAftrekVoorarrest?.onderbouwing).isNotBlank();
      }
    );

    test(
      'berekendeAftrekVoorarrest.onderbouwing',
      'Aantal is verplicht',
      () => {
        enforce(model.berekendeAftrekVoorarrest?.aantal).isTruthy();
      }
    );
  });
});

const passwordValidationSuite = create((model: PasswordFormModel) => {
  test('password', 'Password is required', () => {
    enforce(model.password).isNotBlank();
  });

  omitWhen(!model.password, () => {
    test('confirmPassword', 'Passwords must match', () => {
      enforce(model.confirmPassword).equals(model.password);
    });
  });
});

@Component({
  standalone: true,
  imports: [FormsModule, vestForms],
  template: `
    <form
      #vestForm="scVestForm"
      [scVestForm]="validationSuite"
      [formValue]="formValue()"
      (formValueChange)="formValue.set($event)"
      [validationConfig]="validationConfig"
    >
      <input
        name="berekendeAftrekVoorarrest.aantal"
        type="number"
        [ngModel]="formValue().berekendeAftrekVoorarrest?.aantal"
      />
      <input
        name="berekendeAftrekVoorarrest.onderbouwing"
        type="text"
        [ngModel]="formValue().berekendeAftrekVoorarrest?.onderbouwing"
      />
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestHostComponent {
  @ViewChild(FormDirective, { static: true })
  public formDirective!: FormDirective<FormModel>;
  public validationSuite = validationSuite;
  public formValue = signal<DeepPartial<FormModel>>({
    berekendeAftrekVoorarrest: { aantal: null, onderbouwing: null },
  });
  public validationConfig = {
    'berekendeAftrekVoorarrest.aantal': [
      'berekendeAftrekVoorarrest.onderbouwing',
    ],
    'berekendeAftrekVoorarrest.onderbouwing': [
      'berekendeAftrekVoorarrest.aantal',
    ],
  };
}

@Component({
  standalone: true,
  imports: [FormsModule, vestForms],
  template: `
    <form
      #vestForm="scVestForm"
      [scVestForm]="validationSuite"
      [formValue]="formValue()"
      (formValueChange)="formValue.set($event)"
      [validationConfig]="validationConfig"
    >
      <input name="password" type="password" [ngModel]="formValue().password" />
      <input
        name="confirmPassword"
        type="password"
        [ngModel]="formValue().confirmPassword"
      />
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class PasswordTestHostComponent {
  @ViewChild(FormDirective, { static: true })
  public formDirective!: FormDirective<PasswordFormModel>;
  public validationSuite = passwordValidationSuite;
  public formValue = signal<PasswordFormModel>({});
  public validationConfig = {
    password: ['confirmPassword'],
  };
}

describe('omitWhen + validationConfig + Nested Fields', () => {
  async function wait(fixture: ComponentFixture<any>) {
    await firstValueFrom(fixture.componentInstance.formDirective.idle$);
    fixture.detectChanges();
  }

  describe('Bidirectional dependencies with omitWhen', () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let component: TestHostComponent;
    let aantalInput: HTMLInputElement;
    let onderbouwingInput: HTMLInputElement;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(TestHostComponent);
      component = fixture.componentInstance;
      aantalInput = fixture.debugElement.query(
        By.css('input[name="berekendeAftrekVoorarrest.aantal"]')
      ).nativeElement;
      onderbouwingInput = fixture.debugElement.query(
        By.css('input[name="berekendeAftrekVoorarrest.onderbouwing"]')
      ).nativeElement;
      fixture.detectChanges();
      await wait(fixture);
    });

    it('should show error on onderbouwing when aantal is filled but onderbouwing is empty', async () => {
      aantalInput.value = '123';
      aantalInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      onderbouwingInput.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      await wait(fixture);

      expect(onderbouwingInput.classList.contains('ng-invalid')).toBe(true);
      expect(onderbouwingInput.classList.contains('ng-untouched')).toBe(true);
    });

    it('should show error on aantal when onderbouwing is filled but aantal is empty', async () => {
      onderbouwingInput.value = 'test';
      onderbouwingInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      aantalInput.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      await wait(fixture);

      expect(aantalInput.classList.contains('ng-invalid')).toBe(true);
      expect(aantalInput.classList.contains('ng-untouched')).toBe(true);
    });

    it('should remove error from onderbouwing when aantal is cleared', async () => {
      aantalInput.value = '123';
      aantalInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      onderbouwingInput.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      await wait(fixture);

      expect(onderbouwingInput.classList.contains('ng-invalid')).toBe(true);

      aantalInput.value = '';
      aantalInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      await wait(fixture);

      expect(onderbouwingInput.classList.contains('ng-valid')).toBe(true);
    });

    it('should be valid when both fields are filled', async () => {
      aantalInput.value = '123';
      aantalInput.dispatchEvent(new Event('input'));
      onderbouwingInput.value = 'test';
      onderbouwingInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      await wait(fixture);

      expect(aantalInput.classList.contains('ng-valid')).toBe(true);
      expect(onderbouwingInput.classList.contains('ng-valid')).toBe(true);
      expect(component.formDirective.ngForm.valid).toBe(true);
    });

    it('should be valid when both fields are empty', async () => {
      await wait(fixture);

      expect(aantalInput.classList.contains('ng-valid')).toBe(true);
      expect(onderbouwingInput.classList.contains('ng-valid')).toBe(true);
      expect(component.formDirective.ngForm.valid).toBe(true);
    });
  });

  describe('Single direction dependency with omitWhen', () => {
    let fixture: ComponentFixture<PasswordTestHostComponent>;
    let component: PasswordTestHostComponent;
    let passwordInput: HTMLInputElement;
    let confirmPasswordInput: HTMLInputElement;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [PasswordTestHostComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(PasswordTestHostComponent);
      component = fixture.componentInstance;
      passwordInput = fixture.debugElement.query(
        By.css('input[name="password"]')
      ).nativeElement;
      confirmPasswordInput = fixture.debugElement.query(
        By.css('input[name="confirmPassword"]')
      ).nativeElement;
      fixture.detectChanges();
      await wait(fixture);
    });

    it('should validate confirmPassword when password changes', async () => {
      passwordInput.value = 'password123';
      passwordInput.dispatchEvent(new Event('input'));
      confirmPasswordInput.value = 'different';
      confirmPasswordInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await wait(fixture);
      expect(confirmPasswordInput.classList.contains('ng-invalid')).toBe(true);

      passwordInput.value = 'newpassword';
      passwordInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await wait(fixture);

      expect(confirmPasswordInput.classList.contains('ng-invalid')).toBe(true);

      confirmPasswordInput.value = 'newpassword';
      confirmPasswordInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await wait(fixture);

      expect(confirmPasswordInput.classList.contains('ng-valid')).toBe(true);
      expect(component.formDirective.ngForm.valid).toBe(true);
    });

    it('should omit confirmPassword validation when password is empty', async () => {
      passwordInput.value = '';
      passwordInput.dispatchEvent(new Event('input'));
      confirmPasswordInput.value = 'somevalue';
      confirmPasswordInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await wait(fixture);

      expect(passwordInput.classList.contains('ng-invalid')).toBe(true);
      expect(confirmPasswordInput.classList.contains('ng-valid')).toBe(true);
    });
  });
});
