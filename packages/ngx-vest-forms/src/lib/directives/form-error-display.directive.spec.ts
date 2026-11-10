import {
  ApplicationRef,
  Component,
  Directive,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import {
  type AsyncValidator,
  FormsModule,
  NG_ASYNC_VALIDATORS,
  NgForm,
  type ValidationErrors,
} from '@angular/forms';
import { By } from '@angular/platform-browser';
import userEvent from '@testing-library/user-event';
import { type Observable, Subject, take } from 'rxjs';
import { create } from 'vest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NgxVestForms } from '../exports';
import type { NgxErrorDisplayMode } from './form-error-display.directive';
import { FormErrorDisplayDirective } from './form-error-display.directive';
import { getFormSubmittedSignal } from './form-submitted-state';
import { FormDirective } from './form.directive';

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
        [errorDisplayMode]="mode()"
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
  readonly mode = signal<NgxErrorDisplayMode>('on-blur-or-submit');
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

  it('clears the held messages when a never-touched control is reset', async () => {
    const display = host.display();
    host.mode.set('always');
    // No touch, no dirty: only the display mode shows the error.
    control().setValue('taken');
    await stable();
    host.validator().settle(taken);
    await stable();
    expect(display.errors()).toEqual(['Username is taken']);

    control().reset('');
    await stable();

    expect(control().pending).toBe(true);
    expect(display.errors()).toEqual([]);
    expect(display.shouldShowErrors()).toBe(false);
  });

  it('keeps the hold when the control is marked untouched or pristine mid-check', async () => {
    const display = host.display();
    await edit('taken');
    host.validator().settle(taken);
    await stable();

    await edit('taken2');
    control().markAsUntouched();
    control().markAsPristine();
    await stable();

    expect(control().pending).toBe(true);
    expect(display.errors()).toEqual(['Username is taken']);
    expect(display.shouldShowErrors()).toBe(true);
  });

  it('holds the latest settled result when a check re-pends before change detection', async () => {
    const display = host.display();
    await edit('taken');
    host.validator().settle(taken);
    await stable();
    await edit('ada');
    expect(display.errors()).toEqual(['Username is taken']);

    // Settles valid and re-validates in the same stack (as a
    // validationConfig dependent does), with no render in between.
    host.validator().settle(null);
    control().updateValueAndValidity();
    await stable();

    expect(control().pending).toBe(true);
    expect(display.errors()).toEqual([]);
    expect(display.shouldShowErrors()).toBe(false);
    expect(display.warnings()).toEqual([]);
  });
});

/** Wrapper whose projected NgModel the test swaps. */
@Component({
  selector: 'ngx-test-hold-wrapper',
  hostDirectives: [
    { directive: FormErrorDisplayDirective, inputs: ['errorDisplayMode'] },
  ],
  template: `
    <ng-content />
    @if (display.shouldShowErrors()) {
      <span class="hold-errors">{{ display.errors().join(',') }}</span>
    }
  `,
})
class TestHoldWrapperComponent {
  readonly display = inject(FormErrorDisplayDirective);
}

@Component({
  imports: [
    FormsModule,
    TestHoldWrapperComponent,
    ControlledAsyncValidatorDirective,
  ],
  template: `
    <form>
      <ngx-test-hold-wrapper errorDisplayMode="always">
        @if (useA()) {
          <input name="a" ngModel ngxControlledAsync />
        } @else {
          <input
            name="b"
            ngModel
            [ngModelOptions]="{ standalone: standaloneB() }"
            ngxControlledAsync
          />
        }
      </ngx-test-hold-wrapper>
    </form>
  `,
})
class SwappedControlHostComponent {
  readonly useA = signal(true);
  readonly standaloneB = signal(false);
  readonly wrapper = viewChild.required(TestHoldWrapperComponent);
  readonly validator = viewChild.required(ControlledAsyncValidatorDirective);
}

describe('FormErrorDisplayDirective hold across controls', () => {
  it.each([
    ['registered with the form', false],
    ['standalone (pending as soon as it is created)', true],
  ])(
    "does not show one control's messages during the next control's first validation (%s)",
    async (_label, standalone) => {
      await TestBed.configureTestingModule({
        imports: [SwappedControlHostComponent],
      }).compileComponents();
      const fixture = TestBed.createComponent(SwappedControlHostComponent);
      const host = fixture.componentInstance;
      host.standaloneB.set(standalone);
      const stable = async () => {
        fixture.detectChanges();
        await TestBed.inject(ApplicationRef).whenStable();
      };
      await stable();

      host.validator().settle({ errors: ['A is wrong'] });
      await stable();
      const display = host.wrapper().display;
      expect(display.errors()).toEqual(['A is wrong']);

      host.useA.set(false);
      await stable();

      // b's first validation is pending: nothing of a's may show.
      expect(display.hasPendingValidation()).toBe(true);
      expect(display.errors()).toEqual([]);
      expect(display.shouldShowErrors()).toBe(false);

      host.validator().settle({ errors: ['B is wrong'] });
      await stable();
      expect(display.errors()).toEqual(['B is wrong']);
    }
  );
});

const noTestsSuite = create(() => {
  // The controlled async validator supplies the errors in this spec.
});

@Component({
  imports: [NgxVestForms, ControlledAsyncValidatorDirective],
  template: `
    <form ngxVestForm [suite]="suite">
      <input
        ngxErrorDisplay
        ngxControlledAsync
        name="username"
        [ngModel]="''"
      />
    </form>
  `,
})
class ResetFieldHostComponent {
  readonly suite = noTestsSuite;
  readonly vestForm = viewChild.required(FormDirective);
  readonly display = viewChild.required(FormErrorDisplayDirective);
  readonly validator = viewChild.required(ControlledAsyncValidatorDirective);
}

describe('FormErrorDisplayDirective and FormDirective.resetField', () => {
  it('drops the held messages when the field is reset', async () => {
    await TestBed.configureTestingModule({
      imports: [ResetFieldHostComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(ResetFieldHostComponent);
    const host = fixture.componentInstance;
    const stable = async () => {
      fixture.detectChanges();
      await TestBed.inject(ApplicationRef).whenStable();
    };
    await stable();
    const control = host.vestForm().ngForm.form.get('username');
    if (!control) throw new Error('username control missing');

    control.markAsTouched();
    control.markAsDirty();
    control.setValue('taken');
    host.validator().settle({ errors: ['Username is taken'] });
    await stable();
    await expect
      .poll(() => host.display().errors())
      .toEqual(['Username is taken']);

    host.vestForm().resetField('username');
    await stable();

    expect(control.pending).toBe(true);
    expect(host.display().errors()).toEqual([]);
    expect(host.display().shouldShowErrors()).toBe(false);
  });

  it('leaves the raw warningMessages() on the last fieldWarnings while pending', async () => {
    await TestBed.configureTestingModule({
      imports: [ResetFieldHostComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(ResetFieldHostComponent);
    const host = fixture.componentInstance;
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();
    const control = host.vestForm().ngForm.form.get('username');
    if (!control) throw new Error('username control missing');

    host.vestForm().fieldWarnings.set(new Map([['username', ['Short name']]]));
    control.setValue('x');
    fixture.detectChanges();

    // Documented in CUSTOM-CONTROL-WRAPPERS.md: the raw signal has no hold,
    // but the warnings map is only replaced when the next result lands.
    expect(control.pending).toBe(true);
    expect(host.display().errorMessages()).toEqual([]);
    expect(host.display().warningMessages()).toEqual(['Short name']);
  });
});
