/* eslint-disable @angular-eslint/component-selector */
import { Component, signal, viewChild } from '@angular/core';
import { render, screen, waitFor } from '@testing-library/angular';
import { enforce, only, staticSuite, test as vestTest } from 'vest';
import { describe, expect, it } from 'vitest';
import { ROOT_FORM } from '../constants';
import { NgxVestForms } from '../exports';
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
    @Component({
      selector: 'test-pending-debounce-host',
      imports: [NgxVestForms],
      template: `
        <form
          ngxVestForm
          [suite]="suite"
          [formValue]="formValue()"
          (formValueChange)="formValue.set($event)"
        >
          <ngx-form-group-wrapper
            ngModelGroup="profile"
            [pendingDebounce]="pendingDebounce()"
          >
            <input name="email" [ngModel]="formValue().profile?.email" />
          </ngx-form-group-wrapper>
        </form>
      `,
    })
    class HostComponent {
      readonly formValue = signal<{ profile?: { email?: string } }>({
        profile: { email: '' },
      });
      readonly pendingDebounce = signal({
        showAfter: 100,
        minimumDisplay: 50,
      });
      readonly suite = staticSuite(
        (
          model: { profile?: { email?: string } } = {},
          field?: string
        ) => {
          only(field);
          vestTest('profile.email', 'Email is required', () => {
            enforce(model.profile?.email ?? '').isNotBlank();
          });
        }
      );
    }

    it('updates the showAfter timing when the input changes at runtime', async () => {
      const { fixture } = await render(HostComponent);
      const host = fixture.componentInstance;

      // Bump the debounce so a fresh validation cycle waits 1500ms before
      // marking the pending message as visible. With the bug, the original
      // 100ms value is still in effect.
      host.pendingDebounce.set({ showAfter: 1500, minimumDisplay: 50 });
      fixture.detectChanges();

      // Wait long enough for the *old* showAfter (100ms) to expire while still
      // below the *new* one (1500ms). The form has just rendered and validation
      // is pending, so a stale config would have already shown the message.
      await new Promise((resolve) => setTimeout(resolve, 400));
      fixture.detectChanges();

      const wrapper = fixture.nativeElement.querySelector(
        'ngx-form-group-wrapper'
      ) as HTMLElement | null;
      expect(wrapper).toBeTruthy();
      expect(wrapper?.getAttribute('aria-busy')).not.toBe('true');
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

      // Required input starts as invalid; the directive must reflect that.
      const isInvalidEl = await waitFor(() => {
        const el = fixture.nativeElement.querySelector(
          '[data-testid="is-invalid"]'
        );
        expect(el?.textContent).toBe('true');
        return el as HTMLElement;
      });
      expect(isInvalidEl.textContent).toBe('true');
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
