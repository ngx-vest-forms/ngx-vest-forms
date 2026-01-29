import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgxVestForms } from 'ngx-vest-forms';
import { DisplayModesDemoModel } from '../../../models/display-modes-demo.model';
import { displayModesDemoSuite } from '../../../validations/display-modes-demo.validations';

@Component({
  selector: 'app-display-modes-demo',
  imports: [NgxVestForms],
  templateUrl: './display-modes-demo.component.html',
  styleUrls: ['./display-modes-demo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisplayModesDemoComponent {
  protected readonly formValue = signal<DisplayModesDemoModel>({});
  protected readonly suite = displayModesDemoSuite;

  save(event: Event) {
    event.preventDefault();
    console.log('Form submitted:', this.formValue());
  }
}
