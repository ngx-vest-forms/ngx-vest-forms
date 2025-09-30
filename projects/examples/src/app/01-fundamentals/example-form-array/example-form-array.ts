import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { createVestForm } from 'ngx-vest-forms/core';
import { asDebuggerForm } from '../../ui/debugger/debugger';
import { FormArrayModel } from './example-form-array.model';
import { validationSuite } from './example-form-array.validation';

@Component({
  selector: 'ngx-example-form-array',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './example-form-array.html',
})
export class ExampleFormArray {
  protected readonly form = createVestForm(
    validationSuite,
    signal<FormArrayModel>({
      addInterest: '',
      interests: [],
    }),
  );

  readonly debugForm = asDebuggerForm(this.form);

  private readonly interestsArray = this.form.array('interests');
  private readonly addInterestInput =
    viewChild<ElementRef<HTMLInputElement>>('addInterestInput');

  protected readonly interestEntries = computed(() =>
    this.interestsArray.map((item, index, field) => ({
      index,
      item,
      field,
      key: `interests.${index}`,
    })),
  );

  // Track whether to show addInterest errors
  // Client-side validation for the transient addInterest input field
  private readonly shouldShowAddInterestErrors = signal(false);
  protected readonly addInterestErrorMessage = signal<string | null>(null);

  // Show error when signal is set
  protected readonly showAddInterestErrors = computed(
    () =>
      this.shouldShowAddInterestErrors() &&
      this.addInterestErrorMessage() !== null,
  );

  protected addInterest(): void {
    const newInterest = this.form.addInterest()?.trim();

    // Client-side validation for the transient input field
    if (!newInterest) {
      this.shouldShowAddInterestErrors.set(true);
      this.addInterestErrorMessage.set('Interest cannot be empty');
      console.log('❌ Cannot add empty interest');
      return;
    }

    if (newInterest.length < 2) {
      this.shouldShowAddInterestErrors.set(true);
      this.addInterestErrorMessage.set(
        'Interest must be at least 2 characters',
      );
      console.log('❌ Interest too short');
      return;
    }

    // Valid interest - add to array
    this.interestsArray.push(newInterest);

    // Clear input and reset error state
    this.form.setAddInterest('');
    this.shouldShowAddInterestErrors.set(false);
    this.addInterestErrorMessage.set(null);

    // Focus input for next entry
    this.addInterestInput()?.nativeElement.focus();

    console.log('✅ Interest added successfully', {
      newInterest,
      totalInterests: this.interestsArray.length(),
    });
  }

  protected removeInterest(index: number): void {
    if (this.interestsArray.length() === 0) {
      console.log('❌ No interests to remove');
      return;
    }

    const removedInterest = this.form.interests()[index];
    this.interestsArray.remove(index);

    console.log('✅ Interest removed successfully', {
      removedIndex: index,
      removedInterest,
      remainingInterests: this.interestsArray.length(),
    });
  }

  protected async onSubmit(): Promise<void> {
    try {
      const result = await this.form.submit();
      console.log('✅ Form validation passed - ready to submit', {
        result,
      });
    } catch (error) {
      console.log('❌ Form validation failed', {
        errors: this.form.errors(),
        error,
      });
    }
  }

  protected resetForm(): void {
    // Reset the form to initial state (includes interests array)
    this.form.reset();

    // Clear any client-side validation errors
    this.shouldShowAddInterestErrors.set(false);
    this.addInterestErrorMessage.set(null);
  }
}
