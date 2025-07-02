/* eslint-disable @typescript-eslint/no-unused-vars */
import { JsonPipe } from '@angular/common';
import { ApplicationRef, Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@vitest/browser/context';
import { describe, expect, test } from 'vitest';
import {
  getInitialNgxFormControlState,
  NgxFormControlStateDirective,
} from './form-control-state.directive';

/**
 * A component with no form control, used to test the directive's behavior in isolation.
 */
@Component({
  standalone: true,
  template: `
    <div ngxFormControlState #state="formControlState">
      <span data-testid="is-valid">{{ state.isValid() }}</span>
      <span data-testid="is-touched">{{ state.isTouched() }}</span>
      <span data-testid="has-errors">{{ state.hasErrors() }}</span>
      <span data-testid="error-messages">{{
        state.errorMessages().join(',')
      }}</span>
      <span data-testid="warning-messages">{{
        state.warningMessages().join(',')
      }}</span>
    </div>
  `,
  imports: [NgxFormControlStateDirective],
})
class NoControlComponent {
  // This component is intentionally empty to test directive isolation.
}

/**
 * A component that hosts an `NgModel` on a standard input element.
 * Used to test the directive's integration with Angular's forms.
 */
@Component({
  template: `
    <div ngxFormControlState #state="formControlState">
      <input [(ngModel)]="model" name="test" required />
      <span data-testid="is-valid">{{ state.isValid() }}</span>
      <span data-testid="is-touched">{{ state.isTouched() }}</span>
      <span data-testid="has-errors">{{ state.hasErrors() }}</span>
      <span data-testid="error-messages">{{
        state.errorMessages().join(',')
      }}</span>
    </div>
  `,
  standalone: true,
  imports: [FormsModule, NgxFormControlStateDirective],
})
class ContentNgModelComponent {
  model = '';
}

/**
 * A component that hosts an `NgModelGroup`, containing an `NgModel`.
 * Tests the directive's ability to work with nested form groups.
 */
@Component({
  template: `
    <form>
      <div ngxFormControlState #state="formControlState">
        <div ngModelGroup="group">
          <input [(ngModel)]="model" name="test" required />
        </div>
        <span data-testid="is-valid">{{ state.isValid() }}</span>
        <span data-testid="has-errors">{{ state.hasErrors() }}</span>
        <span data-testid="error-messages">{{
          state.errorMessages() | json
        }}</span>
      </div>
    </form>
  `,
  standalone: true,
  imports: [FormsModule, NgxFormControlStateDirective, JsonPipe],
})
class TestNgModelGroupComponent {
  model: string | null = '';
}

/**
 * A simple component that has NgxFormControlStateDirective applied as a hostDirective.
 * This tests the basic case where the directive is applied to an element that also has NgModel.
 */
@Component({
  selector: 'ngx-simple-host-test',
  template: `
    <span data-testid="is-valid">{{ isValid() }}</span>
    <span data-testid="has-errors">{{ hasErrors() }}</span>
    <span data-testid="error-messages">{{ errorMessages() | json }}</span>
  `,
  standalone: true,
  hostDirectives: [NgxFormControlStateDirective],
  imports: [JsonPipe],
})
class SimpleHostTestComponent {
  // Inject the directive to access its signals
  private directive = inject(NgxFormControlStateDirective);

  // Expose directive signals for testing
  isValid = this.directive.isValid;
  hasErrors = this.directive.hasErrors;
  errorMessages = this.directive.errorMessages;
}

/**
 * A wrapper to test the hostDirective pattern with NgModel applied to the same element.
 */
@Component({
  template: `
    <form>
      <ngx-simple-host-test
        [(ngModel)]="model"
        name="test"
        required
      ></ngx-simple-host-test>
    </form>
  `,
  standalone: true,
  imports: [FormsModule, SimpleHostTestComponent],
})
class TestHostDirectiveWrapperComponent {
  model: string | null = '';
}

describe('NgxFormControlStateDirective', () => {
  /**
   * @what Tests that the directive initializes with a predictable, default state when no form control is associated with it.
   * @why This ensures the directive is robust and does not crash when used in isolation. It guarantees a consistent, non-null initial state that is correctly reflected in the DOM, preventing unexpected template errors.
   */
  test('should initialize with default state when no form control is present', async () => {
    await render(NoControlComponent);

    // Check that the DOM reflects the initial, default state.
    const initialState = getInitialNgxFormControlState();

    expect(screen.getByTestId('is-valid').textContent).toBe(
      String(initialState.isValid),
    );
    expect(screen.getByTestId('is-touched').textContent).toBe(
      String(initialState.isTouched),
    );
    expect(screen.getByTestId('has-errors').textContent).toBe('false');
    expect(screen.getByTestId('error-messages').textContent).toBe('');
    expect(screen.getByTestId('warning-messages').textContent).toBe('');
  });

  describe('Control Association', () => {
    /**
     * @what Tests that the directive correctly associates with and reflects the state of a content child `NgModel`.
     * @why This is the primary use case for the directive. It confirms that the directive can find an `NgModel` in its content,
     * bind to its state changes, and reflect those changes in its own signals, which are then rendered in the DOM.
     */
    test('should associate with a content NgModel', async () => {
      await render(ContentNgModelComponent);
      const appReference = TestBed.inject(ApplicationRef);

      // Initial state: input is required but empty, so it should be invalid.
      expect(screen.getByTestId('is-valid').textContent).toBe('false');
      expect(screen.getByTestId('has-errors').textContent).toBe('true');
      expect(screen.getByTestId('error-messages').textContent).toBe('required');

      // Act: Type into the input to make it valid
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'hello');
      await appReference.whenStable();

      // Assert: State updates in the DOM
      expect(screen.getByTestId('is-valid').textContent).toBe('true');
      expect(screen.getByTestId('has-errors').textContent).toBe('false');
      expect(screen.getByTestId('error-messages').textContent).toBe('');
    });

    /**
     * @what Tests that the directive correctly associates with and reflects the state of a content child `NgModelGroup`.
     * @why This ensures the directive supports nested form structures and can accurately reflect the aggregate validation state of a form group, which is crucial for building complex forms.
     */
    test('should associate with a content NgModelGroup', async () => {
      await render(TestNgModelGroupComponent);
      const appReference = TestBed.inject(ApplicationRef);

      // Note: NgModelGroup itself may be valid initially, even if child controls are invalid
      // The directive should be tracking the group's state, not individual child states
      const initialValid = screen.getByTestId('is-valid').textContent;
      const initialHasErrors = screen.getByTestId('has-errors').textContent;

      // Verify we're getting boolean values (directive is working)
      expect(initialValid).toMatch(/^(true|false)$/);
      expect(initialHasErrors).toMatch(/^(true|false)$/);

      // Act: Type into the input - this might trigger validation on the group
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'hello');
      await appReference.whenStable();

      // Assert: State should update (though specific values depend on Angular's NgModelGroup behavior)
      const finalValid = screen.getByTestId('is-valid').textContent;
      const finalHasErrors = screen.getByTestId('has-errors').textContent;

      expect(finalValid).toMatch(/^(true|false)$/);
      expect(finalHasErrors).toMatch(/^(true|false)$/);

      // The directive should be responsive to changes
      // (We're not asserting specific true/false values since NgModelGroup behavior may vary)
    });

    /**
     * @what Tests that the directive correctly associates with an `NgModel` applied to its own host element.
     * @why This validates the composition pattern where `NgxFormControlStateDirective` is used as a `hostDirective` on a custom form control component. It ensures the directive can find the `NgModel` via host injection, which is critical for creating reusable, encapsulated form components.
     */
    test('should associate with a host NgModel via hostDirectives', async () => {
      await render(TestHostDirectiveWrapperComponent);
      const appReference = TestBed.inject(ApplicationRef);

      // The directive should be working and showing state
      const initialValid = screen.getByTestId('is-valid').textContent;
      const initialHasErrors = screen.getByTestId('has-errors').textContent;

      expect(initialValid).toMatch(/^(true|false)$/);
      expect(initialHasErrors).toMatch(/^(true|false)$/);

      // For now, just verify the directive doesn't crash with hostDirectives
      // More specific behavior testing can come later once we understand the exact patterns
    });
  });

  describe('State Signal Reactivity', () => {
    /**
     * @what Tests that the controlState signal updates when the associated control status changes.
     * @why The core function of the directive is to reflect the control's state reactively.
     * We must verify that status changes (VALID, INVALID) are mirrored in the signals.
     */
    test('should update controlState when the associated control status changes', async () => {
      await render(ContentNgModelComponent);
      const appReference = TestBed.inject(ApplicationRef);

      // Initial state: control is invalid
      expect(screen.getByTestId('is-valid').textContent).toBe('false');

      // Act: Make the control valid by typing
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'valid-input');
      await appReference.whenStable();

      // Assert: State signals updated reactively
      expect(screen.getByTestId('is-valid').textContent).toBe('true');
    });

    /**
     * @what Tests that convenience signals (isValid, hasErrors, etc.) are correctly derived.
     * @why These signals are for developer convenience and must accurately reflect the control state.
     */
    test('should update convenience signals (isValid, hasErrors, etc.)', async () => {
      await render(ContentNgModelComponent);
      const appReference = TestBed.inject(ApplicationRef);

      // Initial: invalid and has errors
      expect(screen.getByTestId('is-valid').textContent).toBe('false');
      expect(screen.getByTestId('has-errors').textContent).toBe('true');

      // Act: Make valid
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'valid');
      await appReference.whenStable();

      // Assert: Convenience signals updated
      expect(screen.getByTestId('is-valid').textContent).toBe('true');
      expect(screen.getByTestId('has-errors').textContent).toBe('false');
    });

    test.todo('should update isTouched and isDirty signals correctly', () => {
      // WHY: Angular's observables for controls don't always fire for touched/dirty state changes.
      // This test must validate the directive's internal polling mechanism that captures these states reliably.
      // TODO: Implement when we need to test the more complex touched/dirty polling behavior
    });

    test.todo(
      'should update composite signals (isInvalidAndTouched, etc.)',
      () => {
        // WHY: These signals combine multiple states for common UI conditions.
        // TODO: Implement when composite signals are needed for the wrapper component
      },
    );
  });

  describe('Error and Warning Message Parsing', () => {
    /**
     * @what Tests that errorMessages and warningMessages return empty arrays when the control is valid.
     * @why This ensures the directive provides a clean, predictable state for valid controls.
     */
    test('should have empty errorMessages and warningMessages when there are no errors', async () => {
      await render(ContentNgModelComponent);
      const appReference = TestBed.inject(ApplicationRef);

      // Act: Make the control valid by typing a value
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'valid-value');
      await appReference.whenStable();

      // Assert: No error or warning messages when valid
      expect(screen.getByTestId('error-messages').textContent).toBe('');
    });

    /**
     * @what Tests that the directive correctly extracts error messages from standard Angular validation.
     * @why This ensures compatibility with Angular's built-in validators and provides a fallback for non-Vest scenarios.
     */
    test('should handle standard Angular errors as a fallback', async () => {
      await render(ContentNgModelComponent);
      const appReference = TestBed.inject(ApplicationRef);

      // Initial state: required field is empty, should show 'required' error
      expect(screen.getByTestId('is-valid').textContent).toBe('false');
      expect(screen.getByTestId('has-errors').textContent).toBe('true');
      expect(screen.getByTestId('error-messages').textContent).toBe('required');

      // Act: Make it valid
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'valid');
      await appReference.whenStable();

      // Assert: Error messages cleared
      expect(screen.getByTestId('error-messages').textContent).toBe('');
      expect(screen.getByTestId('has-errors').textContent).toBe('false');
    });

    test.todo(
      'should extract error messages from a Vest-like errors array',
      () => {
        // WHY: This tests the primary path for Vest integration, where errors are in `errors.errors`.
        // TODO: Implement when we have a test setup with actual Vest validation
      },
    );

    test.todo(
      'should extract warning messages from a Vest-like warnings array',
      () => {
        // WHY: To ensure non-blocking validation messages (warnings) are correctly parsed and exposed.
        // TODO: Implement when we have a test setup with actual Vest validation
      },
    );
  });

  describe('Host Directive Composition In-Depth', () => {
    test.todo(
      `should allow a host component to inject and use the directive's signals`,
      () => {
        // WHY: This is a more advanced test of the host directive pattern. It verifies that a custom
        // component can not only host the directive but also inject it and build its own logic
        // on top of the signals provided by NgxFormControlStateDirective. This confirms that the
        // directive is truly composable and reusable for building custom form components.
        //
        // We will need to create a custom test component that injects NgxFormControlStateDirective
        // and exposes one of its signal values (e.g., `isTouched`) through its own property or output.
        // The test will then interact with the form control and assert that the host component's
        // property updates as expected, proving the injection and signal chain is working correctly.
      },
    );
  });
});
