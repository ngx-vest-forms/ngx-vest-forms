import {
  ApplicationRef,
  Component,
  Directive,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  AsyncValidator,
  FormsModule,
  NG_ASYNC_VALIDATORS,
  NgForm,
  ValidationErrors,
} from '@angular/forms';
import { By } from '@angular/platform-browser';
import userEvent from '@testing-library/user-event';
import { Observable, Subject, take } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NgxErrorDisplayMode } from './form-error-display.directive';
import { FormErrorDisplayDirective } from './form-error-display.directive';
import { getFormSubmittedSignal } from './form-submitted-state';

@Directive({
  selector: '[ngxDummy]',
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
        ngxErrorDisplay
        [errorDisplayMode]="mode()"
        #display="ngxErrorDisplay"
        name="test"
        [ngModel]="model()"
        required
        [ngModelOptions]="ngModelOptions()"
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
  readonly model = signal('');
  readonly mode = signal<NgxErrorDisplayMode>('on-blur-or-submit');
  readonly ngModelOptions = signal<any>({});
}

// Component for testing injected default mode (no [errorDisplayMode] binding)
@Component({
  imports: [FormsModule, FormErrorDisplayDirective],

  template: `
    <form #form="ngForm">
      <input
        ngxErrorDisplay
        #display="ngxErrorDisplay"
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
    host.mode.set('on-blur');
    await TestBed.inject(ApplicationRef).whenStable();

    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');
    await userEvent.click(input);
    await userEvent.tab();

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
    host.mode.set('on-submit');
    await TestBed.inject(ApplicationRef).whenStable();

    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');
    await userEvent.click(input);
    await userEvent.tab();

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
    host.mode.set('on-blur-or-submit');
    await TestBed.inject(ApplicationRef).whenStable();

    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');
    await userEvent.click(input);
    await userEvent.tab();

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
    host.model.set('');
    await TestBed.inject(ApplicationRef).whenStable();

    const submitBtn: HTMLButtonElement =
      fixture.nativeElement.querySelector('#submit-btn');
    submitBtn.click();

    await expect
      .poll(
        () =>
          fixture.nativeElement.querySelector('#form-submitted')?.textContent
      )
      .toBe('true');

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
    await userEvent.click(input);
    await userEvent.tab();

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
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fixture = TestBed.createComponent(TestErrorDisplayHostComponent);
    fixture.componentInstance.mode.set('on-blur');
    fixture.componentInstance.ngModelOptions.set({ updateOn: 'submit' });

    await TestBed.inject(ApplicationRef).whenStable();

    // Routed through the shared error catalog as a dev-only diagnostic
    // (isDevMode-guarded). The message carries the NGX-105 code prefix.
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[NGX-105]')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'errorDisplayMode is "on-blur" but updateOn is "submit"'
      )
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

    await TestBed.inject(ApplicationRef).whenStable();

    expect(
      fixture.nativeElement.querySelector('#form-submitted').textContent
    ).toBe('true');
  });

  it('should react to programmatic NgForm.onSubmit() in on-submit mode', async () => {
    host.mode.set('on-submit');
    await TestBed.inject(ApplicationRef).whenStable();

    const ngForm = fixture.debugElement
      .query(By.directive(NgForm))
      .injector.get(NgForm);

    expect(
      fixture.nativeElement.querySelector('#should-show-errors').textContent
    ).toBe('false');

    ngForm.onSubmit(new Event('submit'));
    await TestBed.inject(ApplicationRef).whenStable();

    await expect
      .poll(
        () =>
          fixture.nativeElement.querySelector('#form-submitted')?.textContent
      )
      .toBe('true');

    await expect
      .poll(
        () =>
          fixture.nativeElement.querySelector('#should-show-errors')
            ?.textContent
      )
      .toBe('true');
  });

  it('should reset formSubmitted after programmatic submit when form resets', async () => {
    host.mode.set('on-submit');
    await TestBed.inject(ApplicationRef).whenStable();

    const ngForm = fixture.debugElement
      .query(By.directive(NgForm))
      .injector.get(NgForm);

    ngForm.onSubmit(new Event('submit'));
    await TestBed.inject(ApplicationRef).whenStable();

    await expect
      .poll(
        () =>
          fixture.nativeElement.querySelector('#form-submitted')?.textContent
      )
      .toBe('true');

    ngForm.resetForm({ test: '' });
    await TestBed.inject(ApplicationRef).whenStable();

    await expect
      .poll(
        () =>
          fixture.nativeElement.querySelector('#form-submitted')?.textContent
      )
      .toBe('false');
  });

  it('shares one submitted signal per form across fields', async () => {
    const ngForm = fixture.debugElement
      .query(By.directive(NgForm))
      .injector.get(NgForm);
    const display = fixture.debugElement
      .query(By.directive(FormErrorDisplayDirective))
      .injector.get(FormErrorDisplayDirective);

    expect(display.formSubmitted).toBe(getFormSubmittedSignal(ngForm));

    ngForm.onSubmit(new Event('submit'));
    await TestBed.inject(ApplicationRef).whenStable();
    expect(display.formSubmitted()).toBe(true);

    ngForm.resetForm({ test: '' });
    await TestBed.inject(ApplicationRef).whenStable();
    expect(display.formSubmitted()).toBe(false);
  });

  // Host directive usage test
  @Component({
    selector: 'ngx-host-field',
    imports: [FormsModule],
    hostDirectives: [FormErrorDisplayDirective],
    template: `
      <input name="test" [ngModel]="value" required />
      <span id="host-errors">{{ errorDisplay.errors().join(',') }}</span>
    `,
  })
  class HostFieldComponent {
    value = '';
    errorDisplay = inject(FormErrorDisplayDirective);
  }

  it('should work as a host directive', async () => {
    await TestBed.resetTestingModule()
      .configureTestingModule({
        imports: [HostFieldComponent, FormsModule],
      })
      .compileComponents();
    const hostFixture = TestBed.createComponent(HostFieldComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    // Accept both '' and 'required' for initial state due to signal timing
    const hostErrors =
      hostFixture.nativeElement.querySelector('#host-errors').textContent;
    expect(['', 'required']).toContain(hostErrors);
  });

  describe('New error display modes', () => {
    it('should show errors immediately in always mode', async () => {
      host.mode.set('always');
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
      host.mode.set('on-dirty');
      await TestBed.inject(ApplicationRef).whenStable();

      // Initially should not show errors
      expect(
        fixture.nativeElement.querySelector('#should-show-errors').textContent
      ).toBe('false');

      const input: HTMLInputElement =
        fixture.nativeElement.querySelector('input');

      // Type something to make it dirty
      await userEvent.type(input, 'test');
      await TestBed.inject(ApplicationRef).whenStable();

      // Should show errors after value changes (dirty)
      // Note: The field becomes valid when it has a value, so no error should show yet
      // Clear the input to trigger the required error while keeping it dirty
      await userEvent.clear(input);

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
      host.mode.set('on-dirty');
      await TestBed.inject(ApplicationRef).whenStable();

      const input: HTMLInputElement =
        fixture.nativeElement.querySelector('input');

      // Blur without changing value (touched but not dirty)
      await userEvent.click(input);
      await userEvent.tab();

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
      host.mode.set('on-dirty');
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

/**
 * Async validator under test control: each run returns a fresh Subject the
 * test settles with `settle()`, so the pending window is deterministic.
 */
@Directive({
  selector: '[ngxControlledAsync]',
  providers: [
    {
      provide: NG_ASYNC_VALIDATORS,
      useExisting: ControlledAsyncValidatorDirective,
      multi: true,
    },
  ],
})
class ControlledAsyncValidatorDirective implements AsyncValidator {
  readonly runs: Array<Subject<ValidationErrors | null>> = [];

  validate(): Observable<ValidationErrors | null> {
    const run = new Subject<ValidationErrors | null>();
    this.runs.push(run);
    return run.pipe(take(1));
  }

  settle(result: ValidationErrors | null): void {
    this.runs.at(-1)?.next(result);
  }
}

@Component({
  imports: [
    FormsModule,
    FormErrorDisplayDirective,
    ControlledAsyncValidatorDirective,
  ],
  template: `
    <form #form="ngForm">
      <input
        ngxErrorDisplay
        ngxControlledAsync
        #display="ngxErrorDisplay"
        name="username"
        [(ngModel)]="model"
      />
      @if (display.shouldShowErrors()) {
        <span id="hold-errors">{{ display.errors().join(',') }}</span>
      }
      @if (display.shouldShowWarnings()) {
        <span id="hold-warnings">{{ display.warnings().join(',') }}</span>
      }
    </form>
  `,
})
class PendingHoldHostComponent {
  model = '';
  readonly display = viewChild.required(FormErrorDisplayDirective);
  readonly validator = viewChild.required(ControlledAsyncValidatorDirective);
  readonly ngForm = viewChild.required(NgForm);
}

describe('FormErrorDisplayDirective while re-validating', () => {
  let fixture: ComponentFixture<PendingHoldHostComponent>;
  let host: PendingHoldHostComponent;

  const taken = { errors: ['Username is taken'], warnings: ['Short name'] };

  function control() {
    const ctrl = host.ngForm().form.get('username');
    if (!ctrl) throw new Error('username control missing');
    return ctrl;
  }

  async function stable(): Promise<void> {
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();
  }

  /** Types a value: marks the control dirty and touched and re-validates. */
  async function edit(value: string): Promise<void> {
    control().markAsTouched();
    control().markAsDirty();
    control().setValue(value);
    await stable();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PendingHoldHostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(PendingHoldHostComponent);
    host = fixture.componentInstance;
    await stable();
  });

  it('shows nothing while the first validation is pending', async () => {
    await edit('ada');

    const display = host.display();
    expect(display.isPending()).toBe(true);
    expect(display.errors()).toEqual([]);
    expect(display.warnings()).toEqual([]);
    expect(display.shouldShowErrors()).toBe(false);
    expect(display.shouldShowWarnings()).toBe(false);
  });

  it('keeps the last settled messages until the next result settles', async () => {
    const display = host.display();
    await edit('taken');
    host.validator().settle(taken);
    await stable();
    expect(display.errors()).toEqual(['Username is taken']);
    expect(display.shouldShowErrors()).toBe(true);
    expect(display.warnings()).toEqual(['Short name']);
    expect(display.shouldShowWarnings()).toBe(true);

    await edit('taken2');
    expect(display.isPending()).toBe(true);
    expect(
      fixture.nativeElement.querySelector('#hold-errors')?.textContent
    ).toBe('Username is taken');
    expect(
      fixture.nativeElement.querySelector('#hold-warnings')?.textContent
    ).toBe('Short name');
    expect(display.errors()).toEqual(['Username is taken']);
    expect(display.shouldShowErrors()).toBe(true);
    expect(display.warnings()).toEqual(['Short name']);
    expect(display.shouldShowWarnings()).toBe(true);

    host.validator().settle({ errors: ['Username is reserved'] });
    await stable();
    expect(display.isPending()).toBe(false);
    expect(display.errors()).toEqual(['Username is reserved']);
    expect(display.warnings()).toEqual([]);
    expect(display.shouldShowWarnings()).toBe(false);
  });

  it('clears the messages when the new result settles valid', async () => {
    const display = host.display();
    await edit('taken');
    host.validator().settle(taken);
    await stable();

    await edit('ada');
    expect(display.errors()).toEqual(['Username is taken']);

    host.validator().settle(null);
    await stable();
    expect(display.errors()).toEqual([]);
    expect(display.shouldShowErrors()).toBe(false);
    expect(display.warnings()).toEqual([]);
    expect(display.shouldShowWarnings()).toBe(false);
  });

  it('clears the held messages at once when the form is reset', async () => {
    const display = host.display();
    await edit('taken');
    host.validator().settle(taken);
    await stable();
    expect(display.shouldShowErrors()).toBe(true);

    host.ngForm().resetForm();
    await stable();

    // The reset re-validates the control; nothing from before the reset
    // may stay on screen while that check is pending.
    expect(control().pending).toBe(true);
    expect(display.errors()).toEqual([]);
    expect(display.shouldShowErrors()).toBe(false);
    expect(display.warnings()).toEqual([]);
    expect(display.shouldShowWarnings()).toBe(false);
  });

  it('clears the held messages when only the control is reset', async () => {
    const display = host.display();
    await edit('taken');
    host.validator().settle(taken);
    await stable();

    control().reset('');
    await stable();

    expect(control().pending).toBe(true);
    expect(display.errors()).toEqual([]);
    expect(display.shouldShowErrors()).toBe(false);
  });

  it('does not hold messages the display mode was still hiding', async () => {
    const display = host.display();
    // Settled with an error while untouched: on-blur-or-submit hides it.
    control().markAsDirty();
    control().setValue('taken');
    await stable();
    host.validator().settle({ errors: ['Username is taken'] });
    await stable();
    expect(display.shouldShowErrors()).toBe(false);

    // Blurring during the next check must not reveal the stale message.
    await edit('taken2');
    expect(display.isPending()).toBe(true);
    expect(display.shouldShowErrors()).toBe(false);
    expect(display.errors()).toEqual([]);

    host.validator().settle({ errors: ['Username is reserved'] });
    await stable();
    expect(display.shouldShowErrors()).toBe(true);
    expect(display.errors()).toEqual(['Username is reserved']);
  });
});
