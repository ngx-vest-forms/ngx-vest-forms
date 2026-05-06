/* eslint-disable @angular-eslint/component-selector */
import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render, screen, waitFor } from '@testing-library/angular';
import { enforce, only, staticSuite, test as vestTest } from 'vest';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { ROOT_FORM } from '../constants';
import { NgxVestForms } from '../exports';
import { createDebouncedPendingState } from '../utils/pending-state.utils';
import { FormDirective } from './form.directive';

/**
 * Acceptance tests for issue #106 — "State-sync correctness" bundle:
 *   1. `formState().value` resets to `null` when all controls are dynamically removed.
 *   2. `[pendingDebounce]` reflects runtime input changes on `<ngx-form-group-wrapper>`.
 *   3. `form-control-state` tracks late-attached `NgModel.control`.
 *   4. `ngxValidateRootFormMode` precedence is `ngx ?? legacy ?? 'submit'`
 *      across all four default-vs-explicit combinations.
 */

describe('Issue #106 — state-sync correctness', () => {
  describe('formState().value resets when all controls are removed', () => {
    @Component({
      selector: 'test-empty-controls',
      imports: [NgxVestForms],
      template: `
        <form
          ngxVestForm
          [formValue]="formValue()"
          (formValueChange)="formValue.set($event)"
          #vest="ngxVestForm"
        >
          @if (showFields()) {
            <input name="firstName" [ngModel]="formValue().firstName" />
            <input name="lastName" [ngModel]="formValue().lastName" />
          }
        </form>
      `,
    })
    class HostComponent {
      readonly formValue = signal<{
        firstName?: string;
        lastName?: string;
      }>({ firstName: 'Ada', lastName: 'Lovelace' });
      readonly showFields = signal(true);
      readonly vestForm =
        viewChild.required<
          FormDirective<{ firstName?: string; lastName?: string }>
        >('vest');
    }

    it('clears the linkedSignal cache and exposes value=null after removal', async () => {
      const { fixture } = await render(HostComponent);
      const host = fixture.componentInstance;

      await fixture.whenStable();
      fixture.detectChanges();
      // Sanity: form has data while controls are present.
      expect(host.vestForm().formState().value).toEqual({
        firstName: 'Ada',
        lastName: 'Lovelace',
      });

      // Drop all controls dynamically — the bug previously had `formState().value`
      // keep returning the last `linkedSignal` snapshot.
      host.showFields.set(false);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(host.vestForm().formState().value).toBeNull();
    });
  });

  describe('[pendingDebounce] propagates runtime changes', () => {
    // Direct unit test against `createDebouncedPendingState` with fake timers.
    // This is what the wrapper passes its `input()` accessor into, so proving
    // the function honors a `Signal<DebouncedPendingStateOptions>` proves the
    // wrapper does too (the wrapper just forwards the signal — TypeScript +
    // the `pending-state.utils` API surface are the contract).
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('honors a Signal<DebouncedPendingStateOptions> at runtime (showAfter changes propagate)', async () => {
      await TestBed.runInInjectionContext(async () => {
        const isPending = signal(false);
        const opts = signal({ showAfter: 100, minimumDisplay: 50 });
        const result = createDebouncedPendingState(isPending, opts);

        // Bump the debounce BEFORE pending starts. A static-options
        // implementation would have captured 100ms at construction time and
        // ignored the change.
        opts.set({ showAfter: 1500, minimumDisplay: 50 });
        await vi.advanceTimersByTimeAsync(0); // flush effects

        isPending.set(true);
        await vi.advanceTimersByTimeAsync(0); // flush effects

        // Old 100ms threshold has long passed; new 1500ms hasn't.
        await vi.advanceTimersByTimeAsync(400);
        expect(result.showPendingMessage()).toBe(false);

        // Past the new threshold → message must now be visible.
        await vi.advanceTimersByTimeAsync(1200);
        expect(result.showPendingMessage()).toBe(true);
      });
    });

    it('honors a runtime change DURING a pending cycle', async () => {
      await TestBed.runInInjectionContext(async () => {
        const isPending = signal(false);
        const opts = signal({ showAfter: 100, minimumDisplay: 50 });
        const result = createDebouncedPendingState(isPending, opts);

        // Start with the short threshold.
        isPending.set(true);
        await vi.advanceTimersByTimeAsync(50); // partway to original 100ms
        expect(result.showPendingMessage()).toBe(false);

        // Update options mid-flight to a much larger threshold. The effect
        // must restart the timer with the new value, NOT honor the original.
        opts.set({ showAfter: 1000, minimumDisplay: 50 });
        await vi.advanceTimersByTimeAsync(0); // flush effects

        // Crossing the original 100ms threshold is no longer enough.
        await vi.advanceTimersByTimeAsync(100);
        expect(result.showPendingMessage()).toBe(false);

        // Cross the new 1000ms threshold (timer was restarted on options
        // change, so we need a full 1000ms from that restart point).
        await vi.advanceTimersByTimeAsync(1000);
        expect(result.showPendingMessage()).toBe(true);
      });
    });
  });

  describe('form-control-state tracks late-attached NgModel.control', () => {
    @Component({
      selector: 'test-late-attach-host',
      imports: [NgxVestForms],
      template: `
        <form ngxVestForm>
          @if (showInput()) {
            <div formControlState #state="formControlState">
              <input name="email" [(ngModel)]="email" required />
              <span data-testid="is-invalid">{{ state.isInvalid() }}</span>
              <span data-testid="error-count">{{
                state.errorMessages().length
              }}</span>
            </div>
          }
        </form>
      `,
    })
    class HostComponent {
      readonly showInput = signal(false);
      email = '';
    }

    it('reflects the control state once NgModel registers asynchronously', async () => {
      const { fixture } = await render(HostComponent);
      const host = fixture.componentInstance;

      // Mount the input + directive after the host's first change-detection
      // cycle so NgModel.control is undefined when the directive's first
      // effect run executes. The afterNextRender retry must pick it up.
      host.showInput.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      // Required input starts as invalid; the directive must reflect that
      // AND surface the validator error rather than just flipping isInvalid.
      const isInvalidEl = await waitFor(() => {
        const el = fixture.nativeElement.querySelector(
          '[data-testid="is-invalid"]'
        );
        expect(el?.textContent).toBe('true');
        return el as HTMLElement;
      });
      expect(isInvalidEl.textContent).toBe('true');

      // Positive proof the late-attach retry actually wired up the
      // FormControl: the `required` validator's error must surface via the
      // directive's exposed `errorMessages()` signal. Without the retry the
      // status subscription never attaches and this count stays 0.
      const errorCountEl = fixture.nativeElement.querySelector(
        '[data-testid="error-count"]'
      ) as HTMLElement | null;
      expect(errorCountEl).toBeTruthy();
      expect(Number(errorCountEl?.textContent)).toBeGreaterThan(0);
    });
  });

  describe('ngxValidateRootFormMode precedence: ngx ?? legacy ?? "submit"', () => {
    const suite = staticSuite(
      (data: Record<string, unknown> = {}, field?: string) => {
        only(field);
        vestTest(ROOT_FORM, 'Passwords must match', () => {
          if (data['password'] && data['confirmPassword']) {
            enforce(data['confirmPassword']).equals(data['password']);
          }
        });
      }
    );

    async function makeMisMatchedForm(template: string) {
      @Component({
        imports: [NgxVestForms],
        template,
      })
      class TestComponent {
        ROOT_FORM = ROOT_FORM;
        model = signal<Record<string, unknown>>({
          password: 'password123',
          confirmPassword: 'mismatch',
        });
        errors = signal<Record<string, string[]>>({});
        suite = suite;
      }
      return render(TestComponent);
    }

    it('combo 1 — neither attribute set → effective default is "submit" (no live error)', async () => {
      await makeMisMatchedForm(`
        <form
          ngxVestForm
          ngxValidateRootForm
          [suite]="suite"
          [formValue]="model()"
          (formValueChange)="model.set($event)"
          (errorsChange)="errors.set($event)"
        >
          <input name="password" [ngModel]="model().password" />
          <input name="confirmPassword" [ngModel]="model().confirmPassword" />
          @if (errors()[ROOT_FORM]) {
            <div data-testid="root-error">{{ errors()[ROOT_FORM][0] }}</div>
          }
        </form>
      `);

      // Give the suite a chance to run; in submit mode the error must NOT be present.
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(screen.queryByTestId('root-error')).not.toBeInTheDocument();
    });

    it('combo 2 — only legacy `validateRootFormMode` set → legacy wins', async () => {
      await makeMisMatchedForm(`
        <form
          ngxVestForm
          ngxValidateRootForm
          [validateRootFormMode]="'live'"
          [suite]="suite"
          [formValue]="model()"
          (formValueChange)="model.set($event)"
          (errorsChange)="errors.set($event)"
        >
          <input name="password" [ngModel]="model().password" />
          <input name="confirmPassword" [ngModel]="model().confirmPassword" />
          @if (errors()[ROOT_FORM]) {
            <div data-testid="root-error">{{ errors()[ROOT_FORM][0] }}</div>
          }
        </form>
      `);

      await waitFor(
        () => {
          expect(screen.queryByTestId('root-error')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('combo 3 — only `ngxValidateRootFormMode` set → ngx wins', async () => {
      await makeMisMatchedForm(`
        <form
          ngxVestForm
          ngxValidateRootForm
          [ngxValidateRootFormMode]="'live'"
          [suite]="suite"
          [formValue]="model()"
          (formValueChange)="model.set($event)"
          (errorsChange)="errors.set($event)"
        >
          <input name="password" [ngModel]="model().password" />
          <input name="confirmPassword" [ngModel]="model().confirmPassword" />
          @if (errors()[ROOT_FORM]) {
            <div data-testid="root-error">{{ errors()[ROOT_FORM][0] }}</div>
          }
        </form>
      `);

      await waitFor(
        () => {
          expect(screen.queryByTestId('root-error')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('combo 4 — both set → ngx-prefixed input takes precedence over legacy', async () => {
      await makeMisMatchedForm(`
        <form
          ngxVestForm
          ngxValidateRootForm
          [ngxValidateRootFormMode]="'submit'"
          [validateRootFormMode]="'live'"
          [suite]="suite"
          [formValue]="model()"
          (formValueChange)="model.set($event)"
          (errorsChange)="errors.set($event)"
        >
          <input name="password" [ngModel]="model().password" />
          <input name="confirmPassword" [ngModel]="model().confirmPassword" />
          @if (errors()[ROOT_FORM]) {
            <div data-testid="root-error">{{ errors()[ROOT_FORM][0] }}</div>
          }
        </form>
      `);

      // ngx says 'submit' → no error before submit even though legacy says 'live'.
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(screen.queryByTestId('root-error')).not.toBeInTheDocument();
    });
  });
});
