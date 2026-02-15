import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { enforce, omitWhen, only, staticSuite, test } from 'vest';
import { beforeEach, describe, expect, it } from 'vitest';
import { NgxVestForms } from '../exports';
import type { NgxDeepPartial } from '../utils/deep-partial';

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

type CascadeModel = NgxDeepPartial<{
  country: string;
  state: string;
  zipCode: string;
}>;

const cascadeSuite = staticSuite((model: CascadeModel, field?: string) => {
  only(field);

  test('country', 'Country is required', () => {
    enforce(model.country).isNotBlank();
  });

  omitWhen(!model.country, () => {
    test('state', 'State/Province is required', () => {
      enforce(model.state).isNotBlank();
    });

    test('zipCode', 'Postal code is required', () => {
      enforce(model.zipCode).isNotBlank();
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
      <ngx-control-wrapper>
        <label for="country">Country</label>
        <select id="country" name="country" [ngModel]="formValue().country">
          <option value="">Select country...</option>
          <option value="US">United States</option>
          <option value="CA">Canada</option>
        </select>
      </ngx-control-wrapper>

      <ngx-control-wrapper>
        <label for="state">State/Province</label>
        <input id="state" name="state" [ngModel]="formValue().state" />
      </ngx-control-wrapper>

      <ngx-control-wrapper>
        <label for="zipCode">Postal Code</label>
        <input id="zipCode" name="zipCode" [ngModel]="formValue().zipCode" />
      </ngx-control-wrapper>
    </form>
  `,
})
class CascadeValidationConfigComponent {
  readonly formValue = signal<CascadeModel>({});
  readonly suite = cascadeSuite;
  readonly validationConfig = {
    country: ['state', 'zipCode'],
  };
}

type DateModel = NgxDeepPartial<{
  startDate: string;
  endDate: string;
}>;

const dateSuite = staticSuite((model: DateModel, field?: string) => {
  only(field);

  test('startDate', 'Start date is required', () => {
    enforce(model.startDate).isNotEmpty();
  });

  test('endDate', 'End date is required', () => {
    enforce(model.endDate).isNotEmpty();
  });

  omitWhen(!model.startDate || !model.endDate, () => {
    test('endDate', 'End date must be after start date', () => {
      if (!model.startDate || !model.endDate) return;
      const start = new Date(model.startDate);
      const end = new Date(model.endDate);
      enforce(end.getTime()).greaterThan(start.getTime());
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
      <ngx-control-wrapper>
        <label for="startDate">Start Date</label>
        <input
          id="startDate"
          name="startDate"
          [ngModel]="formValue().startDate"
        />
      </ngx-control-wrapper>

      <ngx-control-wrapper>
        <label for="endDate">End Date</label>
        <input id="endDate" name="endDate" [ngModel]="formValue().endDate" />
      </ngx-control-wrapper>
    </form>
  `,
})
class DateValidationConfigComponent {
  readonly formValue = signal<DateModel>({});
  readonly suite = dateSuite;
  readonly validationConfig = {
    startDate: ['endDate'],
    endDate: ['startDate'],
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
    checkbox.dispatchEvent(new Event('blur')); // Mark as touched
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    // Wait for reason field to be visible
    await expect
      .poll(
        () => {
          fixture.detectChanges();
          reasonTextarea = fixture.nativeElement.querySelector(
            '#reason'
          ) as HTMLTextAreaElement;
          return reasonTextarea;
        },
        { timeout: 2000, interval: 100 }
      )
      .not.toBeNull();

    if (!reasonTextarea) {
      throw new Error('reasonTextarea should be visible');
    }
    // Capture the non-null element for use in closures
    const visibleReasonTextarea = reasonTextarea;

    await expect
      .poll(() => visibleReasonTextarea.classList.contains('ng-invalid'), {
        timeout: 2000,
        interval: 100,
      })
      .toBe(true);
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    // Get error display element (errors are shown in a region with role="status")
    const errorDisplay = visibleReasonTextarea.closest('ngx-control-wrapper');
    const errorContainer = errorDisplay?.querySelector(
      '[role="status"][aria-live]'
    );

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

    // Wait for reason field to be visible
    let reasonTextarea: HTMLTextAreaElement | null = null;
    await expect
      .poll(
        () => {
          fixture.detectChanges();
          reasonTextarea = fixture.nativeElement.querySelector(
            '#reason'
          ) as HTMLTextAreaElement;
          return reasonTextarea;
        },
        { timeout: 2000, interval: 100 }
      )
      .not.toBeNull();

    if (!reasonTextarea) {
      throw new Error('reasonTextarea should be visible');
    }
    const visibleReasonTextarea = reasonTextarea as HTMLTextAreaElement;

    await expect
      .poll(() => visibleReasonTextarea.classList.contains('ng-invalid'), {
        timeout: 2000,
        interval: 100,
      })
      .toBe(true);
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();
    let errorDisplay = visibleReasonTextarea.closest('ngx-control-wrapper');
    let errorContainer = errorDisplay?.querySelector(
      '[role="status"][aria-live]'
    );
    let errorUl = errorContainer?.querySelector('ul');
    expect(errorUl?.textContent?.trim() || '').toBe('');

    // Submit form without touching reason field
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    // NOW errors should appear because form was submitted
    await expect
      .poll(
        () => {
          errorDisplay = visibleReasonTextarea.closest('ngx-control-wrapper');
          errorContainer = errorDisplay?.querySelector(
            '[role="status"][aria-live]'
          );
          errorUl = errorContainer?.querySelector('ul');
          return errorUl?.textContent?.includes('Reason is required') ?? false;
        },
        { timeout: 2000, interval: 100 }
      )
      .toBe(true);
  });

  it('should not require state/zip before country selection and should require them after country selection', async () => {
    const fixture = TestBed.createComponent(CascadeValidationConfigComponent);
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    const country = fixture.nativeElement.querySelector(
      '#country'
    ) as HTMLSelectElement;
    const state = fixture.nativeElement.querySelector(
      '#state'
    ) as HTMLInputElement;
    const zipCode = fixture.nativeElement.querySelector(
      '#zipCode'
    ) as HTMLInputElement;
    const stateWrapper = state.closest('ngx-control-wrapper');
    const zipWrapper = zipCode.closest('ngx-control-wrapper');

    // Before country selected: state/zip should not show required errors
    state.focus();
    state.dispatchEvent(new Event('blur'));
    zipCode.focus();
    zipCode.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(
      stateWrapper?.textContent?.includes('State/Province is required') ?? false
    ).toBe(false);
    expect(
      zipWrapper?.textContent?.includes('Postal code is required') ?? false
    ).toBe(false);

    // Select country and blur dependent fields -> now they should be required/invalid
    country.value = 'US';
    country.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    state.focus();
    state.dispatchEvent(new Event('blur'));
    zipCode.focus();
    zipCode.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    await expect
      .poll(
        () =>
          stateWrapper?.textContent?.includes('State/Province is required') ??
          false,
        {
          timeout: 2000,
          interval: 100,
        }
      )
      .toBe(true);

    await expect
      .poll(
        () =>
          zipWrapper?.textContent?.includes('Postal code is required') ?? false,
        {
          timeout: 2000,
          interval: 100,
        }
      )
      .toBe(true);
  });

  it('should show relevant required error when one date is cleared after an ordering error', async () => {
    const fixture = TestBed.createComponent(DateValidationConfigComponent);
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    const startDate = fixture.nativeElement.querySelector(
      '#startDate'
    ) as HTMLInputElement;
    const endDate = fixture.nativeElement.querySelector(
      '#endDate'
    ) as HTMLInputElement;

    // Create ordering error first (end before start)
    startDate.value = '2025-01-20';
    startDate.dispatchEvent(new Event('input'));
    startDate.dispatchEvent(new Event('change'));
    startDate.dispatchEvent(new Event('blur'));

    endDate.value = '2025-01-10';
    endDate.dispatchEvent(new Event('input'));
    endDate.dispatchEvent(new Event('change'));
    endDate.dispatchEvent(new Event('blur'));

    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    await expect
      .poll(() => {
        const wrapper = endDate.closest('ngx-control-wrapper');
        return (
          wrapper?.textContent?.includes('End date must be after start date') ??
          false
        );
      })
      .toBe(true);

    // Clear start date: relevant required error should be shown
    startDate.value = '';
    startDate.dispatchEvent(new Event('input'));
    startDate.dispatchEvent(new Event('change'));
    startDate.dispatchEvent(new Event('blur'));
    endDate.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    await expect
      .poll(() => {
        const wrapper = startDate.closest('ngx-control-wrapper');
        return (
          wrapper?.textContent?.includes('Start date is required') ?? false
        );
      })
      .toBe(true);
  });
});
