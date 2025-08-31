import { JsonPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { enforce, only, staticSuite, test } from 'vest';
import { ngxVestForms } from '../../../exports';

/**
 * Test form specifically for testing select field behavior with conditional validation
 */
type SelectTestModel = {
  role: string;
  bio: string;
};

const selectTestValidations = staticSuite(
  (data: Partial<SelectTestModel> = {}, field?: string) => {
    only(field);

    test('role', 'Role is required', () => {
      enforce(data.role).isNotEmpty();
    });

    // Conditional validation for bio based on role
    if (data.role === 'Senior Developer' || data.role === 'Team Lead') {
      test('bio', 'Bio is required for senior positions', () => {
        enforce(data.bio).isNotEmpty();
      });
    }
  },
);

@Component({
  imports: [ngxVestForms, JsonPipe],
  template: `
    <form
      ngxVestForm
      [vestSuite]="suite"
      [(formValue)]="model"
      #vestForm="ngxVestForm"
    >
      <label for="role">Role</label>
      <select
        id="role"
        name="role"
        [ngModel]="model().role"
        data-testid="role-select"
      >
        <option value="">Select a role</option>
        <option value="Junior Developer">Junior Developer</option>
        <option value="Senior Developer">Senior Developer</option>
        <option value="Team Lead">Team Lead</option>
      </select>

      <!-- Conditional bio field -->
      @if (
        model().role === 'Senior Developer' || model().role === 'Team Lead'
      ) {
        <label for="bio">Bio</label>
        <textarea
          id="bio"
          name="bio"
          [ngModel]="model().bio"
          data-testid="bio-field"
        ></textarea>
      }

      <!-- Debug output -->
      <div data-testid="role-value">{{ model().role }}</div>
      <div data-testid="form-errors">
        {{ vestForm.formState().errors | json }}
      </div>
      <div data-testid="form-valid">{{ vestForm.formState().valid }}</div>
    </form>
  `,
})
export class SelectTestComponent {
  model = signal<SelectTestModel>({
    role: '',
    bio: '',
  });

  suite = selectTestValidations;
}
