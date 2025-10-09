import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  signal,
  viewChild,
} from '@angular/core';
import { createVestForm, NgxVestForms } from 'ngx-vest-forms';
import { asDebuggerForm } from '../../ui/debugger/debugger';
import { FormArrayModel } from './example-form-array.model';
import {
  validateAddInterest,
  validationSuite,
} from './example-form-array.validation';

@Component({
  selector: 'ngx-example-form-array',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxVestForms],
  templateUrl: './example-form-array.html',
})
export class ExampleFormArray {
  protected readonly form = createVestForm(
    signal<FormArrayModel>({
      interests: [],
    }),
    { suite: validationSuite },
  );

  readonly debugForm = asDebuggerForm(this.form);

  private readonly interestsArray = this.form.array('interests');
  private readonly addInterestInput =
    viewChild<ElementRef<HTMLInputElement>>('addInterestInput');

  // Separate signal for the addInterest input (not part of form model)
  protected readonly addInterestValue = signal('');
  // Manual error tracking for addInterest field
  protected readonly addInterestError = signal<string | null>(null);
  protected readonly addInterestShowError = signal(false);

  protected readonly interestEntries = computed(() =>
    this.interestsArray.map((item, index, field) => ({
      index,
      item,
      field,
      key: `interests.${index}`,
    })),
  );

  protected addInterest(): void {
    const newInterest = this.addInterestValue()?.trim();

    // Validate the addInterest field manually
    const errors = validateAddInterest(newInterest);

    if (errors.length > 0) {
      // Show error
      this.addInterestError.set(errors[0]);
      this.addInterestShowError.set(true);
      console.log('❌ Cannot add invalid interest', { errors });
      return;
    }

    // Valid interest - add to array
    if (newInterest) {
      this.interestsArray.push(newInterest);
    }

    // Clear the input and error state
    this.addInterestValue.set('');
    this.addInterestError.set(null);
    this.addInterestShowError.set(false);

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

  /**
   * Form submission handler
   *
   * Note: No need for event.preventDefault() - handled automatically by [ngxVestForm] directive
   */
  protected async save(): Promise<void> {
    const result = await this.form.submit();

    if (result.valid) {
      console.log('✅ Form validation passed - ready to submit', {
        data: result.data,
      });
    } else {
      console.log('❌ Form validation failed', {
        errors: result.errors,
      });
    }
  }

  protected resetForm(): void {
    // Reset the form to initial state (includes interests array)
    this.form.reset();
  }
}
