import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgxVestForms, type NgxDeepPartial } from 'ngx-vest-forms';
import { staticSuite, test, enforce, only, warn } from 'vest';

type FormModel = NgxDeepPartial<{
  alwaysError: string;
  dirtyError: string;
  alwaysWarning: string;
  dirtyWarning: string;
  touchWarning: string;
}>;

const validationSuite = staticSuite((model: FormModel, field?: string) => {
  only(field);

  // Error validations
  test('alwaysError', 'This field is required', () => {
    enforce(model.alwaysError).isNotBlank();
  });

  test('dirtyError', 'This field is required', () => {
    enforce(model.dirtyError).isNotBlank();
  });

  // Warning validations
  test('alwaysWarning', 'Username should be at least 5 characters', () => {
    warn();
    enforce(model.alwaysWarning).longerThanOrEquals(5);
  });

  test('dirtyWarning', 'Username should be at least 5 characters', () => {
    warn();
    enforce(model.dirtyWarning).longerThanOrEquals(5);
  });

  test('touchWarning', 'Username should be at least 5 characters', () => {
    warn();
    enforce(model.touchWarning).longerThanOrEquals(5);
  });
});

@Component({
  selector: 'app-display-modes-demo',
  imports: [NgxVestForms],
  templateUrl: './display-modes-demo.component.html',
  styleUrls: ['./display-modes-demo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisplayModesDemoComponent {
  protected readonly formValue = signal<FormModel>({});
  protected readonly suite = validationSuite;

  save(event: Event) {
    event.preventDefault();
    console.log('Form submitted:', this.formValue());
  }
}
