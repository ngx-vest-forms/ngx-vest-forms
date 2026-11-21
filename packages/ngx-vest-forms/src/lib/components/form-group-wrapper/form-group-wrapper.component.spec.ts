import {
  ChangeDetectionStrategy,
  Component,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule, type NgForm } from '@angular/forms';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { create, test as vestTest } from 'vest';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { NgxVestForms } from '../../exports';
import { NGX_PENDING_LABEL } from '../../tokens/pending-label.token';
import { FormGroupWrapperComponent } from './form-group-wrapper.component';

// The group check never settles, so the group stays pending.
const pendingGroupSuite = create(() => {
  vestTest('group', 'Group check', () => new Promise<void>(() => undefined));
});

@Component({
  imports: [NgxVestForms],
  providers: [{ provide: NGX_PENDING_LABEL, useValue: 'Bezig…' }],
  template: `
    <form ngxVestForm [suite]="suite" [formValue]="model()">
      <ngx-form-group-wrapper
        ngModelGroup="group"
        [pendingDebounce]="{ showAfter: 0, minimumDisplay: 0 }"
      >
        <label for="pending-a">A</label>
        <input id="pending-a" name="a" [ngModel]="model().group.a" />
      </ngx-form-group-wrapper>
    </form>
  `,
})
class PendingGroupHostComponent {
  readonly model = signal({ group: { a: '' } });
  readonly suite = pendingGroupSuite;
}

@Component({
  imports: [FormsModule, FormGroupWrapperComponent],
  template: `
    <form #form="ngForm">
      <ngx-form-group-wrapper ngModelGroup="group">
        <label for="a">A</label>
        <input id="a" name="a" [(ngModel)]="a" required />

        <label for="b">B</label>
        <input id="b" name="b" [(ngModel)]="b" required />
      </ngx-form-group-wrapper>

      <button type="submit">Submit</button>
    </form>
  `,
})
class HostComponent {
  a = '';
  b = '';
}

@Component({
  imports: [FormsModule, FormGroupWrapperComponent],
  template: `
    <form #form="ngForm">
      <fieldset ngxFormGroupWrapper ngModelGroup="group">
        <legend>Group</legend>

        <label for="alias-a">A</label>
        <input id="alias-a" name="a" [(ngModel)]="a" required />

        <label for="alias-b">B</label>
        <input id="alias-b" name="b" [(ngModel)]="b" required />
      </fieldset>

      <button type="submit">Submit</button>
    </form>
  `,
})
class HostAliasComponent {
  a = '';
  b = '';
}

describe('FormGroupWrapperComponent', () => {
  it('renders group-level errors but does not stamp ARIA onto descendant controls', async () => {
    await render(HostComponent);

    const inputA = screen.getByLabelText('A') as HTMLInputElement;
    const inputB = screen.getByLabelText('B') as HTMLInputElement;

    // Touch a child control (group becomes touched)
    await userEvent.click(inputA);
    await userEvent.tab();

    // Group becomes invalid + touched, so wrapper should reflect invalid state.
    await waitFor(() => {
      const wrapper = document.querySelector('ngx-form-group-wrapper');
      expect(wrapper).toBeTruthy();
      expect(wrapper).toHaveClass('ngx-form-group-wrapper--invalid');
    });

    // Critically: group wrapper must not mutate descendant inputs.
    expect(inputA).not.toHaveAttribute('aria-invalid');
    expect(inputA).not.toHaveAttribute('aria-describedby');
    expect(inputB).not.toHaveAttribute('aria-invalid');
    expect(inputB).not.toHaveAttribute('aria-describedby');
  });

  it('supports ngxFormGroupWrapper on fieldset', async () => {
    await render(HostAliasComponent);

    const inputA = screen.getByLabelText('A') as HTMLInputElement;
    const inputB = screen.getByLabelText('B') as HTMLInputElement;

    await userEvent.click(inputA);
    await userEvent.tab();

    await waitFor(() => {
      const wrapper = document.querySelector('fieldset[ngxformgroupwrapper]');
      expect(wrapper).toBeTruthy();
      expect(wrapper).toHaveClass('ngx-form-group-wrapper--invalid');
    });

    expect(inputA).not.toHaveAttribute('aria-invalid');
    expect(inputA).not.toHaveAttribute('aria-describedby');
    expect(inputB).not.toHaveAttribute('aria-invalid');
    expect(inputB).not.toHaveAttribute('aria-describedby');
  });

  it('renders the NGX_PENDING_LABEL text while the group validates', async () => {
    pendingGroupSuite.reset();
    await render(PendingGroupHostComponent);
    await userEvent.type(screen.getByLabelText('A'), 'x');

    expect(await screen.findByText('Bezig…')).toBeInTheDocument();
    expect(screen.queryByText('Validating…')).not.toBeInTheDocument();
  });

  it('keeps inline [pendingDebounce] timers running across unrelated change detection', async () => {
    vi.useFakeTimers();
    onTestFinished(() => {
      vi.useRealTimers();
    });

    let resolveCheck: (() => void) | undefined;
    const controlledGroupSuite = create(() => {
      vestTest(
        'group',
        'Group check',
        () =>
          new Promise<void>((resolve) => {
            resolveCheck = resolve;
          })
      );
    });

    @Component({
      imports: [NgxVestForms],
      template: `
        <form ngxVestForm [suite]="suite" [formValue]="model()" #form="ngForm">
          <p data-testid="counter">{{ counter() }}</p>
          <ngx-form-group-wrapper
            ngModelGroup="group"
            [pendingDebounce]="{ showAfter: 200, minimumDisplay: 500 }"
          >
            <label for="group-inline-pending">A</label>
            <input
              id="group-inline-pending"
              name="a"
              [ngModel]="model().group.a"
            />
          </ngx-form-group-wrapper>
        </form>
      `,
    })
    class InlineGroupPendingDebounceHostComponent {
      readonly model = signal({ group: { a: '' } });
      readonly suite = controlledGroupSuite;
      readonly counter = signal(0);
      readonly ngForm = viewChild.required<NgForm>('form');
    }

    const { fixture } = await render(InlineGroupPendingDebounceHostComponent);
    const host = fixture.componentInstance;
    const groupControl = host.ngForm().form.get('group');
    const aControl = host.ngForm().form.get('group.a');
    if (!groupControl || !aControl) throw new Error('group controls missing');

    aControl.markAsDirty();
    aControl.setValue('x');
    groupControl.markAsDirty();
    groupControl.updateValueAndValidity();
    fixture.detectChanges();

    for (let i = 0; i < 4; i++) {
      host.counter.update((n) => n + 1);
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(50);
    }
    fixture.detectChanges();
    expect(screen.getByText('Validating…')).toBeInTheDocument();

    resolveCheck?.();
    await Promise.resolve();
    fixture.detectChanges();

    for (let i = 0; i < 9; i++) {
      host.counter.update((n) => n + 1);
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(50);
    }
    fixture.detectChanges();
    expect(screen.getByText('Validating…')).toBeInTheDocument();

    host.counter.update((n) => n + 1);
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(50);
    fixture.detectChanges();
    expect(screen.queryByText('Validating…')).not.toBeInTheDocument();
  });

  it('omits errorId from describedByIds when invalid without group error messages and updates under OnPush', async () => {
    const groupSuite = create((model: { group?: { a?: string } }) => {
      vestTest('group', 'Group requires value', () => {
        if (model.group?.a === 'fail-group') {
          throw new Error('Group requires value');
        }
      });
    });

    @Component({
      imports: [NgxVestForms],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <form
          ngxVestForm
          [suite]="suite"
          [formValue]="model()"
          (formValueChange)="model.set($event)"
        >
          <ngx-form-group-wrapper
            ngModelGroup="group"
            #groupWrapper="ngxFormGroupWrapper"
          >
            <label for="onpush-a">A</label>
            <input
              id="onpush-a"
              name="a"
              [ngModel]="model().group.a"
              required
            />
          </ngx-form-group-wrapper>
        </form>
      `,
    })
    class OnPushGroupHostComponent {
      readonly model = signal({ group: { a: '' } });
      readonly suite = groupSuite;
      readonly groupWrapper =
        viewChild.required<FormGroupWrapperComponent>('groupWrapper');
    }

    const { fixture } = await render(OnPushGroupHostComponent);
    const wrapper = fixture.componentInstance.groupWrapper();
    const inputA = screen.getByLabelText('A');

    // Child is invalid (required), so the group is invalid with no group-level error messages.
    await userEvent.click(inputA);
    await userEvent.tab();

    await waitFor(() => {
      const hostEl = document.querySelector('ngx-form-group-wrapper');
      expect(hostEl).toHaveClass('ngx-form-group-wrapper--invalid');
      expect(wrapper.describedByIds()).toBeNull();
    });

    // Trigger a real group-level error message: errorId should now be linked and rendered under OnPush.
    await userEvent.type(inputA, 'fail-group');
    await userEvent.tab();

    await waitFor(() => {
      expect(screen.getByText('Group requires value')).toBeInTheDocument();
      expect(wrapper.describedByIds()).toBe(wrapper.errorId);
    });
  });
});
