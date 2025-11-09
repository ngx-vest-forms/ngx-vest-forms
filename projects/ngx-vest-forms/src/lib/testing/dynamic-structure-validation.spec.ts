/**
 * Test suite for dynamic structure validation issue
 */
import { Component, signal, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vestForms } from '../exports';
import { FormDirective } from '../directives/form.directive';
import { staticSuite, test, enforce, omitWhen, only } from 'vest';
import { VALIDATION_CONFIG_DEBOUNCE_TIME } from '../constants';
import type { NgxDeepPartial } from '../../public-api';

type DynamicFormModel = NgxDeepPartial<{
  procedureType: 'typeA' | 'typeB' | 'typeC';
  fieldA?: string;
  fieldB?: string;
}>;

const dynamicFormValidationSuite = staticSuite(
  (model: DynamicFormModel, field?: string) => {
    only(field); // ✅ Call unconditionally

    test('procedureType', 'Procedure type is required', () => {
      enforce(model.procedureType).isNotBlank();
    });

    // Only validate fieldA when procedureType is 'typeA'
    omitWhen(model.procedureType !== 'typeA', () => {
      test('fieldA', 'Field A is required for Type A procedure', () => {
        enforce(model.fieldA).isNotUndefined().isNotBlank();
      });
    });

    // Only validate fieldB when procedureType is 'typeB'
    omitWhen(model.procedureType !== 'typeB', () => {
      test('fieldB', 'Field B is required for Type B procedure', () => {
        enforce(model.fieldB).isNotBlank();
      });
    });

    // TypeC has no additional validation requirements
  }
);

const waitForValidation = async (): Promise<void> => {
  await new Promise((resolve) =>
    setTimeout(resolve, VALIDATION_CONFIG_DEBOUNCE_TIME + 50)
  );
};

describe('FormDirective - Dynamic Structure Changes', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({}).compileComponents();
  });

  describe('Form Structure Change Detection', () => {
    it('should update validation when switching from input field to informational paragraph', async () => {
      @Component({
        imports: [vestForms],
        template: `
          <form
            scVestForm
            #vestForm="scVestForm"
            [formValue]="formValue()"
            [suite]="suite"
            [validationConfig]="validationConfig"
            (formValueChange)="formValue.set($event)"
            (validChange)="isValid.set($event)"
            (errorsChange)="errors.set($event)"
          >
            <select
              name="procedureType"
              [ngModel]="formValue().procedureType"
              data-testid="procedure-type"
            >
              <option value="">Select...</option>
              <option value="typeA">Type A</option>
              <option value="typeB">Type B</option>
              <option value="typeC">Type C</option>
            </select>

            @if (formValue().procedureType === 'typeA') {
              <input
                name="fieldA"
                [ngModel]="formValue().fieldA"
                data-testid="field-a"
              />
            }

            @if (formValue().procedureType === 'typeB') {
              <input
                name="fieldB"
                [ngModel]="formValue().fieldB"
                data-testid="field-b"
              />
            }

            @if (formValue().procedureType === 'typeC') {
              <p data-testid="info-text">
                This procedure type requires no additional input fields. All
                necessary parameters will be configured automatically.
              </p>
            }
          </form>
        `,
      })
      class TestComponent {
        @ViewChild('vestForm') vestForm!: FormDirective<DynamicFormModel>;

        formValue = signal<DynamicFormModel>({});
        isValid = signal<boolean>(false);
        errors = signal<Record<string, string[]>>({});

        suite = dynamicFormValidationSuite;
        validationConfig = {
          procedureType: ['fieldA', 'fieldB'],
        } as const;
      }

      const fixture = TestBed.createComponent(TestComponent);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      // Start with typeA (requires fieldA input)
      const selectElement = fixture.nativeElement.querySelector(
        '[data-testid="procedure-type"]'
      );
      selectElement.value = 'typeA';
      selectElement.dispatchEvent(new Event('change'));

      component.formValue.update((v) => ({ ...v, procedureType: 'typeA' }));
      fixture.detectChanges();
      await fixture.whenStable();
      TestBed.flushEffects();
      await waitForValidation();

      // Trigger validation by focusing on fieldA
      const fieldA = fixture.nativeElement.querySelector(
        '[data-testid="field-a"]'
      );
      if (fieldA) {
        fieldA.focus();
        fieldA.blur();
        fixture.detectChanges();
        await fixture.whenStable();
        TestBed.flushEffects();
        await waitForValidation();
      }

      // Form should be invalid (fieldA is required but empty)
      // NOTE: This test may have timing issues in zoneless mode
      await fixture.whenStable();
      TestBed.flushEffects();
      await waitForValidation();
      expect(component.isValid()).toBe(false);
      expect(Object.keys(component.errors()).length).toBeGreaterThan(0);
      expect(
        fixture.nativeElement.querySelector('[data-testid="field-a"]')
      ).toBeTruthy();

      // Switch to typeC (shows paragraph, no input fields)
      selectElement.value = 'typeC';
      selectElement.dispatchEvent(new Event('change'));

      component.formValue.update((v) => ({ ...v, procedureType: 'typeC' }));
      fixture.detectChanges();
      await fixture.whenStable();
      TestBed.flushEffects();
      await waitForValidation();

      // Verify UI structure changed
      expect(
        fixture.nativeElement.querySelector('[data-testid="field-a"]')
      ).toBeFalsy();
      expect(
        fixture.nativeElement.querySelector('[data-testid="info-text"]')
      ).toBeTruthy();

      // Force validation refresh now that the structure changed
      component.vestForm.triggerFormValidation();
      fixture.detectChanges();
      await fixture.whenStable();
      TestBed.flushEffects();
      await waitForValidation();

      expect(component.isValid()).toBe(true);
      expect(component.errors()).toEqual({});
    });
  });

  describe('Solution with New API', () => {
    it('should update validation when using triggerFormValidation method', async () => {
      @Component({
        imports: [vestForms],
        template: `
          <form
            scVestForm
            #vestForm="scVestForm"
            [formValue]="formValue()"
            [suite]="suite"
            [validationConfig]="validationConfig"
            (formValueChange)="formValue.set($event)"
            (validChange)="isValid.set($event)"
            (errorsChange)="errors.set($event)"
          >
            <select name="procedureType" [ngModel]="formValue().procedureType">
              <option value="typeA">Type A</option>
              <option value="typeC">Type C</option>
            </select>

            @if (formValue().procedureType === 'typeA') {
              <input name="fieldA" [ngModel]="formValue().fieldA" />
            }

            @if (formValue().procedureType === 'typeC') {
              <p>No additional fields needed</p>
            }
          </form>
        `,
      })
      class TestComponent {
        @ViewChild('vestForm') vestForm!: FormDirective<DynamicFormModel>;

        formValue = signal<DynamicFormModel>({});
        isValid = signal<boolean>(false);
        errors = signal<Record<string, string[]>>({});

        suite = dynamicFormValidationSuite;
        validationConfig = {
          procedureType: ['fieldA'],
        } as const;
      }

      const fixture = TestBed.createComponent(TestComponent);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      // Reproduce the issue
      const selectElement = fixture.nativeElement.querySelector('select');
      selectElement.value = 'typeA';
      selectElement.dispatchEvent(new Event('change'));

      component.formValue.update((v) => ({ ...v, procedureType: 'typeA' }));
      fixture.detectChanges();
      await fixture.whenStable();
      TestBed.flushEffects();
      await waitForValidation();

      expect(component.isValid()).toBe(false);

      // Switch to typeC
      selectElement.value = 'typeC';
      selectElement.dispatchEvent(new Event('change'));

      component.formValue.update((v) => ({ ...v, procedureType: 'typeC' }));
      fixture.detectChanges();
      await fixture.whenStable();
      TestBed.flushEffects();
      await waitForValidation();

      // SOLUTION: Use the new triggerFormValidation method
      component.vestForm.triggerFormValidation();
      fixture.detectChanges();
      await fixture.whenStable();
      TestBed.flushEffects();
      await waitForValidation();
      // Test should now pass with the new API
      expect(component.isValid()).toBe(true);
    });
  });
});
