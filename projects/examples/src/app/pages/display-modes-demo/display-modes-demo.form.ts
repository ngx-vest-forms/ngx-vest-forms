import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  createEmptyFormState,
  FormDirective,
  NgxVestForms,
  NgxVestSuite,
} from 'ngx-vest-forms';
import { DisplayModesDemoModel } from '../../models/display-modes-demo.model';
import { Card } from '../../ui/card/card.component';
import { mapWarningsToRecord } from '../../utils/form-warnings.util';

@Component({
  selector: 'ngx-display-modes-demo-form-body',
  imports: [NgxVestForms, Card],
  templateUrl: './display-modes-demo.form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisplayModesDemoFormBody {
  readonly formValue = input.required<DisplayModesDemoModel>();
  readonly suite = input.required<NgxVestSuite<DisplayModesDemoModel>>();

  readonly formValueChange = output<DisplayModesDemoModel>();
  readonly submitted = output();

  private readonly vestForm =
    viewChild<FormDirective<DisplayModesDemoModel>>('vestForm');

  /**
   * Errors updated via the directive's (errorsChange) event binding.
   * The event fires on *every* StatusChangeEvent, making it more reactive
   * than formState.errors when the form's overall status stays the same.
   */
  protected readonly currentErrors = signal<Record<string, string[]>>({});

  /** Exposes the directive's packaged form state with up-to-date errors. */
  readonly formState = computed(() => {
    const state = this.vestForm()?.formState();
    if (!state) return createEmptyFormState<DisplayModesDemoModel>();
    return { ...state, errors: this.currentErrors() };
  });

  /** Exposes field warnings as a plain Record for presentational components. */
  readonly warnings = computed(() =>
    mapWarningsToRecord(this.vestForm()?.fieldWarnings() ?? new Map())
  );

  protected onSubmit(): void {
    this.submitted.emit();
  }
}
