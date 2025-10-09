import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@vitest/browser/context';
import { enforce, test } from 'vest';
import { describe, expect, it } from 'vitest';
import { createVestForm } from '../create-vest-form';
import { NGX_VEST_FORMS_CONFIG } from '../tokens';
import { createSafeSuite } from '../utils/safe-suite';
import { NgxVestFormBusyDirective } from './ngx-vest-form-busy.directive';
import { NgxVestFormProviderDirective } from './ngx-vest-form-provider.directive';

const asyncValidationSuite = createSafeSuite(
  (data: { email?: string } = {}) => {
    test('email', 'Email must include @', () => {
      enforce(data.email).matches(/@/);
    });

    test('email', 'Email still processing', async ({ signal }) => {
      await new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(resolve, 75);

        signal?.addEventListener(
          'abort',
          () => {
            clearTimeout(timeoutId);
            reject(new Error('validation aborted'));
          },
          { once: true },
        );
      }).catch(() => {
        /* Ignore abort rejections to mirror Vest cancellation semantics */
      });
    });
  },
);

@Component({
  imports: [NgxVestFormProviderDirective, NgxVestFormBusyDirective],
  template: `
    <form
      aria-label="Account form"
      [ngxVestFormProvider]="form"
      (submit)="save($event)"
    >
      <label for="account-email">Email</label>
      <input
        id="account-email"
        type="email"
        [value]="form.email()"
        (input)="form.setEmail($event)"
      />
      <button type="submit">Submit</button>
    </form>
  `,
})
class AsyncSubmitHostComponent {
  protected readonly form = createVestForm(signal({ email: '' }), {
    suite: asyncValidationSuite,
    errorStrategy: 'immediate',
  });

  async save(event: Event) {
    event.preventDefault();
    await this.form.submit();
  }
}

@Component({
  imports: [NgxVestFormProviderDirective, NgxVestFormBusyDirective],
  template: `
    <form
      aria-label="Manual busy form"
      ngxVestAutoFormBusyDisabled
      [ngxVestFormProvider]="form"
      (submit)="save($event)"
    >
      <label for="manual-email">Email</label>
      <input
        id="manual-email"
        type="email"
        [value]="form.email()"
        (input)="form.setEmail($event)"
      />
      <button type="submit">Submit</button>
    </form>
  `,
})
class OptOutHostComponent {
  protected readonly form = createVestForm(signal({ email: '' }), {
    suite: asyncValidationSuite,
    errorStrategy: 'immediate',
  });

  async save(event: Event) {
    event.preventDefault();
    await this.form.submit();
  }
}

@Component({
  imports: [NgxVestFormBusyDirective],
  template: `
    <form aria-label="Standalone form">
      <label for="standalone-email">Email</label>
      <input id="standalone-email" type="email" />
      <button type="submit">Submit</button>
    </form>
  `,
})
class NoProviderComponent {
  protected noop(): void {
    // Directive should gracefully skip when no provider is available.
  }
}

async function waitForAngularStability() {
  await TestBed.inject(ApplicationRef).whenStable();
}

async function expectBusy(form: HTMLElement) {
  await expect
    .poll(() => form.getAttribute('aria-busy'), {
      timeout: 200,
      interval: 10,
    })
    .toBe('true');
}

async function expectIdle(form: HTMLElement) {
  await expect
    .poll(() => form.getAttribute('aria-busy'), {
      timeout: 300,
      interval: 10,
    })
    .toBeNull();
}

describe('NgxVestFormBusyDirective', () => {
  it('reflects pending validation and submit activity via aria-busy', async () => {
    await render(AsyncSubmitHostComponent);

    const form = screen.getByRole('form', { name: 'Account form' });
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    const submitButton = screen.getByRole('button', { name: /submit/i });

    expect(form).not.toHaveAttribute('aria-busy');

    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'user@example.com');

    const submission = userEvent.click(submitButton);

    await expectBusy(form);

    await submission;
    await waitForAngularStability();

    await expectIdle(form);
  });

  it('does not set aria-busy when ngxVestAutoFormBusyDisabled is present', async () => {
    await render(OptOutHostComponent);

    const form = screen.getByRole('form', { name: 'Manual busy form' });
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    const submitButton = screen.getByRole('button', { name: /submit/i });

    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'user@example.com');

    const submission = userEvent.click(submitButton);

    await expectIdle(form);

    await submission;
    await waitForAngularStability();

    expect(form).not.toHaveAttribute('aria-busy');
  });

  it('respects global autoFormBusy=false configuration', async () => {
    await render(AsyncSubmitHostComponent, {
      providers: [
        {
          provide: NGX_VEST_FORMS_CONFIG,
          useValue: {
            autoFormBusy: false,
            autoAria: true,
            autoTouch: true,
            debug: false,
          },
        },
      ],
    });

    const form = screen.getByRole('form', { name: 'Account form' });
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    const submitButton = screen.getByRole('button', { name: /submit/i });

    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'user@example.com');

    const submission = userEvent.click(submitButton);

    await expectIdle(form);

    await submission;
    await waitForAngularStability();

    expect(form).not.toHaveAttribute('aria-busy');
  });

  it('leaves forms without a provider untouched', async () => {
    await render(NoProviderComponent);

    const form = screen.getByRole('form', { name: 'Standalone form' });

    expect(form).not.toHaveAttribute('aria-busy');
  });
});
