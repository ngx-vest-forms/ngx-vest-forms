import { Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxVestForms } from 'ngx-vest-forms';
import { vi } from 'vitest';
import { PhoneNumbersComponent } from './phonenumbers.component';

@Component({
  imports: [PhoneNumbersComponent, NgxVestForms],
  template: `
    <form
      ngxVestForm
      [formValue]="formValue()"
      (formValueChange)="formValue.set($event)"
    >
      <ngx-phonenumbers
        [values]="formValue().phonenumbers ?? {}"
        (valuesChange)="onPhoneNumbersChange($event)"
      />
    </form>
  `,
})
class TestWrapperComponent {
  readonly formValue = signal<{ phonenumbers?: Record<string, string> }>({});

  onPhoneNumbersChange(values: Record<string, string>): void {
    this.formValue.update((current) => ({ ...current, phonenumbers: values }));
  }
}

/** Holds the list itself, so removals are applied without a form model. */
@Component({
  imports: [PhoneNumbersComponent, NgxVestForms],
  template: `
    <form ngxVestForm>
      <ngx-phonenumbers
        [values]="phones()"
        (valuesChange)="phones.set($event)"
      />
    </form>
  `,
})
class RemovalHostComponent {
  readonly phones = signal<Record<string, string>>({});
}

describe('PhoneNumbersComponent', () => {
  let fixture: ComponentFixture<TestWrapperComponent>;
  let component: TestWrapperComponent;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestWrapperComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestWrapperComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should render empty phone numbers list', () => {
    const addInput = compiled.querySelector(
      'input[aria-label="Add new phone number"]'
    ) as HTMLInputElement;
    expect(addInput).toBeTruthy();
    expect(addInput.placeholder).toBe('Type phone number');

    const addButton = Array.from(compiled.querySelectorAll('button')).find(
      (btn) => btn.textContent?.trim() === 'Add'
    );
    expect(addButton).toBeTruthy();
  });

  it('should render existing phone numbers', () => {
    // Set initial values
    component.formValue.set({
      phonenumbers: {
        '0': '+1234567890',
        '1': '+0987654321',
      },
    });
    fixture.detectChanges();

    const phoneInputs = compiled.querySelectorAll(
      'input[placeholder="Type phone number"]'
    );
    // Should have 2 phone inputs + 1 add input
    expect(phoneInputs.length).toBe(3);

    const removeButtons = Array.from(
      compiled.querySelectorAll('button')
    ).filter((btn) => btn.textContent?.trim() === 'Remove');
    expect(removeButtons.length).toBe(2);
  });

  it('should render phone numbers in numeric key order past ten entries', () => {
    // keyvalue sorts string keys, which would render '10' before '2'.
    const phonenumbers = Object.fromEntries(
      Array.from({ length: 11 }, (_, index) => [String(index), `+${index}`])
    );
    component.formValue.set({ phonenumbers });
    fixture.detectChanges();

    const labels = Array.from(
      compiled.querySelectorAll('input[aria-label^="Phone number "]')
    ).map((input) => input.getAttribute('aria-label'));
    expect(labels).toEqual(
      Array.from({ length: 11 }, (_, index) => `Phone number ${index + 1}`)
    );
  });

  it('should emit new values when adding a phone number', () => {
    const valueSpy = vi.fn();
    component.onPhoneNumbersChange = valueSpy;

    // Set initial value
    component.formValue.set({ phonenumbers: { '0': '+1234567890' } });
    fixture.detectChanges();

    // Get the phonenumbers component
    const phonenumbersDebug = fixture.debugElement.query(
      (el) => el.componentInstance instanceof PhoneNumbersComponent
    );
    const phonenumbersComponent =
      phonenumbersDebug?.componentInstance as PhoneNumbersComponent;

    // Set the new phone number value
    phonenumbersComponent.newPhoneNumber.set('+9999999999');

    // Click add button
    const addButton = Array.from(compiled.querySelectorAll('button')).find(
      (btn) => btn.textContent?.trim() === 'Add'
    ) as HTMLButtonElement;
    addButton.click();
    fixture.detectChanges();

    // Should emit new values with added phone number
    expect(valueSpy).toHaveBeenCalledWith({
      '0': '+1234567890',
      '1': '+9999999999',
    });

    // Should reset the add input
    expect(phonenumbersComponent.newPhoneNumber()).toBe('');
  });

  it('should emit new values when removing a phone number', () => {
    const valueSpy = vi.fn();
    component.onPhoneNumbersChange = valueSpy;

    // Set initial values
    component.formValue.set({
      phonenumbers: {
        '0': '+1234567890',
        '1': '+0987654321',
        '2': '+5555555555',
      },
    });
    fixture.detectChanges();

    // Click the second remove button (index 1)
    const removeButtons = Array.from(
      compiled.querySelectorAll('button')
    ).filter((btn) => btn.textContent?.trim() === 'Remove');
    (removeButtons[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    // Should emit new values without the removed number (re-indexed)
    expect(valueSpy).toHaveBeenCalledWith({
      '0': '+1234567890',
      '1': '+5555555555',
    });
  });

  it('should not add empty phone numbers', () => {
    const valueSpy = vi.fn();
    component.onPhoneNumbersChange = valueSpy;

    // Set initial value
    component.formValue.set({ phonenumbers: { '0': '+1234567890' } });
    fixture.detectChanges();

    // Get the phonenumbers component
    const phonenumbersDebug = fixture.debugElement.query(
      (el) => el.componentInstance instanceof PhoneNumbersComponent
    );
    const phonenumbersComponent =
      phonenumbersDebug?.componentInstance as PhoneNumbersComponent;

    // Set empty string
    phonenumbersComponent.newPhoneNumber.set('');

    // Click add button
    const addButton = Array.from(compiled.querySelectorAll('button')).find(
      (btn) => btn.textContent?.trim() === 'Add'
    ) as HTMLButtonElement;
    addButton.click();
    fixture.detectChanges();

    // Should NOT emit when value is empty (early return)
    expect(valueSpy).not.toHaveBeenCalled();
  });

  it('should trim whitespace when adding phone numbers', () => {
    const valueSpy = vi.fn();
    component.onPhoneNumbersChange = valueSpy;

    // Set initial value
    component.formValue.set({ phonenumbers: { '0': '+1234567890' } });
    fixture.detectChanges();

    // Get the phonenumbers component
    const phonenumbersDebug = fixture.debugElement.query(
      (el) => el.componentInstance instanceof PhoneNumbersComponent
    );
    const phonenumbersComponent =
      phonenumbersDebug?.componentInstance as PhoneNumbersComponent;

    // Set value with whitespace
    phonenumbersComponent.newPhoneNumber.set('  +9999999999  ');

    // Click add button
    const addButton = Array.from(compiled.querySelectorAll('button')).find(
      (btn) => btn.textContent?.trim() === 'Add'
    ) as HTMLButtonElement;
    addButton.click();
    fixture.detectChanges();

    // Should emit with trimmed value
    expect(valueSpy).toHaveBeenCalledWith({
      '0': '+1234567890',
      '1': '+9999999999',
    });
  });

  it('should maintain correct indices after removal', () => {
    const valueSpy = vi.fn();
    component.onPhoneNumbersChange = valueSpy;

    // Set initial values
    component.formValue.set({
      phonenumbers: {
        '0': 'First',
        '1': 'Second',
        '2': 'Third',
      },
    });
    fixture.detectChanges();

    // Remove the middle item
    const removeButtons = Array.from(
      compiled.querySelectorAll('button')
    ).filter((btn) => btn.textContent?.trim() === 'Remove');
    (removeButtons[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    // Should re-index: First becomes 0, Third becomes 1
    expect(valueSpy).toHaveBeenCalledWith({
      '0': 'First',
      '1': 'Third',
    });
  });

  it('should handle removing last phone number', () => {
    const valueSpy = vi.fn();
    component.onPhoneNumbersChange = valueSpy;

    // Set initial value
    component.formValue.set({ phonenumbers: { '0': '+1234567890' } });
    fixture.detectChanges();

    // Remove the only phone number
    const removeButton = Array.from(compiled.querySelectorAll('button')).find(
      (btn) => btn.textContent?.trim() === 'Remove'
    ) as HTMLButtonElement;
    removeButton.click();
    fixture.detectChanges();

    // Should emit empty object
    expect(valueSpy).toHaveBeenCalledWith({});
  });

  describe('after a removal', () => {
    let removalFixture: ComponentFixture<RemovalHostComponent>;
    let host: HTMLElement;

    const removeButton = (position: number) =>
      host.querySelector<HTMLButtonElement>(
        `button[aria-label="Remove phone number ${position}"]`
      );
    const status = () =>
      host.querySelector('p.sr-only[role="status"]')?.textContent?.trim();
    const setPhones = (phones: Record<string, string>) => {
      removalFixture.componentInstance.phones.set(phones);
      removalFixture.detectChanges();
    };

    beforeEach(() => {
      removalFixture = TestBed.createComponent(RemovalHostComponent);
      host = removalFixture.nativeElement;
      // Focus only moves between elements that are in the document.
      document.body.append(host);
      setPhones({ '0': 'First', '1': 'Second', '2': 'Third' });
    });

    afterEach(() => host.remove());

    it('keeps focus on the Remove button at the same position', async () => {
      removeButton(1)?.focus();
      removeButton(1)?.click();
      await removalFixture.whenStable();

      expect(host.querySelectorAll('[data-row-remove]')).toHaveLength(2);
      expect(document.activeElement).toBe(removeButton(1));
    });

    it('moves focus to the previous Remove button after removing the last row', async () => {
      removeButton(3)?.click();
      await removalFixture.whenStable();

      expect(document.activeElement).toBe(removeButton(2));
    });

    it('moves focus to the add input when no rows are left', async () => {
      setPhones({ '0': 'Only' });

      removeButton(1)?.click();
      await removalFixture.whenStable();

      expect(document.activeElement).toBe(
        host.querySelector('input[aria-label="Add new phone number"]')
      );
    });

    it('announces a second removal at the same position, then clears', async () => {
      vi.useFakeTimers();
      try {
        removeButton(1)?.click();
        await vi.advanceTimersByTimeAsync(100);
        removalFixture.detectChanges();
        expect(status()).toBe('Phone number 1 removed');

        removeButton(1)?.click();
        removalFixture.detectChanges();
        // The region is emptied first, so the repeated text is a new change.
        expect(status()).toBe('');
        await vi.advanceTimersByTimeAsync(100);
        removalFixture.detectChanges();
        expect(status()).toBe('Phone number 1 removed');

        await vi.advanceTimersByTimeAsync(5000);
        removalFixture.detectChanges();
        expect(status()).toBe('');
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
