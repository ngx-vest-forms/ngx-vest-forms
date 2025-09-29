import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { createVestForm } from 'ngx-vest-forms/core';
import { Debugger, asDebuggerForm } from '../../ui/debugger/debugger';
import { FormArrayModel } from './example-form-array.model';
import { validationSuite } from './example-form-array.validation';

@Component({
  selector: 'ngx-example-form-array',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Debugger],
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

  protected readonly debugForm = asDebuggerForm(this.form);

  private readonly interestsArray = this.form.array('interests');

  protected addInterest(): void {
    this.form.validate('addInterest');

    if (this.form.addInterestErrors().length > 0) {
      console.log('❌ Cannot add interest - validation failed', {
        errors: this.form.addInterestErrors(),
      });
      return;
    }

    const newInterest = this.form.addInterest()?.trim();
    if (!newInterest) {
      console.log('❌ Cannot add empty interest');
      return;
    }

    this.interestsArray.push(newInterest);
    this.form.setAddInterest('');

    console.log('✅ Interest added successfully', {
      newInterest,
      totalInterests: this.form.interests().length,
    });
  }

  protected removeInterest(index: number): void {
    if (this.form.interests().length === 0) {
      console.log('❌ No interests to remove');
      return;
    }

    const removedInterest = this.form.interests()[index];
    this.interestsArray.remove(index);

    console.log('✅ Interest removed successfully', {
      removedIndex: index,
      removedInterest,
      remainingInterests: this.form.interests().length,
    });
  }

  protected updateInterest(index: number, value: Event | string): void {
    this.interestField(index).set(value);
  }

  protected touchInterest(index: number): void {
    this.interestField(index).touch();
  }

  protected showInterestError(index: number): boolean {
    return this.interestField(index).showErrors();
  }

  protected interestValid(index: number): boolean {
    return this.interestField(index).valid();
  }

  protected interestErrors(index: number): string[] {
    return this.interestField(index).errors();
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
    this.form.reset();
  }

  private interestField(index: number) {
    return this.interestsArray.at(index);
  }
}
