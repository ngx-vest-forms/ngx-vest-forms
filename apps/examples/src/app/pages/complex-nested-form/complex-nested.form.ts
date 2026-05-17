import { KeyValuePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import {
  arrayToObject,
  createFormFeedbackSignals,
  FormDirective,
  NgxVestForms,
  NgxVestSuite,
  provideFormContract,
} from 'ngx-vest-forms';
import {
  ComplexNestedModel,
  complexNestedContract,
  TeamMemberModel,
} from '../../models/complex-nested.model';
import { AddressComponent } from '../../ui/address/address.component';
import { AlertPanel } from '../../ui/alert-panel/alert-panel.component';
import { FormSectionComponent } from '../../ui/form-section/form-section.component';
import { TeamMemberComponent } from './team-member.component';

const emptyMember: TeamMemberModel = { fullName: '', email: '', role: '' };

@Component({
  selector: 'ngx-complex-nested-form-body',
  imports: [
    NgxVestForms,
    KeyValuePipe,
    AlertPanel,
    AddressComponent,
    FormSectionComponent,
    TeamMemberComponent,
  ],
  templateUrl: './complex-nested.form.html',
  providers: [provideFormContract(complexNestedContract)],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComplexNestedFormBody {
  readonly formValue = input.required<ComplexNestedModel>();
  readonly suite = input.required<NgxVestSuite<ComplexNestedModel>>();
  readonly submittedValue = input<ComplexNestedModel | null>(null);

  readonly formValueChange = output<ComplexNestedModel>();
  readonly submitted = output();
  readonly resetRequested = output();

  private readonly vestForm =
    viewChild<FormDirective<ComplexNestedModel>>('vestForm');
  readonly feedback = createFormFeedbackSignals(this.vestForm);

  /** Exposes the directive's packaged form state with up-to-date errors. */
  
  /** Exposes field warnings as a plain Record for presentational components. */
  
  /** Field paths that have been validated (touched/blurred or submitted). */
  
  /** True while async validation is in progress. */
  
  /**
   * Ordered list of `[key, member]` pairs for the @for loop. Keys are a pure
   * function of the current model (contiguous numeric), so the stateless Vest
   * suite re-keys to match the rendered ngModelGroup names on every run.
   */
  protected readonly memberEntries = computed(() =>
    Object.entries(this.formValue().teamMembers ?? {})
  );

  protected onSubmit(): void {
    this.submitted.emit();
  }

  protected onReset(): void {
    this.resetRequested.emit();
  }

  resetFormState(value: ComplexNestedModel): void {
    this.vestForm()?.resetForm(value);
  }

  /**
   * Appends a new member. Mirrors the purchase form's repeatable pattern:
   * take the current values as an array, mutate, then `arrayToObject` back to
   * a contiguous numeric-keyed record. Keys stay deterministic for the model
   * state, so the stateless suite re-keys to match the rendered groups.
   */
  protected addMember(): void {
    const current = this.formValue();
    const members = [
      ...Object.values(current.teamMembers ?? {}),
      { ...emptyMember },
    ];
    this.formValueChange.emit({
      ...current,
      teamMembers: arrayToObject(members),
    });
  }

  /**
   * Removes a member by index, then re-keys the remaining members with
   * `arrayToObject`. The suite reads current keys on every run, so the
   * removed row's Vest tests disappear and the rest stay valid.
   */
  protected removeMember(key: string): void {
    const current = this.formValue();
    const members = Object.values(current.teamMembers ?? {}).filter(
      (_, index) => index !== Number(key)
    );
    this.formValueChange.emit({
      ...current,
      teamMembers: arrayToObject(members),
    });
  }

  protected memberIdPrefix(key: string): string {
    return `team-member-${key}`;
  }
}
