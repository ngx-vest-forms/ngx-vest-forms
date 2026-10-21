import { KeyValuePipe } from '@angular/common';
import { Component, computed, input, output, viewChild } from '@angular/core';
import {
  createFormFeedbackSignals,
  FormDirective,
  type NgxSubmitSettledEvent,
  NgxVestForms,
  NgxVestSuite,
  provideFormContract,
} from 'ngx-vest-forms';
import {
  complexNestedContract,
  ComplexNestedModel,
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
})
export class ComplexNestedFormBody {
  readonly formValue = input.required<ComplexNestedModel>();
  readonly suite = input.required<NgxVestSuite<ComplexNestedModel>>();
  readonly submittedValue = input<ComplexNestedModel | null>(null);

  readonly formValueChange = output<ComplexNestedModel>();
  readonly submitted = output<NgxSubmitSettledEvent<ComplexNestedModel>>();
  readonly resetRequested = output();

  private readonly vestForm =
    viewChild<FormDirective<ComplexNestedModel>>('vestForm');
  readonly feedback = createFormFeedbackSignals(this.vestForm);

  /**
   * Ordered list of `[key, member]` pairs for the @for loop. Each key is a
   * stable row id: it never changes while the row exists, so `track` keeps
   * the row's DOM, touched state and errors attached to the right member.
   */
  protected readonly memberEntries = computed(() =>
    Object.entries(this.formValue().teamMembers ?? {})
  );

  protected onSubmitSettled(
    event: NgxSubmitSettledEvent<ComplexNestedModel>
  ): void {
    this.submitted.emit(event);
  }

  protected onReset(): void {
    this.resetRequested.emit();
  }

  resetFormState(value: ComplexNestedModel): void {
    this.vestForm()?.resetForm(value);
  }

  /** Next row id to hand out; ids are never reused within this form. */
  #nextMemberId = 0;

  /**
   * Appends a new member under a fresh, never-reused id. Ids are numeric
   * strings so the form contract's single `'0'` entry still describes every
   * row.
   */
  protected addMember(): void {
    const current = this.formValue();
    const members = current.teamMembers ?? {};
    const nextId = this.#nextIdAfter(members);
    this.#nextMemberId = nextId + 1;
    this.formValueChange.emit({
      ...current,
      teamMembers: { ...members, [String(nextId)]: { ...emptyMember } },
    });
  }

  /**
   * Removes one member by id. The other rows keep their ids, so their
   * touched state and errors stay with them instead of shifting to the next
   * row; the suite reads the current keys on every run, so the removed row's
   * tests disappear with it.
   */
  protected removeMember(key: string): void {
    const current = this.formValue();
    // Record the highest id in use before it can disappear, so a later add
    // never reuses the removed id (the initial rows never went through add).
    this.#nextMemberId = this.#nextIdAfter(current.teamMembers ?? {});
    const remaining = Object.entries(current.teamMembers ?? {}).filter(
      ([id]) => id !== key
    );
    this.formValueChange.emit({
      ...current,
      teamMembers: Object.fromEntries(remaining),
    });
  }

  /** The first id not yet handed out and not used by any current row. */
  #nextIdAfter(members: Record<string, unknown>): number {
    return Math.max(
      this.#nextMemberId,
      ...Object.keys(members).map((key) => Number(key) + 1)
    );
  }

  protected memberIdPrefix(key: string): string {
    return `team-member-${key}`;
  }
}
