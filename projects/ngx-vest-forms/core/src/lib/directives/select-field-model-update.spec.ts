import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@vitest/browser/context';
import { describe, expect, it } from 'vitest';
import { SelectTestComponent } from './__tests__/components/select-test.component';

describe('Select Field Form Model Update Bug Investigation', () => {
  it('should update form model when select option is changed', async () => {
    // WHAT: Test if selecting an option in a select field properly updates the form model
    // WHY: To isolate whether the reported bug is in ngx-vest-forms or the E2E test

    await render(SelectTestComponent);

    const roleSelect = screen.getByTestId('role-select');
    const roleValue = screen.getByTestId('role-value');

    // Initial state - role should be empty
    await expect.element(roleValue).toHaveTextContent('');

    // Select "Senior Developer" option
    await userEvent.selectOptions(roleSelect, 'Senior Developer');
    await TestBed.inject(ApplicationRef).whenStable();

    // Check if the form model updated
    await expect.element(roleValue).toHaveTextContent('Senior Developer');

    // Bio field should now be visible due to conditional rendering
    await expect.element(screen.getByTestId('bio-field')).toBeInTheDocument();
  });

  it('should trigger conditional validation when select changes to senior role', async () => {
    // WHAT: Test if changing select to senior role triggers bio validation
    // WHY: To verify the conditional validation logic works when form model updates

    await render(SelectTestComponent);

    const roleSelect = screen.getByTestId('role-select');
    const formErrors = screen.getByTestId('form-errors');

    // Select "Senior Developer"
    await userEvent.selectOptions(roleSelect, 'Senior Developer');
    await TestBed.inject(ApplicationRef).whenStable();

    // Bio field should appear
    const bioField = screen.getByTestId('bio-field');
    await expect.element(bioField).toBeInTheDocument();

    // Trigger validation by focusing and blurring bio field
    await userEvent.click(bioField);
    await userEvent.tab(); // blur
    await TestBed.inject(ApplicationRef).whenStable();

    // Should show bio validation error
    const errorsText = formErrors.textContent;
    expect(errorsText).toContain('Bio is required for senior positions');
  });

  it('should remove bio validation when role changes to non-senior', async () => {
    // WHAT: Test if changing from senior to non-senior role removes bio validation
    // WHY: To verify conditional validation works in both directions

    await render(SelectTestComponent);

    const roleSelect = screen.getByTestId('role-select');
    const formErrors = screen.getByTestId('form-errors');

    // First select senior role
    await userEvent.selectOptions(roleSelect, 'Senior Developer');
    await TestBed.inject(ApplicationRef).whenStable();

    // Trigger bio validation error
    const bioField = screen.getByTestId('bio-field');
    await userEvent.click(bioField);
    await userEvent.tab();
    await TestBed.inject(ApplicationRef).whenStable();

    // Should have bio error
    let errorsText = formErrors.textContent;
    expect(errorsText).toContain('Bio is required for senior positions');

    // Change to non-senior role
    await userEvent.selectOptions(roleSelect, 'Junior Developer');
    await TestBed.inject(ApplicationRef).whenStable();

    // Bio error should be gone and bio field should be hidden
    errorsText = formErrors.textContent;
    expect(errorsText).not.toContain('Bio is required for senior positions');

    // Bio field should no longer be visible
    expect(screen.queryByTestId('bio-field')).not.toBeInTheDocument();
  });

  it('should show form as invalid when role is empty', async () => {
    // WHAT: Test basic validation - form should be invalid with empty role
    // WHY: Baseline test to ensure validation system is working

    await render(SelectTestComponent);

    const formValid = screen.getByTestId('form-valid');

    // Form should be invalid initially (empty role)
    await expect.element(formValid).toHaveTextContent('false');

    // Select a role
    const roleSelect = screen.getByTestId('role-select');
    await userEvent.selectOptions(roleSelect, 'Junior Developer');
    await TestBed.inject(ApplicationRef).whenStable();

    // Form should now be valid (role filled, no bio required for junior)
    await expect.element(formValid).toHaveTextContent('true');
  });
});
