import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { staticSuite, only, omitWhen, test, enforce } from 'vest';
import { NgxVestForms } from '../exports';
import type { NgxDeepPartial } from '../utils/deep-partial';

// Debounce wait time for validationConfig (same as used in validation-config.spec.ts)
const TEST_DEBOUNCE_WAIT_TIME = 150;

type TestModel = NgxDeepPartial<{ flag: boolean; reason: string }>;

const testSuite = staticSuite((model: TestModel, field?: string) => {
  only(field);
  omitWhen(!model.flag, () => {
    test('reason', 'Reason is required', () => {
      enforce(model.reason).isNotBlank();
    });
  });
});

@Component({
  imports: [NgxVestForms],
  template: `
    <form
      ngxVestForm
      [suite]="suite"
      [formValue]="formValue()"
      [validationConfig]="validationConfig"
      (formValueChange)="formValue.set($event)"
    >
      <input
        type="checkbox"
        id="flag"
        name="flag"
        [ngModel]="formValue().flag"
      />

      @if (formValue().flag) {
        <ngx-control-wrapper>
          <label for="reason">Reason</label>
          <textarea
            id="reason"
            name="reason"
            [ngModel]="formValue().reason"
          ></textarea>
        </ngx-control-wrapper>
      }
    </form>
  `,
})
class TestComponent {
  readonly formValue = signal<TestModel>({});
  readonly suite = testSuite;
  readonly validationConfig = {
    flag: ['reason'],
  };
}

describe('ValidationConfig Error Display', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent],
    }).compileComponents();
  });

  it('should NOT show errors immediately on conditionally revealed field with on-blur-or-submit mode', async () => {
    // This test demonstrates the issue: when a checkbox is clicked (touched),
    // and it reveals a required field via @if, the newly revealed field
    // immediately shows errors even though it was never touched/blurred by the user.
    //
    // Expected behavior: Errors should only appear after the reason field is blurred
    // or the form is submitted, NOT immediately when it appears.

    const fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    // Get checkbox
    const checkbox = fixture.nativeElement.querySelector(
      '#flag'
    ) as HTMLInputElement;

    // Initially, reason field should not be visible
    let reasonTextarea = fixture.nativeElement.querySelector(
      '#reason'
    ) as HTMLTextAreaElement | null;
    expect(reasonTextarea).toBeNull();

    // Click checkbox to reveal reason field (this marks checkbox as touched via blur)
    checkbox.focus();
    checkbox.click();
    checkbox.dispatchEvent(new Event('blur'));  // Mark as touched
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    // Wait for validationConfig debounce
    await new Promise((resolve) => setTimeout(resolve, TEST_DEBOUNCE_WAIT_TIME));
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    // Now reason field should be visible
    reasonTextarea = fixture.nativeElement.querySelector(
      '#reason'
    ) as HTMLTextAreaElement;
    expect(reasonTextarea).not.toBeNull();

    // Get error display element (errors are shown in a div with role="status")
    const errorDisplay = reasonTextarea?.closest('ngx-control-wrapper');
    const errorContainer = errorDisplay?.querySelector('[role="status"].text-red-600');
    const errorUl = errorContainer?.querySelector('ul');

    // ✅ EXPECTED BEHAVIOR (after fix): No errors yet
    // The reason field should NOT show errors because:
    // 1. The field was never blurred (user never interacted with it directly)
    // 2. Touch is NOT propagated from checkbox via validationConfig
    // 3. errorDisplayMode is 'on-blur-or-submit' (default)
    const errorsBefore = errorUl?.textContent?.trim() || '';
    expect(errorsBefore).toBe('');
    
    // Verify reason field is untouched (no touch propagation)
    expect(reasonTextarea.classList.contains('ng-untouched')).toBe(true);
    
    // But it should be invalid (validation ran)
    expect(reasonTextarea.classList.contains('ng-invalid')).toBe(true);

    // Now blur the reason field (user interaction)
    reasonTextarea.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    // NOW errors should appear because field was blurred by user
    const errorUlAfterBlur = errorContainer?.querySelector('ul');
    const errorsAfter = errorUlAfterBlur?.textContent?.trim() || '';
    expect(errorsAfter).toContain('Reason is required');
    
    // Verify reason field is now touched
    expect(reasonTextarea.classList.contains('ng-touched')).toBe(true);
  });

  it('should show errors after form submit even if field was not touched', async () => {
    const fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    // Click checkbox to reveal reason field
    const checkbox = fixture.nativeElement.querySelector(
      '#flag'
    ) as HTMLInputElement;
    checkbox.click();
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    // Wait for validationConfig debounce
    await new Promise((resolve) => setTimeout(resolve, 200));
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    // Reason field visible but no errors yet
    const reasonTextarea = fixture.nativeElement.querySelector(
      '#reason'
    ) as HTMLTextAreaElement;
    let errorDisplay = reasonTextarea?.closest('ngx-control-wrapper');
    let errorContainer = errorDisplay?.querySelector('[role="status"].text-red-600');
    let errorUl = errorContainer?.querySelector('ul');
    expect(errorUl?.textContent?.trim() || '').toBe('');

    // Submit form without touching reason field
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    // NOW errors should appear because form was submitted
    errorDisplay = reasonTextarea?.closest('ngx-control-wrapper');
    errorContainer = errorDisplay?.querySelector('[role="status"].text-red-600');
    errorUl = errorContainer?.querySelector('ul');
    expect(errorUl?.textContent).toContain('Reason is required');
  });
});
