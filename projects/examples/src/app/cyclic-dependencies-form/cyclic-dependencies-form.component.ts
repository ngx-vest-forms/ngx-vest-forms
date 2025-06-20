import { JsonPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { VestSuite, ngxVestForms } from 'ngx-vest-forms';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';
import { CyclicFormModel } from './cyclic-dependencies-form.model';
import { createCyclicDependencyFormValidationSuite } from './cyclic.validations';

@Component({
  selector: 'ngx-cyclic-dependencies-form',
  imports: [ngxVestForms, NgxControlWrapper, JsonPipe],
  templateUrl: './cyclic-dependencies-form.component.html',
  styles: `
    :host {
      @apply mx-auto flex max-w-screen-lg flex-col px-4 py-8 lg:py-16;
    }
  `,
})
export class CyclicDependenciesFormComponent {
  protected model = signal<CyclicFormModel>({
    amount: null,
    description: null,
  });

  protected validationConfig = {
    amount: ['description'],
    description: ['amount'],
  };

  protected vestSuite: VestSuite<CyclicFormModel> =
    createCyclicDependencyFormValidationSuite();

  protected save(value: CyclicFormModel) {
    console.log('Form Submitted:', value);
    alert('Form submitted! Check console for details.');
  }
}
