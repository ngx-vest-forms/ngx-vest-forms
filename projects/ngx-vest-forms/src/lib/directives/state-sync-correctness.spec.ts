/* eslint-disable @angular-eslint/component-selector */
import { Component, signal, viewChild, type WritableSignal } from '@angular/core';
import { render, screen, waitFor } from '@testing-library/angular';
import { create, enforce, test as vestTest } from 'vest';
import { describe, expect, it } from 'vitest';
import { ROOT_FORM } from '../constants';
import { NgxVestForms } from '../exports';
import { FormDirective } from './form.directive';

/**
 * Acceptance tests for issue #106 — "State-sync correctness" bundle:
 *   1. `formState().value` resets to `null` when all controls are dynamically removed.
 *   2. `form-control-state` tracks late-attached `NgModel.control`.
 *   3. `ngxValidateRootFormMode` precedence is `ngx ?? legacy ?? 'submit'`
 *      across all four default-vs-explicit combinations.
 *
 * Reactive `[pendingDebounce]` propagation is covered as unit tests in
 * `../utils/pending-state.utils.spec.ts` (the wrapper just forwards the
 * signal to `createDebouncedPendingState`).
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

  describe('form-control-state tracks late-attached NgModel.control', () => {
    // Uses the documented one-way binding pattern (`[ngModel]` driven by a
    // signal, updates flow through `(formValueChange)`) so this test
    // doubles as a faithful usage example, not just a regression assertion.
    @Component({
      selector: 'test-late-attach-host',
      imports: [NgxVestForms],
      template: `
        <form
          ngxVestForm
          [formValue]="formValue()"
          (formValueChange)="formValue.set($event)"
        >
          @if (showInput()) {
            <div formControlState #state="formControlState">
              <input name="email" [ngModel]="formValue().email" required />
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
      readonly formValue = signal<{ email?: string }>({ email: '' });
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
    function createRootFormSuite() {
      return create((data: Record<string, unknown> = {}) => {
        vestTest(ROOT_FORM, 'Passwords must match', () => {
          if (data['password'] && data['confirmPassword']) {
            enforce(data['confirmPassword']).equals(data['password']);
          }
        });
      });
    }

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
        suite = createRootFormSuite();
      }
      return render(TestComponent);
    }

    it('combo 1 — neither attribute set → effective default is "submit" (no live error)', async () => {
      const { fixture } = await makeMisMatchedForm(`
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

      // Drive the form through a value change. In `live` mode this would
      // fire the suite and surface the mismatch error; in `submit` mode it
      // must stay silent. Awaiting stability twice (once for the value
      // change, once for any reactive cascade) is deterministic and
      // strictly faster than a fixed-duration setTimeout.
      const host = fixture.componentInstance as { model: WritableSignal<Record<string, unknown>> };
      host.model.update((m) => ({ ...m, confirmPassword: 'still-mismatched' }));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();

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
      const { fixture } = await makeMisMatchedForm(`
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

      // Trigger a value change that *would* fire validation if the legacy
      // 'live' mode were honored. ngx says 'submit', so it must stay silent.
      const host = fixture.componentInstance as { model: WritableSignal<Record<string, unknown>> };
      host.model.update((m) => ({ ...m, confirmPassword: 'still-mismatched' }));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(screen.queryByTestId('root-error')).not.toBeInTheDocument();
    });
  });
});
