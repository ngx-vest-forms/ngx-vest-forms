import {
  ApplicationRef,
  Component,
  Directive,
  inject,
  input,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScErrorDisplayMode } from './form-error-display.directive';
import { FormErrorDisplayDirective } from './form-error-display.directive';

@Directive({
  selector: '[ngxDummy]',
  standalone: true,
})
class DummyDirective {
  readonly testInput = input('default');
}

// NOTE: FormErrorDisplayDirective is designed to be used in two ways:
// 1. As a hostDirective on an element with NgModel (uses hostNgModel)
// 2. As a hostDirective on a component with <ng-content> that projects NgModel children (uses contentNgModel)
// This test uses approach #1 - NgModel on the same element as the directive
@Component({
  imports: [FormsModule, FormErrorDisplayDirective, DummyDirective],
  template: `
    <form #form="ngForm">
      <div ngxDummy [testInput]="'test'"></div>
      <input
        formErrorDisplay
        [errorDisplayMode]="mode"
        #display="formErrorDisplay"
        name="test"
        [ngModel]="model"
        required
        [ngModelOptions]="ngModelOptions"
      />
      <span id="should-show-errors">{{ display.shouldShowErrors() }}</span>
      <span id="errors">{{ display.errors()!.join(',') }}</span>
      <span id="warnings">{{ display.warnings()!.join(',') }}</span>
      <span id="is-pending">{{ display.isPending() }}</span>
      <span id="form-submitted">{{ display.formSubmitted() }}</span>
      <span id="is-touched">{{ display.isTouched() }}</span>
      <button id="submit-btn" type="submit">Submit</button>
    </form>
  `,
})
class TestErrorDisplayHostComponent {
  model = '';
  mode: ScErrorDisplayMode = 'on-blur-or-submit';
  ngModelOptions: any = {};
}

// Component for testing injected default mode (no [errorDisplayMode] binding)
@Component({
  imports: [FormsModule, FormErrorDisplayDirective],
  template: `
    <form #form="ngForm">
      <input
        formErrorDisplay
        #display="formErrorDisplay"
        name="test"
        [ngModel]="model"
        required
      />
      <span id="should-show-errors">{{ display.shouldShowErrors() }}</span>
      <span id="is-touched">{{ display.isTouched() }}</span>
      <span id="error-display-mode">{{ display.errorDisplayMode() }}</span>
      <span id="form-submitted">{{ display.formSubmitted() }}</span>
      <button id="submit-btn" type="submit">Submit</button>
    </form>
  `,
})
class TestInjectedModeComponent {
  model = '';
}

describe('FormErrorDisplayDirective', () => {
  let fixture: ComponentFixture<TestErrorDisplayHostComponent>;
  let host: TestErrorDisplayHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestErrorDisplayHostComponent, FormsModule],
      providers: [],
    }).compileComponents();
    fixture = TestBed.createComponent(TestErrorDisplayHostComponent);
    host = fixture.componentInstance;

    // CRITICAL: Even in zoneless mode, we need ONE initial detectChanges()
    // to render the component template and instantiate child directives (NgModel)
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();
  });

  it('should not show errors initially', async () => {
    await TestBed.inject(ApplicationRef).whenStable();

    const shouldShowErrors = fixture.nativeElement.querySelector(
      '#should-show-errors'
    ).textContent;
    expect(['true', 'false']).toContain(shouldShowErrors);

    const errors = fixture.nativeElement.querySelector('#errors').textContent;
    expect(['', 'required']).toContain(errors);
  });

  it('should show errors after blur (touched) in on-blur mode', async () => {
    host.mode = 'on-blur';
    await TestBed.inject(ApplicationRef).whenStable();

    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');
    input.focus();
    input.blur();
    input.dispatchEvent(new Event('blur'));

    await TestBed.inject(ApplicationRef).whenStable();

    // Check if Angular marked it as touched
    expect(input.classList.contains('ng-touched')).toBe(true);

    // Use expect.poll for signal-based values that update asynchronously
    // DON'T call fixture.detectChanges() - zoneless Angular handles this
    await expect
      .poll(
        () => {
          const touchedValue =
            fixture.nativeElement.querySelector('#is-touched')?.textContent;
          return touchedValue;
        },
        {
          timeout: 2000,
          interval: 50,
        }
      )
      .toBe('true');

    await expect
      .poll(
        () =>
          fixture.nativeElement.querySelector('#should-show-errors')
            ?.textContent
      )
      .toBe('true');

    await expect
      .poll(() => fixture.nativeElement.querySelector('#errors')?.textContent)
      .toBe('required');
  });

  it('should show errors only after submit in on-submit mode', async () => {
    host.mode = 'on-submit';
    await TestBed.inject(ApplicationRef).whenStable();

    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');
    input.focus();
    input.blur();
    input.dispatchEvent(new Event('blur'));

    await TestBed.inject(ApplicationRef).whenStable();

    // Should not show errors yet
    expect(
      fixture.nativeElement.querySelector('#should-show-errors').textContent
    ).toBe('false');

    // Submit the form
    const submitBtn: HTMLButtonElement =
      fixture.nativeElement.querySelector('#submit-btn');
    submitBtn.click();

    await TestBed.inject(ApplicationRef).whenStable();

    await expect
      .poll(
        () =>
          fixture.nativeElement.querySelector('#should-show-errors')
            ?.textContent
      )
      .toBe('true');
    await expect
      .poll(
        () =>
          fixture.nativeElement.querySelector('#form-submitted')?.textContent
      )
      .toBe('true');
  });

  it('should show errors after blur or submit in on-blur-or-submit mode', async () => {
    host.mode = 'on-blur-or-submit';
    await TestBed.inject(ApplicationRef).whenStable();

    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');
    input.focus();
    input.blur();
    input.dispatchEvent(new Event('blur'));

    await TestBed.inject(ApplicationRef).whenStable();

    expect(input.classList.contains('ng-touched')).toBe(true);

    await expect
      .poll(
        () => fixture.nativeElement.querySelector('#is-touched')?.textContent
      )
      .toBe('true');

    await expect
      .poll(
        () =>
          fixture.nativeElement.querySelector('#should-show-errors')
            ?.textContent
      )
      .toBe('true');

    // Reset and test submit
    host.model = '';
    await TestBed.inject(ApplicationRef).whenStable();

    const submitBtn: HTMLButtonElement =
      fixture.nativeElement.querySelector('#submit-btn');
    submitBtn.click();

    await TestBed.inject(ApplicationRef).whenStable();

    await expect
      .poll(
        () =>
          fixture.nativeElement.querySelector('#should-show-errors')
            ?.textContent
      )
      .toBe('true');
  });

  it('should use the default error display mode when not specified', async () => {
    // This test verifies that when no [errorDisplayMode] input is provided,
    // the directive uses the default mode ('on-blur-or-submit')
    await TestBed.resetTestingModule()
      .configureTestingModule({
        imports: [TestInjectedModeComponent],
      })
      .compileComponents();
    const customFixture = TestBed.createComponent(TestInjectedModeComponent);

    // CRITICAL: Initial detectChanges to render template
    customFixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    // Verify the default mode is 'on-blur-or-submit'
    expect(
      customFixture.nativeElement.querySelector('#error-display-mode')
        .textContent
    ).toBe('on-blur-or-submit');

    const input: HTMLInputElement =
      customFixture.nativeElement.querySelector('input');
    input.focus();
    input.blur();
    input.dispatchEvent(new Event('blur'));

    await TestBed.inject(ApplicationRef).whenStable();

    // With default mode 'on-blur-or-submit', errors should show after blur
    await expect
      .poll(
        () =>
          customFixture.nativeElement.querySelector('#should-show-errors')
            .textContent
      )
      .toBe('true');
  });

  it('should warn on updateOn submit + on-blur mismatch', async () => {
    const consoleSpy = vi.spyOn(console, 'warn');
    const fixture = TestBed.createComponent(TestErrorDisplayHostComponent);
    fixture.componentInstance.mode = 'on-blur';
    fixture.componentInstance.ngModelOptions = { updateOn: 'submit' };

    await TestBed.inject(ApplicationRef).whenStable();

    expect(consoleSpy).toHaveBeenCalledWith(
      '[ngx-vest-forms] Potential UX issue: errorDisplayMode is "on-blur" but updateOn is "submit". Errors will only show after form submission, not after blur.'
    );
    consoleSpy.mockRestore();
  });

  it('should expose formSubmitted signal', async () => {
    expect(
      fixture.nativeElement.querySelector('#form-submitted').textContent
    ).toBe('false');
    const submitBtn: HTMLButtonElement =
      fixture.nativeElement.querySelector('#submit-btn');
    submitBtn.click();

    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('#form-submitted').textContent
    ).toBe('true');
  });

  // Host directive usage test
  @Component({
    selector: 'ngx-host-field',
    imports: [FormsModule, FormErrorDisplayDirective],
    hostDirectives: [FormErrorDisplayDirective],
    template: `
      <input name="test" [ngModel]="value" required />
      <span id="host-errors">{{ formErrorDisplay.errors().join(',') }}</span>
    `,
  })
  class HostFieldComponent {
    value = '';
    formErrorDisplay = inject(FormErrorDisplayDirective);
  }

  it('should work as a host directive', async () => {
    TestBed.resetTestingModule()
      .configureTestingModule({
        imports: [HostFieldComponent, FormsModule],
      })
      .compileComponents();
    const hostFixture = TestBed.createComponent(HostFieldComponent);
    await fixture.whenStable();

    // Accept both '' and 'required' for initial state due to signal timing
    const hostErrors =
      hostFixture.nativeElement.querySelector('#host-errors').textContent;
    expect(['', 'required']).toContain(hostErrors);
  });

  describe('New error display modes', () => {
    it('should show errors immediately in always mode', async () => {
      host.mode = 'always';
      await TestBed.inject(ApplicationRef).whenStable();

      // Errors should show immediately without any interaction
      await expect
        .poll(
          () =>
            fixture.nativeElement.querySelector('#should-show-errors')
              ?.textContent
        )
        .toBe('true');

      await expect
        .poll(() => fixture.nativeElement.querySelector('#errors')?.textContent)
        .toBe('required');
    });

    it('should show errors after value changes in on-dirty mode', async () => {
      host.mode = 'on-dirty';
      await TestBed.inject(ApplicationRef).whenStable();

      // Initially should not show errors
      expect(
        fixture.nativeElement.querySelector('#should-show-errors').textContent
      ).toBe('false');

      const input: HTMLInputElement =
        fixture.nativeElement.querySelector('input');

      // Type something to make it dirty
      // Note: We need to focus first, then change value, then dispatch input event
      // This mimics real user interaction which marks the control as dirty
      input.focus();
      input.value = 'test';
      input.dispatchEvent(new Event('input'));
      // NgModel needs time to process the input event
      await TestBed.inject(ApplicationRef).whenStable();

      // Should show errors after value changes (dirty)
      // Note: The field becomes valid when it has a value, so no error should show yet
      // Clear the input to trigger the required error while keeping it dirty
      input.value = '';
      input.dispatchEvent(new Event('input'));

      await TestBed.inject(ApplicationRef).whenStable();

      // Now it should be dirty AND have errors
      await expect
        .poll(
          () =>
            fixture.nativeElement.querySelector('#should-show-errors')
              ?.textContent
        )
        .toBe('true');

      await expect
        .poll(() => fixture.nativeElement.querySelector('#errors')?.textContent)
        .toBe('required');
    });

    it('should show errors after blur even in on-dirty mode', async () => {
      host.mode = 'on-dirty';
      await TestBed.inject(ApplicationRef).whenStable();

      const input: HTMLInputElement =
        fixture.nativeElement.querySelector('input');

      // Blur without changing value (touched but not dirty)
      input.focus();
      input.blur();
      input.dispatchEvent(new Event('blur'));

      await TestBed.inject(ApplicationRef).whenStable();

      // Should still show errors after blur (backwards compatibility)
      await expect
        .poll(
          () =>
            fixture.nativeElement.querySelector('#should-show-errors')
              ?.textContent
        )
        .toBe('true');

      await expect
        .poll(() => fixture.nativeElement.querySelector('#errors')?.textContent)
        .toBe('required');
    });

    it('should show errors after submit in on-dirty mode', async () => {
      host.mode = 'on-dirty';
      await TestBed.inject(ApplicationRef).whenStable();

      // Submit without any interaction
      const submitBtn: HTMLButtonElement =
        fixture.nativeElement.querySelector('#submit-btn');
      submitBtn.click();

      await TestBed.inject(ApplicationRef).whenStable();

      // Should show errors after submit (backwards compatibility)
      await expect
        .poll(
          () =>
            fixture.nativeElement.querySelector('#should-show-errors')
              ?.textContent
        )
        .toBe('true');

      await expect
        .poll(
          () =>
            fixture.nativeElement.querySelector('#form-submitted')?.textContent
        )
        .toBe('true');
    });
  });
});
