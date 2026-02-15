import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { FormErrorControlDirective } from './form-error-control.directive';

@Component({
  imports: [FormsModule, FormErrorControlDirective],
  template: `
    <form #form="ngForm">
      <label for="test">Test</label>
      <p id="hint">Hint text</p>

      <div
        formErrorControl
        [ariaAssociationMode]="ariaMode"
        #ec="formErrorControl"
      >
        <input
          id="test"
          name="test"
          [(ngModel)]="model"
          required
          aria-describedby="hint"
        />

        <!-- regions exist so aria-describedby targets are valid -->
        <div data-testid="error-region" [id]="ec.errorId">Error region</div>
        <div data-testid="warning-region" [id]="ec.warningId">
          Warning region
        </div>
        <div data-testid="pending-region" [id]="ec.pendingId">
          Pending region
        </div>
      </div>

      <button id="submit" type="submit">Submit</button>
    </form>
  `,
})
class TestHostComponent {
  model = '';
  ariaMode: 'all-controls' | 'single-control' | 'none' = 'all-controls';
}

@Component({
  imports: [FormsModule, FormErrorControlDirective],
  template: `
    <form #form="ngForm">
      <label for="a">A</label>
      <label for="b">B</label>
      <p id="hint">Hint text</p>

      <div
        formErrorControl
        [ariaAssociationMode]="ariaMode"
        #ec="formErrorControl"
      >
        <input
          id="a"
          name="a"
          [(ngModel)]="a"
          required
          aria-describedby="hint"
        />
        <input
          id="b"
          name="b"
          [(ngModel)]="b"
          required
          aria-describedby="hint"
        />

        <div data-testid="error-region" [id]="ec.errorId">Error region</div>
      </div>

      <button type="submit">Submit</button>
    </form>
  `,
})
class TestMultipleControlsComponent {
  a = '';
  b = '';
  ariaMode: 'all-controls' | 'single-control' | 'none' = 'single-control';
}

// Wrapper component that consumes the directive as a host directive.
@Component({
  selector: 'ngx-test-error-control-wrapper',
  imports: [FormErrorControlDirective],
  hostDirectives: [FormErrorControlDirective],
  template: ` <ng-content /> `,
})
class TestErrorControlWrapperComponent {}

@Component({
  imports: [FormsModule, TestErrorControlWrapperComponent],
  template: `
    <form #form="ngForm">
      <p id="hint">Hint text</p>

      <ngx-test-error-control-wrapper
        #ec="formErrorControl"
        [errorDisplayMode]="mode"
      >
        <label for="host-test">Test</label>
        <input
          id="host-test"
          name="hostTest"
          [(ngModel)]="model"
          required
          aria-describedby="hint"
        />

        <div data-testid="error-region" [id]="ec.errorId">Error region</div>
      </ngx-test-error-control-wrapper>

      <button type="submit">Submit</button>
    </form>
  `,
})
class TestHostDirectiveComponent {
  model = '';
  mode: 'on-submit' | 'on-blur' | 'on-blur-or-submit' = 'on-submit';
}

@Component({
  imports: [FormsModule, FormErrorControlDirective],
  template: `
    <form #form="ngForm">
      <button type="button" (click)="toggle()">Toggle</button>

      @if (showWrapper) {
        <div formErrorControl #ec="formErrorControl">
          <label for="dynamic">Dynamic</label>
          <input id="dynamic" name="dynamic" [(ngModel)]="model" required />
          <div data-testid="dynamic-error-region" [id]="ec.errorId">
            Error region
          </div>
          <div data-testid="dynamic-warning-region" [id]="ec.warningId">
            Warning region
          </div>
          <div data-testid="dynamic-pending-region" [id]="ec.pendingId">
            Pending region
          </div>
        </div>
      }
    </form>
  `,
})
class ConditionalWrapperHostComponent {
  model = '';
  showWrapper = true;

  toggle(): void {
    this.showWrapper = !this.showWrapper;
  }
}

describe('FormErrorControlDirective', () => {
  it('stamps aria-describedby and aria-invalid after blur (touched)', async () => {
    await render(TestHostComponent);

    const input = screen.getByLabelText('Test') as HTMLInputElement;

    // Initially: keep existing hint, do not set aria-invalid (errors are not shown yet)
    expect(input.getAttribute('aria-describedby')).toBe('hint');
    expect(input.getAttribute('aria-invalid')).toBe(null);

    // Trigger touch via keyboard navigation
    await userEvent.click(input);
    await userEvent.tab();

    const errorId = screen.getByTestId('error-region').getAttribute('id');
    expect(errorId).toMatch(/^ngx-error-control-\d+-error$/);

    await waitFor(() => {
      expect(input.getAttribute('aria-describedby')).toBe(`hint ${errorId}`);
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });
  });

  it('does not mutate descendant controls when ariaAssociationMode is none', async () => {
    await render(TestHostComponent, {
      componentProperties: { ariaMode: 'none' },
    });

    const input = screen.getByLabelText('Test') as HTMLInputElement;

    await userEvent.click(input);
    await userEvent.tab();

    // Should keep the initial aria-describedby and never set aria-invalid.
    await waitFor(() => {
      expect(input.getAttribute('aria-describedby')).toBe('hint');
      expect(input.getAttribute('aria-invalid')).toBe(null);
    });
  });

  it('stamps aria attributes in ariaAssociationMode="single-control" when exactly one control exists', async () => {
    await render(TestHostComponent, {
      componentProperties: { ariaMode: 'single-control' },
    });

    const input = screen.getByLabelText('Test') as HTMLInputElement;

    await userEvent.click(input);
    await userEvent.tab();

    const errorId = screen.getByTestId('error-region').getAttribute('id');
    expect(errorId).toMatch(/^ngx-error-control-\d+-error$/);

    await waitFor(() => {
      expect(input.getAttribute('aria-describedby')).toBe(`hint ${errorId}`);
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });
  });

  it('does not stamp aria attributes in ariaAssociationMode="single-control" when multiple controls exist', async () => {
    await render(TestMultipleControlsComponent);

    const inputA = screen.getByLabelText('A') as HTMLInputElement;
    const inputB = screen.getByLabelText('B') as HTMLInputElement;

    await userEvent.click(inputA);
    await userEvent.tab();

    await waitFor(() => {
      expect(inputA.getAttribute('aria-describedby')).toBe('hint');
      expect(inputA.getAttribute('aria-invalid')).toBe(null);

      expect(inputB.getAttribute('aria-describedby')).toBe('hint');
      expect(inputB.getAttribute('aria-invalid')).toBe(null);
    });
  });

  it('removes only its owned aria-describedby tokens when errors are cleared (keeps existing tokens)', async () => {
    await render(TestHostComponent);

    const input = screen.getByLabelText('Test') as HTMLInputElement;
    const errorId = screen.getByTestId('error-region').getAttribute('id');

    // Show error
    await userEvent.click(input);
    await userEvent.tab();

    await waitFor(() => {
      expect(input.getAttribute('aria-describedby')).toBe(`hint ${errorId}`);
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    // Fix input and blur again
    await userEvent.type(input, 'ok');
    await userEvent.tab();

    await waitFor(() => {
      expect(input.getAttribute('aria-describedby')).toBe('hint');
      expect(input.getAttribute('aria-invalid')).toBe(null);
    });
  });

  it('works when applied as a host directive (and honors errorDisplayMode="on-submit")', async () => {
    await render(TestHostDirectiveComponent);

    const input = screen.getByLabelText('Test') as HTMLInputElement;

    // Blur should not show errors in on-submit mode.
    await userEvent.click(input);
    await userEvent.tab();

    await waitFor(() => {
      expect(input.getAttribute('aria-invalid')).toBe(null);
      expect(input.getAttribute('aria-describedby')).toBe('hint');
    });

    // Submit should show errors.
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    const errorId = screen.getByTestId('error-region').getAttribute('id');
    await waitFor(() => {
      expect(input.getAttribute('aria-describedby')).toBe(`hint ${errorId}`);
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });
  });

  it('removes old owned IDs from DOM and uses fresh IDs when wrapper is destroyed and recreated', async () => {
    await render(ConditionalWrapperHostComponent);

    let input = screen.getByLabelText('Dynamic') as HTMLInputElement;

    // Trigger an error so aria-describedby includes owned error ID
    await userEvent.click(input);
    await userEvent.tab();

    let oldErrorId = '';
    await waitFor(() => {
      const describedBy = input.getAttribute('aria-describedby') ?? '';
      const ownedErrorToken = describedBy
        .split(/\s+/)
        .find((token) => /^ngx-error-control-\d+-error$/.test(token));

      expect(ownedErrorToken).toBeTruthy();
      if (!ownedErrorToken) {
        throw new Error('Expected owned error token to be present');
      }
      oldErrorId = ownedErrorToken;
      expect(document.getElementById(oldErrorId)).toBeInTheDocument();
    });

    // Destroy wrapper subtree
    await userEvent.click(screen.getByRole('button', { name: 'Toggle' }));

    await waitFor(() => {
      expect(screen.queryByLabelText('Dynamic')).not.toBeInTheDocument();
      expect(document.getElementById(oldErrorId)).toBeNull();
    });

    // Recreate wrapper subtree
    await userEvent.click(screen.getByRole('button', { name: 'Toggle' }));
    input = screen.getByLabelText('Dynamic') as HTMLInputElement;

    await userEvent.click(input);
    await userEvent.tab();

    await waitFor(() => {
      const describedBy = input.getAttribute('aria-describedby') ?? '';
      const newErrorToken = describedBy
        .split(/\s+/)
        .find((token) => /^ngx-error-control-\d+-error$/.test(token));

      expect(newErrorToken).toBeTruthy();
      if (!newErrorToken) {
        throw new Error('Expected new error token to be present');
      }
      expect(newErrorToken).not.toBe(oldErrorId);
      expect(document.getElementById(newErrorToken)).toBeInTheDocument();
      expect(document.getElementById(oldErrorId)).toBeNull();
    });
  });
});
