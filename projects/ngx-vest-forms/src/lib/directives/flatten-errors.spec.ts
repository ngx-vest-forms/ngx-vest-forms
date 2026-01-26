import { Component, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, NgModel } from '@angular/forms';
import { beforeEach, describe, expect, it } from 'vitest';
import { FormControlStateDirective } from './form-control-state.directive';

/**
 * Test suite specifically for the #flattenAngularErrors bug fix.
 * Tests the scenario where errors() signal returns array indices instead of error messages.
 */

@Component({
  imports: [FormsModule, FormControlStateDirective],
  template: `
    <div formControlState #state="formControlState">
      <input name="test" [(ngModel)]="model" #ngModelRef="ngModel" />
      <div id="error-messages">{{ state.errorMessages().join(',') }}</div>
      <div id="warning-messages">{{ state.warningMessages().join(',') }}</div>
    </div>
  `,
})
class TestErrorFlatteningComponent {
  model = '';
  readonly ngModelRef = viewChild<NgModel>('ngModelRef');
  readonly state = viewChild<FormControlStateDirective>('state');
}

describe('FormControlStateDirective - #flattenAngularErrors bug fix', () => {
  let fixture: ComponentFixture<TestErrorFlatteningComponent>;
  let component: TestErrorFlatteningComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestErrorFlatteningComponent, FormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(TestErrorFlatteningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should return actual warning messages, not array indices', async () => {
    // Simulate the bug scenario: control has only warnings (no errors)
    // This mimics what happens with Vest validation when only warn() tests exist
    const mockErrors = {
      warnings: ['Password is weak', 'Should be longer than 12 characters'],
    };

    const ngModel = component.ngModelRef();
    if (!ngModel) throw new Error('NgModel not found');

    ngModel.control.setErrors(mockErrors);
    fixture.detectChanges();
    await fixture.whenStable();

    const warningEl = fixture.nativeElement.querySelector('#warning-messages');
    const warningText = warningEl.textContent || '';

    // Should extract the actual warning messages
    expect(warningText).toContain('Password is weak');
    expect(warningText).toContain('Should be longer than 12 characters');

    // Should NOT return array indices
    // The bug would produce only numeric indices like "0,1"
    expect(warningText.trim()).not.toMatch(/^(\d+\s*,\s*)*\d+$/);
  });

  it('should handle nested array errors in errorMessages()', async () => {
    // Simulate control errors as nested arrays
    const mockErrors = {
      validationErrors: ['Error 1', 'Error 2', 'Error 3'],
    };

    const ngModel = component.ngModelRef();
    if (!ngModel) throw new Error('NgModel not found');

    ngModel.control.setErrors(mockErrors);
    fixture.detectChanges();
    await fixture.whenStable();

    const errorEl = fixture.nativeElement.querySelector('#error-messages');
    const errorText = errorEl.textContent || '';

    // Should flatten and return actual error messages
    expect(errorText).toContain('Error 1');
    expect(errorText).toContain('Error 2');
    expect(errorText).toContain('Error 3');

    // Should NOT return array indices
    expect(errorText.trim()).not.toMatch(/^(\d+\s*,\s*)*\d+$/);
  });

  it('should extract string values from error objects', async () => {
    // Test case where error values are strings directly
    const mockErrors = {
      customError: 'This is a custom error',
      anotherError: 'This is another error',
    };

    const ngModel = component.ngModelRef();
    if (!ngModel) throw new Error('NgModel not found');

    ngModel.control.setErrors(mockErrors);
    fixture.detectChanges();
    await fixture.whenStable();

    const errorEl = fixture.nativeElement.querySelector('#error-messages');
    const errorText = errorEl.textContent || '';

    // Should extract string values, not keys
    expect(errorText).toContain('This is a custom error');
    expect(errorText).toContain('This is another error');

    // Should NOT include the error keys
    expect(errorText).not.toContain('customError');
    expect(errorText).not.toContain('anotherError');
  });

  it('should extract message property from error objects', async () => {
    // Test case where errors have a 'message' property
    const mockErrors = {
      validation: { message: 'Validation failed with details' },
      custom: { message: 'Custom validation message' },
    };

    const ngModel = component.ngModelRef();
    if (!ngModel) throw new Error('NgModel not found');

    ngModel.control.setErrors(mockErrors);
    fixture.detectChanges();
    await fixture.whenStable();

    const errorEl = fixture.nativeElement.querySelector('#error-messages');
    const errorText = errorEl.textContent || '';

    // Should extract the 'message' property value
    expect(errorText).toContain('Validation failed with details');
    expect(errorText).toContain('Custom validation message');
  });

  it('should handle mixed error types', async () => {
    // Complex scenario with mixed error types
    const mockErrors = {
      stringError: 'Direct string error',
      arrayErrors: ['Array error 1', 'Array error 2'],
      objectError: { message: 'Object with message' },
      nestedWarnings: {
        warnings: ['Nested warning 1', 'Nested warning 2'],
      },
    };

    const ngModel = component.ngModelRef();
    if (!ngModel) throw new Error('NgModel not found');

    ngModel.control.setErrors(mockErrors);
    fixture.detectChanges();
    await fixture.whenStable();

    const errorEl = fixture.nativeElement.querySelector('#error-messages');
    const errorText = errorEl.textContent || '';

    // Should handle all types correctly
    expect(errorText).toContain('Direct string error');
    expect(errorText).toContain('Array error 1');
    expect(errorText).toContain('Array error 2');
    expect(errorText).toContain('Object with message');
    expect(errorText).toContain('Nested warning 1');
    expect(errorText).toContain('Nested warning 2');

    // Should NOT include keys or indices
    expect(errorText).not.toContain('stringError');
    expect(errorText).not.toContain('arrayErrors');
    expect(errorText.trim()).not.toMatch(/^(\d+\s*,\s*)*\d+$/);
  });

  it('should maintain backward compatibility with primitive error keys', async () => {
    // Test backward compatibility: primitive values should fallback to key
    const mockErrors = {
      required: true,
      minlength: 5,
    };

    const ngModel = component.ngModelRef();
    if (!ngModel) throw new Error('NgModel not found');

    ngModel.control.setErrors(mockErrors);
    fixture.detectChanges();
    await fixture.whenStable();

    const errorEl = fixture.nativeElement.querySelector('#error-messages');
    const errorText = errorEl.textContent || '';

    // Should fallback to keys for non-string primitives (backward compatibility)
    expect(errorText).toContain('required');
    expect(errorText).toContain('minlength');
  });

  it('should normalize non-string vest errors in errors array', async () => {
    // Simulate Vest-style errors array containing objects
    const mockErrors = {
      errors: [
        { message: 'Object error message' },
        { code: 'ERR_CUSTOM', detail: 'Custom details' },
        123,
      ],
    };

    const ngModel = component.ngModelRef();
    if (!ngModel) throw new Error('NgModel not found');

    ngModel.control.setErrors(mockErrors);
    fixture.detectChanges();
    await fixture.whenStable();

    const errorEl = fixture.nativeElement.querySelector('#error-messages');
    const errorText = errorEl.textContent || '';

    // Should extract message for objects with message
    expect(errorText).toContain('Object error message');
    // Should stringify other objects
    expect(errorText).toContain('"code":"ERR_CUSTOM"');
    // Should stringify primitives
    expect(errorText).toContain('123');
  });
});
